import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { PublicLayout } from '@/components/layout'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

function Section({
  title,
  children,
  id,
}: {
  title: string
  children: ReactNode
  id?: string
}) {
  return (
    <section id={id} className='space-y-4 rounded-2xl border bg-card p-6 shadow-sm'>
      <h2 className='text-xl font-semibold tracking-tight'>{title}</h2>
      {children}
    </section>
  )
}

function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <pre className='overflow-x-auto rounded-xl bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-50'>
      <code>{children}</code>
    </pre>
  )
}

function StepList({ items }: { items: string[] }) {
  return (
    <ol className='list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground'>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ol>
  )
}

export function Docs() {
  const { t } = useTranslation()

  return (
    <PublicLayout>
      <div className='mx-auto max-w-5xl px-4 py-10'>
        <div className='mb-8 space-y-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant='secondary'>Docs</Badge>
            <Badge variant='outline'>Claude Code</Badge>
          </div>
          <h1 className='text-3xl font-bold tracking-tight'>{t('Documentation')}</h1>
          <p className='max-w-3xl text-muted-foreground'>
            Claude Code 接入 New API 的复制即用命令。
          </p>
        </div>

        <div className='mb-8 flex flex-wrap gap-2'>
          <button className='inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground'>
            Claude Code
          </button>
          <span className='inline-flex items-center gap-1 rounded-lg border border-dashed px-4 py-2 text-sm text-muted-foreground'>
            Codex <Badge variant='outline' className='text-xs'>{t('Coming soon')}</Badge>
          </span>
        </div>

        <div className='space-y-6'>
          <Section title='AI 模型配置方法' id='setup'>
            <Tabs defaultValue='mac'>
              <TabsList className='mb-6 flex flex-wrap'>
                <TabsTrigger value='mac'>macOS</TabsTrigger>
                <TabsTrigger value='windows'>Windows</TabsTrigger>
                <TabsTrigger value='linux'>Linux</TabsTrigger>
              </TabsList>

              <TabsContent value='mac' className='space-y-6'>
                <Section title='macOS' id='mac'>
                  <div className='space-y-4'>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>1. 安装 Claude Code CLI</h3>
                      <CodeBlock>{`curl -fsSL https://claude.ai/install.sh | bash`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>2. 设置环境变量</h3>
                      <CodeBlock>{`curl -fsSL https://raw.githubusercontent.com/QuantumNous/new-api-docs/refs/heads/main/helper/claude-cli-setup.sh | bash`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>3. 开始使用 Claude Code</h3>
                      <CodeBlock>{`claude`}</CodeBlock>
                      <div className='mt-3'>
                        <CodeBlock>{`cd /path/to/your/project`}</CodeBlock>
                      </div>
                      <div className='mt-3'>
                        <CodeBlock>{`/model`}</CodeBlock>
                      </div>
                    </div>
                    <p className='text-sm leading-6 text-muted-foreground'>
                      设置 <code className='rounded bg-muted px-1 py-0.5'>ANTHROPIC_BASE_URL</code> 后，请求走 New API。
                    </p>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>4. macOS 常见问题解决</h3>
                      <StepList
                        items={[
                          '打开“系统偏好设置”。',
                          '进入“安全性与隐私”。',
                          '选择“仍要打开”或“允许”。',
                        ]}
                      />
                      <div className='mt-4'>
                        <CodeBlock>{`sudo spctl --master-disable`}</CodeBlock>
                      </div>
                    </div>
                  </div>
                </Section>
              </TabsContent>

              <TabsContent value='windows' className='space-y-6'>
                <Section title='Windows' id='windows'>
                  <div className='space-y-4'>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>1. 安装 Node.js 环境</h3>
                      <StepList
                        items={[
                          '打开 Node.js 官方站点并下载 LTS 版本。',
                          '运行 `.msi` 安装包。',
                          '按默认选项完成安装。',
                        ]}
                      />
                      <div className='mt-4'>
                        <CodeBlock>{`node --version
npm --version`}</CodeBlock>
                      </div>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>2. 安装 Git Bash</h3>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>3. 安装 Claude Code</h3>
                      <CodeBlock>{`npm install -g @anthropic-ai/claude-code`}</CodeBlock>
                      <div className='mt-3'>
                        <CodeBlock>{`claude --version`}</CodeBlock>
                      </div>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>4. 设置环境变量</h3>
                      <CodeBlock>{`iex (irm 'https://raw.githubusercontent.com/QuantumNous/new-api-docs/refs/heads/main/helper/claude-cli-setup.ps1')`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>5. 开始使用 Claude Code</h3>
                      <CodeBlock>{`claude`}</CodeBlock>
                      <div className='mt-3'>
                        <CodeBlock>{`cd C:\\path\\to\\your\\project`}</CodeBlock>
                      </div>
                      <div className='mt-3'>
                        <CodeBlock>{`/model`}</CodeBlock>
                      </div>
                    </div>
                  </div>
                </Section>
              </TabsContent>

              <TabsContent value='linux' className='space-y-6'>
                <Section title='Linux' id='linux'>
                  <div className='space-y-4'>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>1. 安装 Claude Code</h3>
                      <CodeBlock>{`curl -fsSL https://claude.ai/install.sh | bash`}</CodeBlock>
                      <div className='mt-3'>
                        <CodeBlock>{`sudo curl -fsSL https://claude.ai/install.sh | bash`}</CodeBlock>
                      </div>
                      <div className='mt-3'>
                        <CodeBlock>{`claude --version`}</CodeBlock>
                      </div>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>2. 设置环境变量</h3>
                      <CodeBlock>{`curl -fsSL https://raw.githubusercontent.com/QuantumNous/new-api-docs/refs/heads/main/helper/claude-cli-setup.sh | bash`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>3. 开始使用 Claude Code</h3>
                      <CodeBlock>{`claude`}</CodeBlock>
                      <div className='mt-3'>
                        <CodeBlock>{`cd /path/to/your/project`}</CodeBlock>
                      </div>
                      <div className='mt-3'>
                        <CodeBlock>{`/model`}</CodeBlock>
                      </div>
                    </div>
                  </div>
                </Section>
              </TabsContent>
            </Tabs>
          </Section>
        </div>
      </div>
    </PublicLayout>
  )
}
