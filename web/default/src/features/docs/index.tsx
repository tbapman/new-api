import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { PublicLayout } from '@/components/layout'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CopyButton } from '@/components/copy-button'

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

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className='group relative overflow-x-auto rounded-xl bg-slate-950 px-4 py-3 pr-12 text-sm leading-6 text-slate-50'>
      <CopyButton
        value={children}
        className='invisible absolute top-2 right-2 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 text-slate-200 hover:bg-slate-800 hover:text-white'
        tooltip='Copy code'
        successTooltip='Copied!'
        aria-label='Copy code'
      />
      <code className='whitespace-pre-wrap'>{children}</code>
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
  const [activeApp, setActiveApp] = useState<'claude' | 'codex'>('claude')

  return (
    <PublicLayout>
      <div className='mx-auto max-w-5xl px-4 py-10'>
        <div className='mb-8 space-y-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant='secondary'>Docs</Badge>
            <Badge variant='outline'>{activeApp === 'claude' ? 'Claude Code' : 'Codex CLI'}</Badge>
          </div>
          <h1 className='text-3xl font-bold tracking-tight'>{t('Documentation')}</h1>
          <p className='max-w-3xl text-muted-foreground'>
            Claude Code 和 Codex CLI 接入 New API 的复制即用命令。
          </p>
        </div>

        <div className='mb-8 flex flex-wrap gap-2'>
          <button
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              activeApp === 'claude'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => setActiveApp('claude')}
            type='button'
          >
            Claude Code
          </button>
          <button
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              activeApp === 'codex'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => setActiveApp('codex')}
            type='button'
          >
            Codex CLI
          </button>
        </div>

        <div className='space-y-6'>
          <Section title='AI 模型配置方法' id='setup'>
            <Tabs defaultValue='mac' key={activeApp}>
              <TabsList className='mb-6 flex flex-wrap'>
                <TabsTrigger value='mac'>macOS</TabsTrigger>
                <TabsTrigger value='windows'>Windows</TabsTrigger>
                <TabsTrigger value='linux'>Linux</TabsTrigger>
              </TabsList>

              <TabsContent value='mac' className='space-y-6'>
                {activeApp === 'claude' ? (
                  <Section title='macOS' id='mac'>
                  <div className='space-y-4'>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>1. 安装 Claude Code CLI</h3>
                      <CodeBlock>{`curl -fsSL https://claude.ai/install.sh | bash`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>2. 获取 API 密钥</h3>
                      <CodeBlock>{`https://www.modelbridge.cloud/keys`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>3. 环境变量</h3>
                      <CodeBlock>{`export ANTHROPIC_BASE_URL='https://www.modelbridge.cloud'
export ANTHROPIC_AUTH_TOKEN='sk-xxxx'`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>4. 开始使用 Claude Code</h3>
                      <CodeBlock>{`claude`}</CodeBlock>
                      <div className='mt-3'>
                        <CodeBlock>{`cd /path/to/your/project`}</CodeBlock>
                      </div>
                      <div className='mt-3'>
                        <CodeBlock>{`/model`}</CodeBlock>
                      </div>
                    </div>
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
                ) : (
                  <Section title='macOS' id='codex-mac'>
                    <div className='space-y-4'>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>1. 安装 Homebrew</h3>
                        <CodeBlock>{`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`}</CodeBlock>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>2. 安装 Node.js</h3>
                        <CodeBlock>{`brew update
brew install node`}</CodeBlock>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>3. 安装 Codex CLI</h3>
                        <CodeBlock>{`npm install -g @openai/codex`}</CodeBlock>
                        <div className='mt-3'>
                          <CodeBlock>{`codex --version`}</CodeBlock>
                        </div>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>4. 手动创建 `~/.codex/config.toml`</h3>
                        <CodeBlock>{`mkdir -p ~/.codex
chmod 700 ~/.codex

cat > ~/.codex/config.toml <<'EOF'
model = "gpt-5-codex"
model_provider = "modelbridge"
model_reasoning_effort = "medium"
disable_response_storage = true

[model_providers.modelbridge]
name = "ModelBridge"
base_url = "https://www.modelbridge.cloud/v1"
env_key = "OPENAI_API_KEY"
wire_api = "responses"
EOF

chmod 600 ~/.codex/config.toml`}</CodeBlock>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>5. 配置 API Key</h3>
                        <p className='text-sm text-muted-foreground'>
                          推荐先用环境变量方式，最清晰，也最不容易把 key 写死到配置里。
                        </p>
                        <div className='mt-3'>
                          <CodeBlock>{`export OPENAI_API_KEY="sk-你的ModelBridge_API_KEY"`}</CodeBlock>
                        </div>
                        <p className='mt-3 text-sm text-muted-foreground'>
                          如果希望每次打开终端都生效，可以把这行写入
                          <code className='mx-1 rounded bg-muted px-1 py-0.5'>~/.zshrc</code>，但这一步不是必须的。
                        </p>
                        <div className='mt-3'>
                          <CodeBlock>{`echo 'export OPENAI_API_KEY="sk-你的ModelBridge_API_KEY"' >> ~/.zshrc
source ~/.zshrc`}</CodeBlock>
                        </div>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>6. 启动 Codex 测试</h3>
                        <p className='text-sm text-muted-foreground'>进入一个测试目录后启动 Codex。</p>
                        <div className='mt-3'>
                          <CodeBlock>{`cd /path/to/your/project
codex`}</CodeBlock>
                        </div>
                      </div>
                    </div>
                  </Section>
                )}
              </TabsContent>

              <TabsContent value='windows' className='space-y-6'>
                {activeApp === 'claude' ? (
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
                      <h3 className='mb-2 text-sm font-semibold'>4. 获取 API 密钥</h3>
                      <CodeBlock>{`https://www.modelbridge.cloud/keys`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>5. 环境变量</h3>
                      <CodeBlock>{`export ANTHROPIC_BASE_URL='https://www.modelbridge.cloud'
export ANTHROPIC_AUTH_TOKEN='sk-xxxx'`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>6. 开始使用 Claude Code</h3>
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
                ) : (
                  <Section title='Windows' id='codex-windows'>
                    <div className='space-y-4'>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>1. 打开终端</h3>
                        <CodeBlock>{`wsl`}</CodeBlock>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>2. 安装 WSL2</h3>
                        <CodeBlock>{`wsl --install`}</CodeBlock>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>3. 安装 Node 22</h3>
                        <CodeBlock>{`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
nvm install 22`}</CodeBlock>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>4. 安装 Codex CLI</h3>
                        <CodeBlock>{`npm i -g @openai/codex`}</CodeBlock>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>5. 配置 API Key</h3>
                        <p className='text-sm text-muted-foreground'>
                          推荐先用环境变量方式，最清晰，也最不容易把 key 写死到配置里。
                        </p>
                        <div className='mt-3'>
                          <CodeBlock>{`export OPENAI_API_KEY="sk-你的ModelBridge_API_KEY"`}</CodeBlock>
                        </div>
                        <p className='mt-3 text-sm text-muted-foreground'>
                          如果希望每次打开终端都生效，可以把这行写入
                          <code className='mx-1 rounded bg-muted px-1 py-0.5'>~/.zshrc</code>，但这一步不是必须的。
                        </p>
                        <div className='mt-3'>
                          <CodeBlock>{`echo 'export OPENAI_API_KEY="sk-你的ModelBridge_API_KEY"' >> ~/.zshrc
source ~/.zshrc`}</CodeBlock>
                        </div>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>6. 启动 Codex 测试</h3>
                        <p className='text-sm text-muted-foreground'>进入一个测试目录后启动 Codex。</p>
                        <div className='mt-3'>
                          <CodeBlock>{`cd /mnt/c/path/to/your/project
codex`}</CodeBlock>
                        </div>
                      </div>
                    </div>
                  </Section>
                )}
              </TabsContent>

              <TabsContent value='linux' className='space-y-6'>
                {activeApp === 'claude' ? (
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
                      <h3 className='mb-2 text-sm font-semibold'>2. 获取 API 密钥</h3>
                      <CodeBlock>{`https://www.modelbridge.cloud/keys`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>3. 环境变量</h3>
                      <CodeBlock>{`export ANTHROPIC_BASE_URL='https://www.modelbridge.cloud'
export ANTHROPIC_AUTH_TOKEN='sk-xxxx'`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>4. 开始使用 Claude Code</h3>
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
                ) : (
                  <Section title='Linux' id='codex-linux'>
                    <div className='space-y-4'>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>1. 安装 Node.js</h3>
                        <CodeBlock>{`sudo curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs`}</CodeBlock>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>2. 安装 Codex CLI</h3>
                        <CodeBlock>{`npm i -g @openai/codex`}</CodeBlock>
                        <div className='mt-3'>
                          <CodeBlock>{`codex --version`}</CodeBlock>
                        </div>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>3. 手动创建 `~/.codex/config.toml`</h3>
                        <CodeBlock>{`mkdir -p ~/.codex
chmod 700 ~/.codex

cat > ~/.codex/config.toml <<'EOF'
model = "gpt-5-codex"
model_provider = "modelbridge"
model_reasoning_effort = "medium"
disable_response_storage = true

[model_providers.modelbridge]
name = "ModelBridge"
base_url = "https://www.modelbridge.cloud/v1"
env_key = "OPENAI_API_KEY"
wire_api = "responses"
EOF

chmod 600 ~/.codex/config.toml`}</CodeBlock>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>4. 配置 API Key</h3>
                        <p className='text-sm text-muted-foreground'>
                          推荐先用环境变量方式，最清晰，也最不容易把 key 写死到配置里。
                        </p>
                        <div className='mt-3'>
                          <CodeBlock>{`export OPENAI_API_KEY="sk-你的ModelBridge_API_KEY"`}</CodeBlock>
                        </div>
                        <p className='mt-3 text-sm text-muted-foreground'>
                          如果希望每次打开终端都生效，可以把这行写入
                          <code className='mx-1 rounded bg-muted px-1 py-0.5'>~/.zshrc</code>，但这一步不是必须的。
                        </p>
                        <div className='mt-3'>
                          <CodeBlock>{`echo 'export OPENAI_API_KEY="sk-你的ModelBridge_API_KEY"' >> ~/.zshrc
source ~/.zshrc`}</CodeBlock>
                        </div>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>5. 启动 Codex 测试</h3>
                        <p className='text-sm text-muted-foreground'>进入一个测试目录后启动 Codex。</p>
                        <div className='mt-3'>
                          <CodeBlock>{`cd /path/to/your/project
codex`}</CodeBlock>
                        </div>
                      </div>
                    </div>
                  </Section>
                )}
              </TabsContent>
            </Tabs>
          </Section>
        </div>
      </div>
    </PublicLayout>
  )
}
