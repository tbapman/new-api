'use client'

import { MessageCircleMore, QrCode } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'

const TECH_SUPPORT_WECHAT_ID = 'aisubhub'

export function SupportContactFab() {
  const { t } = useTranslation()

  return (
    <HoverCard>
      <HoverCardTrigger
        render={
          <Button
            type='button'
            className='bg-primary text-primary-foreground shadow-lg shadow-black/10 hover:bg-primary/90 fixed right-5 bottom-5 z-40 h-12 rounded-full px-4'
          >
            <MessageCircleMore data-icon='inline-start' />
            {t('footer.support.title')}
          </Button>
        }
      />
      <HoverCardContent
        side='left'
        align='end'
        sideOffset={14}
        className='w-80 p-0'
      >
        <div className='border-border/60 bg-background/95 rounded-2xl border p-4 shadow-xl backdrop-blur-sm'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
            <div className='bg-muted/30 shrink-0 rounded-xl border p-3'>
              <img
                src='/wechat_li.png'
                alt={t('footer.support.wechatQrAlt')}
                className='size-24 rounded-lg object-contain'
                loading='lazy'
              />
            </div>
            <div className='min-w-0 flex-1'>
              <div className='mb-2 flex items-center gap-2'>
                <QrCode className='text-primary size-4 shrink-0' />
                <p className='text-sm font-semibold'>
                  {t('footer.support.title')}
                </p>
              </div>
              <p className='text-muted-foreground text-xs leading-relaxed'>
                {t('footer.support.description')}
              </p>
              <div className='bg-muted/40 text-muted-foreground mt-3 inline-flex max-w-full items-center gap-2 rounded-lg px-3 py-2 text-xs'>
                <span>{t('footer.support.wechatId')}:</span>
                <span className='text-foreground truncate font-medium'>
                  {TECH_SUPPORT_WECHAT_ID}
                </span>
              </div>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
