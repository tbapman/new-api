import { X } from 'lucide-react'
import { useState } from 'react'

const BANNER_KEY = 'announcement_banner_dismissed_v1'

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(BANNER_KEY) === 'true'
    } catch {
      return false
    }
  })

  if (dismissed) return null

  function dismiss() {
    try {
      localStorage.setItem(BANNER_KEY, 'true')
    } catch {
      /* empty */
    }
    setDismissed(true)
  }

  return (
    <div className='relative z-50 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-center text-sm text-white'>
      <span>
        💳 订阅 ChatGPT Plus / Claude / Gemini？用 AISubHub 虚拟卡，一键搞定 →{' '}
        <a
          href='https://app.aisubhub.com/'
          target='_blank'
          rel='noopener noreferrer'
          className='font-semibold underline underline-offset-2 hover:opacity-80'
        >
          https://app.aisubhub.com/
        </a>
      </span>
      <button
        onClick={dismiss}
        aria-label='关闭公告'
        className='absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 opacity-70 hover:opacity-100'
      >
        <X className='h-4 w-4' />
      </button>
    </div>
  )
}
