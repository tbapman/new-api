package setting

var (
	WxpayEnabled        bool
	WxpayAppId          string
	WxpayMchId          string // 商户号
	WxpayApiV3Key       string // APIv3 密钥（32 字节）
	WxpayCertSerialNo   string // 商户 API 证书序列号
	WxpayPrivateKey     string // 商户 API 私钥（PKCS8 PEM 或纯 base64）
	WxpayNotifyUrl      string
	WxpayTimeoutMinutes int = 30
	WxpayMinTopUp       int = 1
)
