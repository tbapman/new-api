package controller

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"

	"github.com/gin-gonic/gin"
	"github.com/go-pay/gopay"
	wechat "github.com/go-pay/gopay/wechat/v3"
	"github.com/shopspring/decimal"
)

type WxpayRequest struct {
	Amount        int64  `json:"amount"`
	PaymentMethod string `json:"payment_method"`
}

// wxpayNotifyResource 微信支付 V3 通知中的加密资源字段
type wxpayNotifyResource struct {
	Algorithm      string `json:"algorithm"`
	Ciphertext     string `json:"ciphertext"`
	Nonce          string `json:"nonce"`
	AssociatedData string `json:"associated_data"`
}

// wxpayNotifyBody 微信支付 V3 通知请求体
type wxpayNotifyBody struct {
	EventType string              `json:"event_type"`
	Summary   string              `json:"summary"`
	Resource  wxpayNotifyResource `json:"resource"`
}

// wxpayTransaction 解密后的交易信息
type wxpayTransaction struct {
	OutTradeNo    string `json:"out_trade_no"`
	TransactionId string `json:"transaction_id"`
	TradeState    string `json:"trade_state"`
}

func getWxpayMinTopup() int64 {
	minTopup := setting.WxpayMinTopUp
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		minTopup = minTopup * int(common.QuotaPerUnit)
	}
	return int64(minTopup)
}

// normalizeWxpayPrivateKey 支持纯 base64 或带 PEM 头尾的私钥
func normalizeWxpayPrivateKey(key string) string {
	key = strings.TrimSpace(key)
	if strings.HasPrefix(key, "-----") {
		return key
	}
	return "-----BEGIN PRIVATE KEY-----\n" + key + "\n-----END PRIVATE KEY-----"
}

func newWxpayClient() (*wechat.ClientV3, error) {
	privateKey := normalizeWxpayPrivateKey(setting.WxpayPrivateKey)
	return wechat.NewClientV3(setting.WxpayMchId, setting.WxpayCertSerialNo, setting.WxpayApiV3Key, privateKey)
}

func RequestWxpayPay(c *gin.Context) {
	var req WxpayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}
	if req.PaymentMethod != model.PaymentMethodWxpay {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "不支持的支付渠道"})
		return
	}
	if req.Amount < getWxpayMinTopup() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("充值数量不能小于 %d", getWxpayMinTopup())})
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

	tradeNo := fmt.Sprintf("USR%dWX%s%d", id, common.GetRandomString(6), time.Now().Unix())

	client, err := newWxpayClient()
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("微信支付 创建客户端失败 user_id=%d error=%q", id, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}

	// 过期时间（RFC3339，Asia/Shanghai 时区）
	loc, _ := time.LoadLocation("Asia/Shanghai")
	expireAt := time.Now().In(loc).Add(time.Duration(setting.WxpayTimeoutMinutes) * time.Minute)
	timeExpire := expireAt.Format("2006-01-02T15:04:05-07:00")

	// 金额单位：分
	totalFen := int(decimal.NewFromFloat(payMoney).Mul(decimal.NewFromInt(100)).IntPart())

	bm := make(gopay.BodyMap)
	bm.Set("appid", setting.WxpayAppId)
	bm.Set("description", fmt.Sprintf("充值 %d 额度", req.Amount))
	bm.Set("out_trade_no", tradeNo)
	bm.Set("notify_url", setting.WxpayNotifyUrl)
	bm.Set("time_expire", timeExpire)
	bm.SetBodyMap("amount", func(b gopay.BodyMap) {
		b.Set("total", totalFen)
		b.Set("currency", "CNY")
	})

	wxRsp, err := client.V3TransactionNative(c.Request.Context(), bm)
	if err != nil || wxRsp.Response == nil {
		errMsg := "拉起支付失败"
		if err != nil {
			errMsg = err.Error()
		}
		logger.LogError(c.Request.Context(), fmt.Sprintf("微信支付 创建 Native 订单失败 user_id=%d trade_no=%s amount=%d error=%q", id, tradeNo, req.Amount, errMsg))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}

	// 标准化存储的 Amount
	amount := req.Amount
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		amount = decimal.NewFromInt(req.Amount).Div(decimal.NewFromFloat(common.QuotaPerUnit)).IntPart()
	}
	topUp := &model.TopUp{
		UserId:          id,
		Amount:          amount,
		Money:           payMoney,
		TradeNo:         tradeNo,
		PaymentMethod:   model.PaymentMethodWxpay,
		PaymentProvider: model.PaymentProviderWxpay,
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
		logger.LogError(c.Request.Context(), fmt.Sprintf("微信支付 创建充值订单失败 user_id=%d trade_no=%s error=%q", id, tradeNo, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建订单失败"})
		return
	}

	logger.LogInfo(c.Request.Context(), fmt.Sprintf("微信支付 充值订单创建成功 user_id=%d trade_no=%s amount=%d money=%.2f fen=%d", id, tradeNo, req.Amount, payMoney, totalFen))
	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data":    gin.H{"code_url": wxRsp.Response.CodeUrl},
	})
}

func RequestWxpayAmount(c *gin.Context) {
	var req WxpayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}
	if req.Amount < getWxpayMinTopup() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("充值数量不能小于 %d", getWxpayMinTopup())})
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

// WxpayNotify 处理微信支付 V3 异步通知
func WxpayNotify(c *gin.Context) {
	ctx := c.Request.Context()
	if !isWxpayWebhookEnabled() {
		logger.LogWarn(ctx, fmt.Sprintf("微信支付 webhook 被拒绝 reason=webhook_disabled path=%q client_ip=%s", c.Request.RequestURI, c.ClientIP()))
		c.JSON(http.StatusForbidden, gin.H{"code": "FAIL", "message": "webhook disabled"})
		return
	}

	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		logger.LogError(ctx, fmt.Sprintf("微信支付 webhook 读取请求体失败 client_ip=%s error=%q", c.ClientIP(), err.Error()))
		c.JSON(http.StatusBadRequest, gin.H{"code": "FAIL", "message": "read body failed"})
		return
	}

	logger.LogInfo(ctx, fmt.Sprintf("微信支付 webhook 收到请求 client_ip=%s body=%q", c.ClientIP(), string(body)))

	var nb wxpayNotifyBody
	if err := common.Unmarshal(body, &nb); err != nil {
		logger.LogError(ctx, fmt.Sprintf("微信支付 webhook 解析请求体失败 client_ip=%s error=%q", c.ClientIP(), err.Error()))
		c.JSON(http.StatusBadRequest, gin.H{"code": "FAIL", "message": "invalid body"})
		return
	}

	// 解密通知资源（AEAD_AES_256_GCM）
	if nb.Resource.Algorithm != "AEAD_AES_256_GCM" {
		logger.LogError(ctx, fmt.Sprintf("微信支付 webhook 不支持的加密算法 algorithm=%s client_ip=%s", nb.Resource.Algorithm, c.ClientIP()))
		c.JSON(http.StatusBadRequest, gin.H{"code": "FAIL", "message": "unsupported algorithm"})
		return
	}
	plaintext, err := decryptWxpayNotify(setting.WxpayApiV3Key, nb.Resource.Ciphertext, nb.Resource.Nonce, nb.Resource.AssociatedData)
	if err != nil {
		logger.LogError(ctx, fmt.Sprintf("微信支付 webhook 解密失败 client_ip=%s error=%q", c.ClientIP(), err.Error()))
		c.JSON(http.StatusBadRequest, gin.H{"code": "FAIL", "message": "decrypt failed"})
		return
	}

	var tx wxpayTransaction
	if err := json.Unmarshal([]byte(plaintext), &tx); err != nil {
		logger.LogError(ctx, fmt.Sprintf("微信支付 webhook 解析交易信息失败 client_ip=%s error=%q body=%q", c.ClientIP(), err.Error(), plaintext))
		c.JSON(http.StatusBadRequest, gin.H{"code": "FAIL", "message": "invalid transaction"})
		return
	}

	logger.LogInfo(ctx, fmt.Sprintf("微信支付 webhook 解密成功 event_type=%s trade_no=%s transaction_id=%s trade_state=%s client_ip=%s", nb.EventType, tx.OutTradeNo, tx.TransactionId, tx.TradeState, c.ClientIP()))

	switch tx.TradeState {
	case "SUCCESS":
		wxpayFulfillOrder(ctx, tx.OutTradeNo, c.ClientIP())
	case "CLOSED", "PAYERROR":
		logger.LogInfo(ctx, fmt.Sprintf("微信支付 交易失败/关闭 trade_no=%s trade_state=%s client_ip=%s", tx.OutTradeNo, tx.TradeState, c.ClientIP()))
		_ = model.UpdatePendingTopUpStatus(tx.OutTradeNo, model.PaymentProviderWxpay, common.TopUpStatusFailed)
	default:
		logger.LogInfo(ctx, fmt.Sprintf("微信支付 webhook 忽略事件 trade_no=%s trade_state=%s client_ip=%s", tx.OutTradeNo, tx.TradeState, c.ClientIP()))
	}

	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS"})
}

func wxpayFulfillOrder(ctx context.Context, tradeNo string, callerIp string) {
	if tradeNo == "" {
		logger.LogWarn(ctx, "微信支付 回调缺少订单号")
		return
	}
	LockOrder(tradeNo)
	defer UnlockOrder(tradeNo)

	if err := model.RechargeWxpay(tradeNo, callerIp); err != nil {
		logger.LogError(ctx, fmt.Sprintf("微信支付 充值处理失败 trade_no=%s client_ip=%s error=%q", tradeNo, callerIp, err.Error()))
		return
	}
	logger.LogInfo(ctx, fmt.Sprintf("微信支付 充值成功 trade_no=%s client_ip=%s", tradeNo, callerIp))
}

// decryptWxpayNotify 使用 AEAD_AES_256_GCM 解密微信支付通知资源
func decryptWxpayNotify(apiV3Key, ciphertext, nonce, associatedData string) (string, error) {
	cipherBytes, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", fmt.Errorf("base64 解码 ciphertext 失败: %w", err)
	}
	block, err := aes.NewCipher([]byte(apiV3Key))
	if err != nil {
		return "", fmt.Errorf("创建 AES 密码块失败: %w", err)
	}
	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("创建 GCM 失败: %w", err)
	}
	plaintext, err := aesGCM.Open(nil, []byte(nonce), cipherBytes, []byte(associatedData))
	if err != nil {
		return "", fmt.Errorf("AES-GCM 解密失败: %w", err)
	}
	return string(plaintext), nil
}
