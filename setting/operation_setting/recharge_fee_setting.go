package operation_setting

import "github.com/QuantumNous/new-api/setting/config"

// RechargeFeeRule defines a single tier of the recharge surcharge table.
// MinAmount is inclusive; MaxAmount is exclusive (-1 means no upper bound).
type RechargeFeeRule struct {
	MinAmount float64 `json:"min_amount"`
	MaxAmount float64 `json:"max_amount"`
	FeeRate   float64 `json:"fee_rate"` // decimal fraction, e.g. 0.03 = 3%
}

// RechargeFeeConfig holds the tiered recharge surcharge settings.
type RechargeFeeConfig struct {
	Enabled     bool              `json:"enabled"`
	MinTopUpUSD float64           `json:"min_topup_usd"`
	FeeRules    []RechargeFeeRule `json:"fee_rules"`
}

var rechargeFeeConfig = RechargeFeeConfig{
	Enabled:     false,
	MinTopUpUSD: 5,
	FeeRules: []RechargeFeeRule{
		{MinAmount: 5, MaxAmount: 10, FeeRate: 0.03},
		{MinAmount: 10, MaxAmount: 50, FeeRate: 0.02},
		{MinAmount: 50, MaxAmount: 200, FeeRate: 0.015},
		{MinAmount: 200, MaxAmount: 1000, FeeRate: 0.01},
		{MinAmount: 1000, MaxAmount: -1, FeeRate: 0},
	},
}

func init() {
	config.GlobalConfig.Register("recharge_fee_config", &rechargeFeeConfig)
}

func GetRechargeFeeConfig() *RechargeFeeConfig {
	return &rechargeFeeConfig
}

// GetApplicableFeeRate returns the fee rate for the given USD amount.
// Returns 0 if no matching rule is found.
func (cfg *RechargeFeeConfig) GetApplicableFeeRate(usdAmount float64) float64 {
	for _, rule := range cfg.FeeRules {
		if usdAmount >= rule.MinAmount && (rule.MaxAmount < 0 || usdAmount < rule.MaxAmount) {
			return rule.FeeRate
		}
	}
	return 0
}
