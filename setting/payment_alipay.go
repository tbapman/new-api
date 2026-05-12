package setting

var (
	AlipayEnabled    bool
	AlipayAppId      string
	AlipayPrivateKey string // 商户 RSA2 私钥（PKCS1，PEM 或纯 base64）
	AlipayPublicKey  string // 支付宝平台公钥，用于验签
	AlipayNotifyUrl  string
	AlipayReturnUrl  string
	AlipayMinTopUp   int  = 1
	AlipaySandbox    bool // true = 沙箱环境
)
