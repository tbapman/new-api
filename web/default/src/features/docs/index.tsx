import { useTranslation } from 'react-i18next'
import { PublicLayout } from '@/components/layout'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

export function Docs() {
  const { t } = useTranslation()

  return (
    <PublicLayout>
      <div className='mx-auto max-w-3xl px-4 py-10'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold tracking-tight'>{t('Documentation')}</h1>
          <p className='mt-2 text-muted-foreground'>
            {t('Learn how to use the relay station with your favorite AI tools across different operating systems.')}
          </p>
        </div>

        {/* Tool selector */}
        <div className='mb-6 flex flex-wrap gap-2'>
          <button className='inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground'>
            Claude Code
          </button>
          <span className='inline-flex items-center gap-1 rounded-lg border border-dashed px-4 py-2 text-sm text-muted-foreground'>
            Codex <Badge variant='outline' className='text-xs'>{t('Coming soon')}</Badge>
          </span>
        </div>

        {/* OS Tabs */}
        <Tabs defaultValue='mac'>
          <TabsList className='mb-6'>
            <TabsTrigger value='mac'>macOS</TabsTrigger>
            <TabsTrigger value='windows'>Windows</TabsTrigger>
            <TabsTrigger value='linux'>Linux</TabsTrigger>
          </TabsList>

          <TabsContent value='mac'>
            {/* TODO: 添加 macOS 使用说明 */}
          </TabsContent>

          <TabsContent value='windows'>
            {/* TODO: 添加 Windows 使用说明 */}
          </TabsContent>

          <TabsContent value='linux'>
            {/* TODO: 添加 Linux 使用说明 */}
          </TabsContent>
        </Tabs>
      </div>
    </PublicLayout>
  )
}
