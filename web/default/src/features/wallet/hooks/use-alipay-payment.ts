import { useState, useCallback } from 'react'
import i18next from 'i18next'
import { toast } from 'sonner'
import {
  calculateAlipayAmount,
  requestAlipayPayment,
  isApiSuccess,
} from '../api'
import { PAYMENT_TYPES } from '../constants'

// ============================================================================
// Alipay Payment Hook
// ============================================================================

/**
 * Hook for handling direct Alipay payment processing.
 * Backend returns an HTML page form that we write into a new browser window.
 */
export function useAlipayPayment() {
  const [calculating, setCalculating] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [amount, setAmount] = useState(0)

  const calculateAlipayPaymentAmount = useCallback(
    async (topupAmount: number) => {
      try {
        setCalculating(true)
        const response = await calculateAlipayAmount({ amount: topupAmount })
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

  const processAlipayPayment = useCallback(async (topupAmount: number) => {
    try {
      setProcessing(true)
      const response = await requestAlipayPayment({
        amount: Math.floor(topupAmount),
        payment_method: PAYMENT_TYPES.ALIPAY,
      })

      if (!isApiSuccess(response)) {
        const errMsg =
          typeof response.message === 'string'
            ? response.message
            : i18next.t('Payment request failed')
        toast.error(errMsg)
        return false
      }

      const payForm = response.data?.pay_form
      if (!payForm) {
        toast.error(i18next.t('Payment request failed'))
        return false
      }

      // Write the HTML form page into a new window so the browser submits it
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(payForm)
        win.document.close()
      } else {
        // Fallback: inject into hidden iframe if popup was blocked
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        document.body.appendChild(iframe)
        iframe.contentDocument?.write(payForm)
        iframe.contentDocument?.close()
        setTimeout(() => document.body.removeChild(iframe), 5000)
      }

      toast.success(i18next.t('Redirecting to payment page...'))
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
    setAmount,
    calculateAlipayPaymentAmount,
    processAlipayPayment,
  }
}
