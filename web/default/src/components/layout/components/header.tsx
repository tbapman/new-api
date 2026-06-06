import { cn } from '@/lib/utils'
import { SidebarTrigger } from '@/components/ui/sidebar'

type HeaderProps = React.HTMLAttributes<HTMLElement>

export function Header({ className, children, style, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky z-40 h-[var(--app-header-height,3rem)] w-full shrink-0 bg-transparent',
        className
      )}
      style={{ top: 'var(--banner-height, 0px)', ...style }}
      {...props}
    >
      <div className='flex h-full items-center gap-1.5 px-2 sm:gap-2 sm:px-3'>
        <SidebarTrigger variant='ghost' className='size-8' />
        {children}
      </div>
    </header>
  )
}
