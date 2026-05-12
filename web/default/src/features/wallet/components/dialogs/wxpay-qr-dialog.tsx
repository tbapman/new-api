import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface WxpayQrDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  codeUrl: string
  paymentAmount: number
}

export function WxpayQrDialog({
  open,
  onOpenChange,
  codeUrl,
  paymentAmount,
}: WxpayQrDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-sm:w-[calc(100vw-1.5rem)] sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle className='text-xl font-semibold'>
            {t('WeChat Pay')}
          </DialogTitle>
          <DialogDescription>
            {t('Scan QR code with WeChat to pay ¥{{amount}}', {
              amount: paymentAmount.toFixed(2),
            })}
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col items-center gap-4 py-2'>
          {codeUrl ? (
            <div className='rounded-xl border bg-white p-4 shadow-sm'>
              <QRCodeSVG value={codeUrl} size={200} />
            </div>
          ) : null}
          <p className='text-muted-foreground text-sm'>
            {t('Open WeChat → Scan → Pay')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
