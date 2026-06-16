import { useState, useCallback } from 'react'
import i18next from 'i18next'
import { toast } from 'sonner'
import {
  calculateWxpayAmount,
  requestWxpayPayment,
  isApiSuccess,
} from '../api'
import { PAYMENT_TYPES } from '../constants'

// ============================================================================
// WeChat Pay Payment Hook
// ============================================================================

/**
 * Hook for handling direct WeChat Pay (Native V3) payment processing.
 * Backend returns a weixin:// code_url that we display as a QR code.
 */
export function useWxpayPayment() {
  const [calculating, setCalculating] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [amount, setAmount] = useState(0)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [tradeNo, setTradeNo] = useState('')

  const calculateWxpayPaymentAmount = useCallback(
    async (topupAmount: number) => {
      try {
        setCalculating(true)
        const response = await calculateWxpayAmount({ amount: topupAmount })
        if (isApiSuccess(response) && response.data) {
          const parsed = parseFloat(response.data)
          setAmount(parsed)
          return parsed
        }
        setAmount(0)
        return 0
      } catch {
        setAmount(0)
        return 0
      } finally {
        setCalculating(false)
      }
    },
    []
  )

  const processWxpayPayment = useCallback(async (topupAmount: number) => {
    try {
      setProcessing(true)
      const response = await requestWxpayPayment({
        amount: Math.floor(topupAmount),
        payment_method: PAYMENT_TYPES.WECHAT,
      })

      if (!isApiSuccess(response)) {
        const errMsg =
          typeof response.message === 'string'
            ? response.message
            : i18next.t('Payment request failed')
        toast.error(errMsg)
        return false
      }

      const codeUrl = response.data?.code_url
      if (!codeUrl) {
        toast.error(i18next.t('Payment request failed'))
        return false
      }

      setTradeNo(response.data?.trade_no || '')
      setQrCodeUrl(codeUrl)
      setQrDialogOpen(true)
      return true
    } catch {
      toast.error(i18next.t('Payment request failed'))
      return false
    } finally {
      setProcessing(false)
    }
  }, [])

  return {
    amount,
    calculating,
    processing,
    qrCodeUrl,
    qrDialogOpen,
    tradeNo,
    setQrDialogOpen,
    setAmount,
    calculateWxpayPaymentAmount,
    processWxpayPayment,
  }
}
