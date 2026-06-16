import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { getSelf } from '@/lib/api'
import { useStatus } from '@/hooks/use-status'
import { useSystemConfig } from '@/hooks/use-system-config'
import { SectionPageLayout } from '@/components/layout'
import { AffiliateRewardsCard } from './components/affiliate-rewards-card'
import { BillingHistoryDialog } from './components/dialogs/billing-history-dialog'
import { CreemConfirmDialog } from './components/dialogs/creem-confirm-dialog'
import { PaymentConfirmDialog } from './components/dialogs/payment-confirm-dialog'
import { TransferDialog } from './components/dialogs/transfer-dialog'
import { WxpayQrDialog } from './components/dialogs/wxpay-qr-dialog'
import { RechargeFormCard } from './components/recharge-form-card'
import { SubscriptionPlansCard } from './components/subscription-plans-card'
import { WalletStatsCard } from './components/wallet-stats-card'
import { DEFAULT_DISCOUNT_RATE, PAYMENT_TYPES } from './constants'
import {
  useTopupInfo,
  usePayment,
  useAffiliate,
  useRedemption,
  useCreemPayment,
  useWaffoPayment,
  useWaffoPancakePayment,
  useAlipayPayment,
  useWxpayPayment,
} from './hooks'
import {
  getDefaultPaymentType,
  getMinTopupAmount,
  isWaffoPancakePayment,
} from './lib'
import { previewTopupFee, queryWxpayOrder } from './api'
import type {
  UserWalletData,
  PaymentMethod,
  PresetAmount,
  CreemProduct,
  FeePreviewData,
} from './types'

interface WalletProps {
  initialShowHistory?: boolean
}

export function Wallet(props: WalletProps) {
  const { t } = useTranslation()
  const [user, setUser] = useState<UserWalletData | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [topupAmount, setTopupAmount] = useState(0)
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>()
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [billingDialogOpen, setBillingDialogOpen] = useState(false)
  const [redemptionCode, setRedemptionCode] = useState('')
  const [creemDialogOpen, setCreemDialogOpen] = useState(false)
  const [selectedCreemProduct, setSelectedCreemProduct] =
    useState<CreemProduct | null>(null)
  const [showSubscriptionPanel, setShowSubscriptionPanel] = useState(true)
  const [feePreview, setFeePreview] = useState<FeePreviewData | null>(null)
  const [feeCalculating, setFeeCalculating] = useState(false)
  const feeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { status } = useStatus()
  const { currency } = useSystemConfig()
  const { topupInfo, presetAmounts, loading: topupLoading } = useTopupInfo()

  // Calculate effective exchange rate - when display type is USD, use rate of 1
  const effectiveUsdExchangeRate = useMemo(() => {
    return currency?.quotaDisplayType === 'USD'
      ? 1
      : currency?.usdExchangeRate || 1
  }, [currency?.quotaDisplayType, currency?.usdExchangeRate])
  const {
    amount: paymentAmount,
    calculating,
    processing,
    calculatePaymentAmount,
    processPayment,
  } = usePayment()
  const {
    affiliateLink,
    loading: affiliateLoading,
    transferQuota,
    transferring,
  } = useAffiliate()
  const { redeeming, redeemCode } = useRedemption()
  const { processing: creemProcessing, processCreemPayment } = useCreemPayment()
  const { processWaffoPayment } = useWaffoPayment()
  const { processing: pancakeProcessing, processWaffoPancakePayment } =
    useWaffoPancakePayment()
  const {
    amount: alipayPaymentAmount,
    calculating: alipayCalculating,
    processing: alipayProcessing,
    calculateAlipayPaymentAmount,
    processAlipayPayment,
  } = useAlipayPayment()
  const {
    amount: wxpayPaymentAmount,
    calculating: wxpayCalculating,
    processing: wxpayProcessing,
    qrCodeUrl,
    qrDialogOpen,
    tradeNo: wxpayTradeNo,
    setQrDialogOpen,
    calculateWxpayPaymentAmount,
    processWxpayPayment,
  } = useWxpayPayment()

  // Fetch and refresh user data
  const fetchUser = useCallback(async () => {
    try {
      setUserLoading(true)
      const response = await getSelf()
      if (response.success && response.data) {
        setUser(response.data as UserWalletData)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch user data:', error)
    } finally {
      setUserLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  useEffect(() => {
    if (props.initialShowHistory) {
      setBillingDialogOpen(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [props.initialShowHistory])

  // Poll WeChat Pay order status while the QR dialog is open.
  // WeChat Native pay completes on the user's phone with no browser redirect,
  // so we poll the backend and, on success, close the dialog, refresh the
  // balance and open billing history (mirroring Alipay's show_history return).
  useEffect(() => {
    if (!qrDialogOpen || !wxpayTradeNo) return

    let cancelled = false
    const interval = setInterval(async () => {
      try {
        const res = await queryWxpayOrder(wxpayTradeNo)
        if (cancelled) return
        const status = res.data?.status
        if (status === 'success') {
          clearInterval(interval)
          setQrDialogOpen(false)
          toast.success(t('Payment successful'))
          await fetchUser()
          setBillingDialogOpen(true)
        } else if (status === 'failed' || status === 'expired') {
          clearInterval(interval)
          setQrDialogOpen(false)
          toast.error(t('Payment failed or order expired'))
        }
      } catch {
        // transient error — keep polling until the dialog is closed
      }
    }, 3000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [qrDialogOpen, wxpayTradeNo, fetchUser, setQrDialogOpen, t])

  // Initialize topup amount when topup info is loaded
  useEffect(() => {
    if (topupInfo && topupAmount === 0) {
      const minTopup = getMinTopupAmount(topupInfo)
      setTopupAmount(minTopup)

      const defaultPaymentType = getDefaultPaymentType(topupInfo)
      if (defaultPaymentType === PAYMENT_TYPES.ALIPAY) {
        calculateAlipayPaymentAmount(minTopup)
      } else if (defaultPaymentType === PAYMENT_TYPES.WECHAT) {
        calculateWxpayPaymentAmount(minTopup)
      } else {
        calculatePaymentAmount(minTopup, defaultPaymentType)
      }
    }
  }, [topupInfo, topupAmount, calculatePaymentAmount, calculateAlipayPaymentAmount, calculateWxpayPaymentAmount])

  // Debounced fee preview when fee config is enabled and amount changes
  useEffect(() => {
    if (!topupInfo?.recharge_fee_enabled || topupAmount <= 0) {
      setFeePreview(null)
      return
    }
    if (feeDebounceRef.current) clearTimeout(feeDebounceRef.current)
    setFeeCalculating(true)
    feeDebounceRef.current = setTimeout(async () => {
      try {
        const res = await previewTopupFee({ amount: topupAmount })
        if (res.success && res.data) {
          setFeePreview(res.data)
        }
      } catch {
        // silent — preview is best-effort
      } finally {
        setFeeCalculating(false)
      }
    }, 300)
    return () => {
      if (feeDebounceRef.current) clearTimeout(feeDebounceRef.current)
    }
  }, [topupAmount, topupInfo?.recharge_fee_enabled])

  // Dispatch amount calculation to the right provider
  const dispatchCalculateAmount = useCallback(
    async (topupAmt: number, paymentType: string) => {
      if (paymentType === PAYMENT_TYPES.ALIPAY) {
        return calculateAlipayPaymentAmount(topupAmt)
      }
      if (paymentType === PAYMENT_TYPES.WECHAT) {
        return calculateWxpayPaymentAmount(topupAmt)
      }
      return calculatePaymentAmount(topupAmt, paymentType)
    },
    [calculateAlipayPaymentAmount, calculateWxpayPaymentAmount, calculatePaymentAmount]
  )

  // Get current payment type (selected or default)
  const getCurrentPaymentType = useCallback(() => {
    return selectedPaymentMethod?.type || getDefaultPaymentType(topupInfo)
  }, [selectedPaymentMethod, topupInfo])

  // Handle preset selection
  const handleSelectPreset = (preset: PresetAmount) => {
    setTopupAmount(preset.value)
    setSelectedPreset(preset.value)
    dispatchCalculateAmount(preset.value, getCurrentPaymentType())
  }

  // Handle topup amount change
  const handleTopupAmountChange = (amount: number) => {
    setTopupAmount(amount)
    setSelectedPreset(null)
    dispatchCalculateAmount(amount, getCurrentPaymentType())
  }

  // Resolve the payment amount for the currently selected payment type
  const resolvedPaymentAmount = useMemo(() => {
    const type = selectedPaymentMethod?.type
    if (type === PAYMENT_TYPES.ALIPAY) return alipayPaymentAmount
    if (type === PAYMENT_TYPES.WECHAT) return wxpayPaymentAmount
    return paymentAmount
  }, [selectedPaymentMethod, alipayPaymentAmount, wxpayPaymentAmount, paymentAmount])

  const resolvedCalculating = useMemo(() => {
    const type = selectedPaymentMethod?.type
    if (type === PAYMENT_TYPES.ALIPAY) return alipayCalculating
    if (type === PAYMENT_TYPES.WECHAT) return wxpayCalculating
    return calculating
  }, [selectedPaymentMethod, alipayCalculating, wxpayCalculating, calculating])

  const resolvedProcessing = useMemo(() => {
    const type = selectedPaymentMethod?.type
    if (type === PAYMENT_TYPES.ALIPAY) return alipayProcessing
    if (type === PAYMENT_TYPES.WECHAT) return wxpayProcessing
    return processing || pancakeProcessing
  }, [selectedPaymentMethod, alipayProcessing, wxpayProcessing, processing, pancakeProcessing])

  // Handle payment method selection
  const handlePaymentMethodSelect = async (method: PaymentMethod) => {
    setSelectedPaymentMethod(method)
    setPaymentLoading(method.type)

    try {
      // Validate minimum topup
      const minTopup = getMinTopupAmount(topupInfo)
      if (topupAmount < minTopup) {
        return
      }

      // Calculate payment amount and show confirmation dialog
      await dispatchCalculateAmount(topupAmount, method.type)
      setConfirmDialogOpen(true)
    } finally {
      setPaymentLoading(null)
    }
  }

  // Handle payment confirmation
  const handlePaymentConfirm = async () => {
    if (!selectedPaymentMethod) return

    const type = selectedPaymentMethod.type
    let success = false

    if (type === PAYMENT_TYPES.ALIPAY) {
      success = await processAlipayPayment(topupAmount)
    } else if (type === PAYMENT_TYPES.WECHAT) {
      success = await processWxpayPayment(topupAmount)
    } else if (isWaffoPancakePayment(type)) {
      success = await processWaffoPancakePayment(topupAmount)
    } else {
      success = await processPayment(topupAmount, type)
    }

    if (success) {
      setConfirmDialogOpen(false)
      await fetchUser()
    }
  }

  // Handle redemption
  const handleRedeem = async () => {
    if (!redemptionCode) return

    const success = await redeemCode(redemptionCode)
    if (success) {
      setRedemptionCode('')
      await fetchUser()
    }
  }

  // Handle transfer
  const handleTransfer = async (amount: number) => {
    const success = await transferQuota(amount)
    if (success) {
      await fetchUser()
    }
    return success
  }

  // Handle Creem product selection
  const handleCreemProductSelect = (product: CreemProduct) => {
    setSelectedCreemProduct(product)
    setCreemDialogOpen(true)
  }

  // Handle Creem payment confirmation
  const handleCreemConfirm = async () => {
    if (!selectedCreemProduct) return

    const success = await processCreemPayment(selectedCreemProduct.productId)
    if (success) {
      setCreemDialogOpen(false)
      setSelectedCreemProduct(null)
      await fetchUser()
    }
  }

  const handleWaffoMethodSelect = async (_method: unknown, index: number) => {
    const loadingKey = `waffo-${index}`
    setPaymentLoading(loadingKey)

    try {
      await processWaffoPayment(topupAmount, index)
    } finally {
      setPaymentLoading(null)
    }
  }

  // Get discount rate for current topup amount
  const getDiscountRate = useCallback(() => {
    return topupInfo?.discount?.[topupAmount] || DEFAULT_DISCOUNT_RATE
  }, [topupInfo, topupAmount])

  const handleSubscriptionAvailabilityChange = useCallback(
    (available: boolean) => {
      setShowSubscriptionPanel(available)
    },
    []
  )

  return (
    <>
      <SectionPageLayout>
        <SectionPageLayout.Title>{t('Wallet')}</SectionPageLayout.Title>
        <SectionPageLayout.Description>
          {t('Manage your balance and payment methods')}
        </SectionPageLayout.Description>
        <SectionPageLayout.Content>
          <div className='mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-5'>
            <WalletStatsCard user={user} loading={userLoading} />

            <div
              className={
                showSubscriptionPanel
                  ? 'grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] xl:items-start'
                  : 'grid gap-4'
              }
            >
              <div id='wallet-add-funds' className='scroll-mt-4'>
                <RechargeFormCard
                  topupInfo={topupInfo}
                  presetAmounts={presetAmounts}
                  selectedPreset={selectedPreset}
                  onSelectPreset={handleSelectPreset}
                  topupAmount={topupAmount}
                  onTopupAmountChange={handleTopupAmountChange}
                  paymentAmount={paymentAmount}
                  calculating={calculating}
                  onPaymentMethodSelect={handlePaymentMethodSelect}
                  paymentLoading={paymentLoading}
                  redemptionCode={redemptionCode}
                  onRedemptionCodeChange={setRedemptionCode}
                  onRedeem={handleRedeem}
                  redeeming={redeeming}
                  topupLink={topupInfo?.topup_link}
                  loading={topupLoading}
                  priceRatio={(status?.price as number) || 1}
                  usdExchangeRate={effectiveUsdExchangeRate}
                  onOpenBilling={() => setBillingDialogOpen(true)}
                  creemProducts={topupInfo?.creem_products}
                  enableCreemTopup={topupInfo?.enable_creem_topup}
                  onCreemProductSelect={handleCreemProductSelect}
                  enableWaffoTopup={topupInfo?.enable_waffo_topup}
                  waffoPayMethods={topupInfo?.waffo_pay_methods}
                  waffoMinTopup={topupInfo?.waffo_min_topup}
                  onWaffoMethodSelect={handleWaffoMethodSelect}
                  enableWaffoPancakeTopup={
                    topupInfo?.enable_waffo_pancake_topup
                  }
                  rechargeFeeEnabled={topupInfo?.recharge_fee_enabled}
                  feePreview={feePreview}
                  feeCalculating={feeCalculating}
                />
              </div>

              <SubscriptionPlansCard
                topupInfo={topupInfo}
                onAvailabilityChange={handleSubscriptionAvailabilityChange}
              />
            </div>

            <AffiliateRewardsCard
              user={user}
              affiliateLink={affiliateLink}
              onTransfer={() => setTransferDialogOpen(true)}
              loading={affiliateLoading}
            />
          </div>
        </SectionPageLayout.Content>
      </SectionPageLayout>

      <PaymentConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handlePaymentConfirm}
        topupAmount={topupAmount}
        paymentAmount={resolvedPaymentAmount}
        paymentMethod={selectedPaymentMethod}
        calculating={resolvedCalculating}
        processing={resolvedProcessing}
        discountRate={getDiscountRate()}
        usdExchangeRate={effectiveUsdExchangeRate}
      />

      <WxpayQrDialog
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        codeUrl={qrCodeUrl}
        paymentAmount={wxpayPaymentAmount}
      />

      <TransferDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        onConfirm={handleTransfer}
        availableQuota={user?.aff_quota ?? 0}
        transferring={transferring}
      />

      <BillingHistoryDialog
        open={billingDialogOpen}
        onOpenChange={setBillingDialogOpen}
      />

      <CreemConfirmDialog
        open={creemDialogOpen}
        onOpenChange={setCreemDialogOpen}
        onConfirm={handleCreemConfirm}
        product={selectedCreemProduct}
        processing={creemProcessing}
      />
    </>
  )
}
