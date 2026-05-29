package controller

import (
	"context"
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"fmt"
	"html"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/QuantumNous/new-api/setting/system_setting"

	"github.com/gin-gonic/gin"
	"github.com/go-pay/gopay"
	"github.com/go-pay/gopay/alipay"
	"github.com/shopspring/decimal"
)

// buildAlipayAutoPostForm 将支付宝 GET URL 转换为 HTML 自动 POST 表单。
// 支付宝生产环境 alipay.trade.page.pay 要求 POST，直接 GET 会返回 invalid-method；
// 且 charset 参数必须放在 URL 查询字符串中，否则会返回 invalid-signature。
func buildAlipayAutoPostForm(payUrl string) (string, error) {
	u, err := url.Parse(payUrl)
	if err != nil {
		return "", err
	}
	query := u.Query()
	charset := query.Get("charset")
	if charset == "" {
		charset = "utf-8"
	}
	// charset 必须在 URL 中，从 body 中移除避免重复
	query.Del("charset")

	actionUrl := u.Scheme + "://" + u.Host + u.Path + "?charset=" + url.QueryEscape(charset)

	var inputs strings.Builder
	for key, values := range query {
		for _, v := range values {
			inputs.WriteString(fmt.Sprintf(`<input type="hidden" name="%s" value="%s"/>`,
				html.EscapeString(key), html.EscapeString(v)))
		}
	}
	return fmt.Sprintf(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting to Alipay...</title></head><body>
<form id="alipay_submit_form" method="POST" action="%s" accept-charset="UTF-8">%s</form>
<script>document.getElementById("alipay_submit_form").submit();</script>
</body></html>`, html.EscapeString(actionUrl), inputs.String()), nil
}

type AlipayRequest struct {
	Amount        int64  `json:"amount"`
	PaymentMethod string `json:"payment_method"`
}

func getAlipayMinTopup() int64 {
	minTopup := setting.AlipayMinTopUp
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		minTopup = minTopup * int(common.QuotaPerUnit)
	}
	return int64(minTopup)
}

func newAlipayClient(returnUrl, notifyUrl string) (*alipay.Client, error) {
	client, err := alipay.NewClient(setting.AlipayAppId, setting.AlipayPrivateKey, !setting.AlipaySandbox)
	if err != nil {
		return nil, err
	}
	client.Charset = "utf-8"
	client.SignType = alipay.RSA2
	client.ReturnUrl = returnUrl
	client.NotifyUrl = notifyUrl
	return client, nil
}

func RequestAlipayPay(c *gin.Context) {
	var req AlipayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}
	if req.PaymentMethod != model.PaymentMethodAlipay {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "不支持的支付渠道"})
		return
	}
	if req.Amount < getAlipayMinTopup() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("充值数量不能小于 %d", getAlipayMinTopup())})
		return
	}

	id := c.GetInt("id")
	group, err := model.GetUserGroup(id, true)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "获取用户分组失败"})
		return
	}
	payMoney := getPayMoney(req.Amount, group)
	if payMoney < 0.01 {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值金额过低"})
		return
	}

	tradeNo := fmt.Sprintf("USR%dALI%s%d", id, common.GetRandomString(6), time.Now().Unix())

	returnUrl := setting.AlipayReturnUrl
	if returnUrl == "" {
		// 根据当前主题选择默认回跳路径：default 主题走 /wallet，classic 主题走 /console/log
		if common.GetTheme() == "default" {
			returnUrl = system_setting.ServerAddress + "/wallet?show_history=true"
		} else {
			returnUrl = system_setting.ServerAddress + "/console/log"
		}
	}
	client, err := newAlipayClient(returnUrl, setting.AlipayNotifyUrl)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("支付宝 创建客户端失败 user_id=%d error=%q", id, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}

	bm := make(gopay.BodyMap)
	bm.Set("subject", fmt.Sprintf("充值 %d 额度", req.Amount))
	bm.Set("out_trade_no", tradeNo)
	bm.Set("total_amount", strconv.FormatFloat(payMoney, 'f', 2, 64))
	bm.Set("product_code", "FAST_INSTANT_TRADE_PAY")

	payUrl, err := client.TradePagePay(c.Request.Context(), bm)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("支付宝 拉起支付失败 user_id=%d trade_no=%s amount=%d error=%q", id, tradeNo, req.Amount, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}

	payForm, err := buildAlipayAutoPostForm(payUrl)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("支付宝 构造支付表单失败 user_id=%d trade_no=%s error=%q", id, tradeNo, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}

	// 标准化存储的 Amount：若展示类型为 Token 则换算回基础单位
	amount := req.Amount
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		amount = decimal.NewFromInt(req.Amount).Div(decimal.NewFromFloat(common.QuotaPerUnit)).IntPart()
	}
	topUp := &model.TopUp{
		UserId:          id,
		Amount:          amount,
		Money:           payMoney,
		TradeNo:         tradeNo,
		PaymentMethod:   model.PaymentMethodAlipay,
		PaymentProvider: model.PaymentProviderAlipay,
		CreateTime:      time.Now().Unix(),
		Status:          common.TopUpStatusPending,
	}
	// Capture tiered fee info for audit
	feeInfo := computeTopupFee(float64(amount), group)
	topUp.FeeRate = feeInfo.FeeRate
	topUp.FeeAmount = feeInfo.FeeAmount
	topUp.UsdAmount = feeInfo.UsdAmount
	topUp.ExchangeRate = feeInfo.ExchangeRate
	topUp.CnyPayAmount = decimal.NewFromFloat(feeInfo.CnyPayAmount).Round(2).InexactFloat64()
	if err = topUp.Insert(); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("支付宝 创建充值订单失败 user_id=%d trade_no=%s error=%q", id, tradeNo, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建订单失败"})
		return
	}

	logger.LogInfo(c.Request.Context(), fmt.Sprintf("支付宝 充值订单创建成功 user_id=%d trade_no=%s amount=%d money=%.2f", id, tradeNo, req.Amount, payMoney))
	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data":    gin.H{"pay_form": payForm},
	})
}

func RequestAlipayAmount(c *gin.Context) {
	var req AlipayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}
	if req.Amount < getAlipayMinTopup() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("充值数量不能小于 %d", getAlipayMinTopup())})
		return
	}
	id := c.GetInt("id")
	group, err := model.GetUserGroup(id, true)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "获取用户分组失败"})
		return
	}
	payMoney := getPayMoney(req.Amount, group)
	if payMoney <= 0.01 {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值金额过低"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "success", "data": strconv.FormatFloat(payMoney, 'f', 2, 64)})
}

// AlipayNotify 处理支付宝异步通知（POST）和同步返回（GET）
func AlipayNotify(c *gin.Context) {
	if !isAlipayWebhookEnabled() {
		logger.LogWarn(c.Request.Context(), fmt.Sprintf("支付宝 webhook 被拒绝 reason=webhook_disabled path=%q client_ip=%s", c.Request.RequestURI, c.ClientIP()))
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}

	params, err := parseAlipayNotifyParams(c)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("支付宝 webhook 参数解析失败 error=%q client_ip=%s", err.Error(), c.ClientIP()))
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}
	if len(params) == 0 {
		logger.LogWarn(c.Request.Context(), fmt.Sprintf("支付宝 webhook 参数为空 client_ip=%s", c.ClientIP()))
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}

	logger.LogInfo(c.Request.Context(), fmt.Sprintf("支付宝 webhook 收到请求 client_ip=%s params=%q", c.ClientIP(), common.GetJsonString(params)))

	if err := verifyAlipayNotify(params, setting.AlipayPublicKey); err != nil {
		logger.LogWarn(c.Request.Context(), fmt.Sprintf("支付宝 webhook 验签失败 client_ip=%s error=%q", c.ClientIP(), err.Error()))
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}

	tradeStatus := params["trade_status"]
	tradeNo := params["out_trade_no"]
	logger.LogInfo(c.Request.Context(), fmt.Sprintf("支付宝 webhook 验签成功 trade_no=%s trade_status=%s client_ip=%s", tradeNo, tradeStatus, c.ClientIP()))

	switch tradeStatus {
	case "TRADE_SUCCESS", "TRADE_FINISHED":
		alipayFulfillOrder(c.Request.Context(), tradeNo, c.ClientIP())
	case "TRADE_CLOSED":
		logger.LogInfo(c.Request.Context(), fmt.Sprintf("支付宝 交易已关闭 trade_no=%s client_ip=%s", tradeNo, c.ClientIP()))
		_ = model.UpdatePendingTopUpStatus(tradeNo, model.PaymentProviderAlipay, common.TopUpStatusFailed)
	default:
		logger.LogInfo(c.Request.Context(), fmt.Sprintf("支付宝 webhook 忽略事件 trade_no=%s trade_status=%s client_ip=%s", tradeNo, tradeStatus, c.ClientIP()))
	}

	_, _ = c.Writer.Write([]byte("success"))
}

func alipayFulfillOrder(ctx context.Context, tradeNo string, callerIp string) {
	if tradeNo == "" {
		logger.LogWarn(ctx, "支付宝 回调缺少订单号")
		return
	}
	LockOrder(tradeNo)
	defer UnlockOrder(tradeNo)

	if err := model.RechargeAlipay(tradeNo, callerIp); err != nil {
		logger.LogError(ctx, fmt.Sprintf("支付宝 充值处理失败 trade_no=%s client_ip=%s error=%q", tradeNo, callerIp, err.Error()))
		return
	}
	logger.LogInfo(ctx, fmt.Sprintf("支付宝 充值成功 trade_no=%s client_ip=%s", tradeNo, callerIp))
}

func parseAlipayNotifyParams(c *gin.Context) (map[string]string, error) {
	params := make(map[string]string)
	if c.Request.Method == "POST" {
		if err := c.Request.ParseForm(); err != nil {
			return nil, err
		}
		for k, vs := range c.Request.PostForm {
			if len(vs) > 0 {
				params[k] = vs[0]
			}
		}
	} else {
		for k, vs := range c.Request.URL.Query() {
			if len(vs) > 0 {
				params[k] = vs[0]
			}
		}
	}
	return params, nil
}

// verifyAlipayNotify 手动实现 RSA2（SHA256withRSA）验签
func verifyAlipayNotify(params map[string]string, alipayPublicKey string) error {
	signBase64, ok := params["sign"]
	if !ok || signBase64 == "" {
		return errors.New("缺少 sign 字段")
	}

	// 构造待验签字符串：排除 sign 和 sign_type，按 key 字母升序拼接
	keys := make([]string, 0, len(params))
	for k := range params {
		if k != "sign" && k != "sign_type" {
			keys = append(keys, k)
		}
	}
	sort.Strings(keys)
	pairs := make([]string, 0, len(keys))
	for _, k := range keys {
		if params[k] != "" {
			pairs = append(pairs, k+"="+params[k])
		}
	}
	message := strings.Join(pairs, "&")

	// 解析支付宝公钥（支持带或不带 PEM 头尾）
	pkStr := strings.TrimSpace(alipayPublicKey)
	if !strings.HasPrefix(pkStr, "-----") {
		pkStr = "-----BEGIN PUBLIC KEY-----\n" + pkStr + "\n-----END PUBLIC KEY-----"
	}
	block, _ := pem.Decode([]byte(pkStr))
	if block == nil {
		return errors.New("无法解析支付宝公钥 PEM")
	}
	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return fmt.Errorf("解析支付宝公钥失败: %w", err)
	}
	rsaPub, ok := pub.(*rsa.PublicKey)
	if !ok {
		return errors.New("支付宝公钥不是 RSA 公钥")
	}

	sigBytes, err := base64.StdEncoding.DecodeString(signBase64)
	if err != nil {
		return fmt.Errorf("解码签名失败: %w", err)
	}

	hash := sha256.Sum256([]byte(message))
	if err := rsa.VerifyPKCS1v15(rsaPub, crypto.SHA256, hash[:], sigBytes); err != nil {
		return fmt.Errorf("RSA2 验签不通过: %w", err)
	}
	return nil
}
