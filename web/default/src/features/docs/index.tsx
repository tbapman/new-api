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

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className='space-y-2 text-sm leading-6 text-muted-foreground'>
      {items.map((item) => (
        <li key={item} className='flex gap-2'>
          <span className='mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary' />
          <span>{item}</span>
        </li>
      ))}
    </ul>
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
            Claude Code 教程，说明如何把 Anthropic 的终端编程助手接入 New API。它适合代码理解、多文件编辑和终端内的日常开发流程，也可以和 VS Code、JetBrains 等 IDE 配合使用。
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
          <Section title='项目介绍' id='project-intro'>
            <p className='text-sm leading-6 text-muted-foreground'>
              Claude Code 的核心价值是把终端里的编程助手和项目代码库直接连接起来。你可以用它快速扫描大规模代码库、理解项目结构、生成代码修改建议，并把原本需要多步完成的开发任务压缩成更自然的命令式工作流。
            </p>
            <div className='rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground'>
              官方主页：<span className='font-medium text-foreground'>https://www.anthropic.com/claude-code</span>
            </div>
          </Section>

          <Section title='效果演示' id='demo'>
            <p className='text-sm leading-6 text-muted-foreground'>
              原文包含两张演示图，分别展示 Claude Code 的介绍界面与实际工作流。当前页面先保留该章节，后续可以继续补齐截图资源。
            </p>
          </Section>

          <Section title='特性' id='features'>
            <BulletList
              items={[
                '代码理解：通过智能代理做深度代码库分析，帮助理解项目结构和依赖关系，也能自动生成高层级概览。',
                '代码编辑：支持多文件协同编辑，适合复杂修改，输出的建议会尽量贴近项目既有模式和架构。',
                '集成能力：可在终端直接运行，不需要切换上下文，也能与 VS Code、JetBrains IDE 兼容。',
                '代码生成和优化：可生成代码、创建测试、修复错误，覆盖从概念到提交的完整流程，并针对代码生成和理解做过优化。',
                '安全与灵活性：改动需要用户明确授权，文件和命令操作更安全，同时可适配用户的代码规范并支持自定义配置。',
                '工具链整合：可与 GitHub、GitLab 等工具结合，也能接入测试套件和构建系统，强化现有开发工具链。',
                '跨平台与扩展：支持 Windows、macOS、Linux，也可以配置在 SDK 或 GitHub Actions 中运行。',
                '主要应用场景：代码库入门和理解、代码问题修复与优化、项目重构和新功能实现。',
                '用户反馈亮点：可减少日常开发中的重复劳动，在复杂多步骤任务中表现稳定，能扩展开发方式。',
              ]}
            />
          </Section>

          <Section title='AI 模型配置方法' id='setup'>
            <Tabs defaultValue='mac'>
              <TabsList className='mb-6 flex flex-wrap'>
                <TabsTrigger value='mac'>macOS</TabsTrigger>
                <TabsTrigger value='windows'>Windows</TabsTrigger>
                <TabsTrigger value='linux'>Linux</TabsTrigger>
              </TabsList>

              <TabsContent value='mac' className='space-y-6'>
                <Section title='MacOS 端图文指引' id='mac'>
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
                      <CodeBlock>{`claude

cd /path/to/your/project
claude

/model`}</CodeBlock>
                    </div>
                    <p className='text-sm leading-6 text-muted-foreground'>
                      注意：设置环境变量修改 <code className='rounded bg-muted px-1 py-0.5'>ANTHROPIC_BASE_URL</code> 后，所有模型请求都会走自定义接入点，也不会使用官方账号额度。
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
                <Section title='Windows 端图文指引' id='windows'>
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
                      <p className='text-sm leading-6 text-muted-foreground'>
                        Windows 环境下建议使用 Git Bash 完成 Claude Code 的安装步骤，后续的环境变量配置和日常使用仍然可以在 PowerShell 或 CMD 中进行。
                      </p>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>3. 安装 Claude Code</h3>
                      <CodeBlock>{`npm install -g @anthropic-ai/claude-code

claude --version`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>4. 设置环境变量</h3>
                      <CodeBlock>{`iex (irm 'https://raw.githubusercontent.com/QuantumNous/new-api-docs/refs/heads/main/helper/claude-cli-setup.ps1')`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>5. 开始使用 Claude Code</h3>
                      <CodeBlock>{`claude

cd C:\\path\\to\\your\\project
claude

/model`}</CodeBlock>
                      <p className='mt-4 text-sm leading-6 text-muted-foreground'>
                        注意：设置环境变量后，所有模型请求都会走自定义接入点，包括官方预设模型在内，也不会消耗官方账号额度。
                      </p>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>Windows 注意事项</h3>
                      <BulletList
                        items={[
                          '建议使用 PowerShell 而不是 CMD。',
                          '如果遇到权限问题，尝试以管理员身份运行。',
                          '某些杀毒软件可能会误报，需要加入白名单。',
                        ]}
                      />
                    </div>
                  </div>
                </Section>
              </TabsContent>

              <TabsContent value='linux' className='space-y-6'>
                <Section title='Linux 端图文指引' id='linux'>
                  <div className='space-y-4'>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>1. 安装 Claude Code</h3>
                      <CodeBlock>{`curl -fsSL https://claude.ai/install.sh | bash

sudo curl -fsSL https://claude.ai/install.sh | bash

claude --version`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>2. 设置环境变量</h3>
                      <CodeBlock>{`curl -fsSL https://raw.githubusercontent.com/QuantumNous/new-api-docs/refs/heads/main/helper/claude-cli-setup.sh | bash`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>3. 开始使用 Claude Code</h3>
                      <CodeBlock>{`claude

cd /path/to/your/project
claude

/model`}</CodeBlock>
                      <p className='mt-4 text-sm leading-6 text-muted-foreground'>
                        注意：设置环境变量修改 <code className='rounded bg-muted px-1 py-0.5'>ANTHROPIC_BASE_URL</code> 后，所有模型请求都会走自定义接入点，也不会使用官方账号额度。
                      </p>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>4. Linux 常见问题解决</h3>
                      <p className='text-sm leading-6 text-muted-foreground'>
                        如果 Linux 发行版缺少依赖，可以按发行版补装开发工具链。
                      </p>
                      <div className='mt-4'>
                        <CodeBlock>{`# Ubuntu / Debian
sudo apt install build-essential

# CentOS / RHEL
sudo dnf groupinstall "Development Tools"`}</CodeBlock>
                      </div>
                      <p className='mt-4 text-sm leading-6 text-muted-foreground'>
                        如果环境变量没有生效，建议检查配置文件是否正确、终端是否重新打开，以及是否能通过命令看到配置值。
                      </p>
                      <div className='mt-4'>
                        <CodeBlock>{`echo $ANTHROPIC_BASE_URL`}</CodeBlock>
                      </div>
                    </div>
                  </div>
                </Section>
              </TabsContent>
            </Tabs>
          </Section>

          <Section title='相关链接' id='links'>
            <BulletList
              items={[
                '官方主页：https://www.anthropic.com/claude-code',
                '目标文档：https://docs.newapi.pro/zh/docs/apps/claude-code',
              ]}
            />
          </Section>
        </div>
      </div>
    </PublicLayout>
  )
}
