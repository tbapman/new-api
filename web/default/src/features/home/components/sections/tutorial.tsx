import { ExternalLink, PlayCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AnimateInView } from '@/components/animate-in-view'

const TUTORIAL_VIDEO = {
  title: 'API中转站怎么用？Claude Code/Codex接入完整教程',
  url: 'https://www.bilibili.com/video/BV1XvVo6QEUv/',
  embedSrc:
    '//player.bilibili.com/player.html?isOutside=true&aid=116674682425311&bvid=BV1XvVo6QEUv&cid=38774376508&p=1',
}

export function Tutorial() {
  const { t } = useTranslation()

  return (
    <section className='border-border/40 relative z-10 border-t px-6 py-24 md:py-32'>
      <div className='mx-auto max-w-4xl'>
        <AnimateInView className='mb-12 text-center md:mb-16'>
          <p className='text-muted-foreground mb-3 text-xs font-medium tracking-widest uppercase'>
            {t('Video Tutorial')}
          </p>
          <h2 className='text-2xl font-bold tracking-tight md:text-3xl'>
            {t('Learn how to get started')}
          </h2>
        </AnimateInView>

        <AnimateInView delay={150} animation='fade-up'>
          <div className='border-border/50 bg-muted/20 overflow-hidden rounded-2xl border'>
            <div className='relative aspect-video w-full'>
              <iframe
                src={TUTORIAL_VIDEO.embedSrc}
                scrolling='no'
                frameBorder='0'
                allowFullScreen
                title={TUTORIAL_VIDEO.title}
                className='absolute inset-0 h-full w-full'
              />
            </div>
            <div className='border-border/30 flex items-center justify-between border-t px-5 py-4'>
              <div className='flex min-w-0 items-center gap-3'>
                <PlayCircle
                  className='text-muted-foreground size-5 shrink-0'
                  strokeWidth={1.5}
                />
                <p className='truncate text-sm font-medium'>
                  {TUTORIAL_VIDEO.title}
                </p>
              </div>
              <a
                href={TUTORIAL_VIDEO.url}
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-foreground ml-4 shrink-0 transition-colors'
                title={t('Open on Bilibili')}
              >
                <ExternalLink className='size-4' />
              </a>
            </div>
          </div>
        </AnimateInView>
      </div>
    </section>
  )
}
