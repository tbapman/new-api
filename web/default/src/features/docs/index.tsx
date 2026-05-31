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
                      <h3 className='mb-2 text-sm font-semibold'>1. 安装 Homebrew</h3>
                      <p className='text-sm text-muted-foreground'>如果还没有 Homebrew，先安装它，后面会用它装 Node.js。</p>
                      <CodeBlock>{`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>2. 安装 nvm</h3>
                      <p className='text-sm text-muted-foreground'>先安装 nvm，再用它来管理 Node.js 版本。</p>
                      <CodeBlock>{`brew update
brew install nvm
mkdir -p ~/.nvm
cat >> ~/.zshrc <<'EOF'
export NVM_DIR="$HOME/.nvm"
[ -s "$(brew --prefix nvm)/nvm.sh" ] && \. "$(brew --prefix nvm)/nvm.sh"
[ -s "$(brew --prefix nvm)/etc/bash_completion.d/nvm" ] && \. "$(brew --prefix nvm)/etc/bash_completion.d/nvm"
EOF
source ~/.zshrc`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>3. 通过 nvm 安装 Node.js</h3>
                      <p className='text-sm text-muted-foreground'>使用 nvm 安装 Node.js LTS 版本。</p>
                      <CodeBlock>{`nvm install --lts
nvm use --lts
node -v
npm -v`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>4. 清理旧环境</h3>
                      <p className='text-sm text-muted-foreground'>先清理旧的 Claude Code 环境变量，避免和新配置冲突。</p>
                      <CodeBlock>{`unset ANTHROPIC_API_KEY
unset ANTHROPIC_AUTH_TOKEN
unset ANTHROPIC_BASE_URL
unset ANTHROPIC_MODEL`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>5. 安装 Claude Code CLI</h3>
                      <p className='text-sm text-muted-foreground'>使用 npm 全局安装 Claude Code CLI。</p>
                      <CodeBlock>{`npm i @anthropic-ai/claude-code -g`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>6. 配置 ModelBridge</h3>
                      <p className='text-sm text-muted-foreground'>
                        把下面内容追加到 <code className='mx-1 rounded bg-muted px-1 py-0.5'>~/.zshrc</code>，然后执行
                        <code className='mx-1 rounded bg-muted px-1 py-0.5'>source ~/.zshrc</code> 让配置生效。
                      </p>
                      <CodeBlock>{`cat >> ~/.zshrc <<'EOF'

# Claude Code via ModelBridge
# ANTHROPIC_AUTH_TOKEN到https://www.modelbridge.cloud/keys创建获取
export ANTHROPIC_BASE_URL="https://www.modelbridge.cloud"
export ANTHROPIC_AUTH_TOKEN="sk-你的ModelBridge_API_KEY"
export ANTHROPIC_API_KEY=""
EOF

source ~/.zshrc`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>7. 启动 Claude Code 测试</h3>
                      <p className='text-sm text-muted-foreground'>进入一个测试目录后，直接启动 Claude Code 验证配置是否生效。</p>
                      <CodeBlock>{`cd /path/to/your/project
claude`}</CodeBlock>
                    </div>
                  </div>
                  </Section>
                ) : (
                  <Section title='macOS' id='codex-mac'>
                    <div className='space-y-4'>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>1. 安装 Homebrew</h3>
                        <p className='text-sm text-muted-foreground'>如果还没有 Homebrew，先安装它，后面会用它装 Node.js。</p>
                        <CodeBlock>{`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`}</CodeBlock>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>2. 安装 nvm</h3>
                        <p className='text-sm text-muted-foreground'>先安装 nvm，再用它来管理 Node.js 版本。</p>
                        <CodeBlock>{`brew update
brew install nvm
mkdir -p ~/.nvm
cat >> ~/.zshrc <<'EOF'
export NVM_DIR="$HOME/.nvm"
[ -s "$(brew --prefix nvm)/nvm.sh" ] && \. "$(brew --prefix nvm)/nvm.sh"
[ -s "$(brew --prefix nvm)/etc/bash_completion.d/nvm" ] && \. "$(brew --prefix nvm)/etc/bash_completion.d/nvm"
EOF
source ~/.zshrc`}</CodeBlock>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>3. 通过 nvm 安装 Node.js</h3>
                        <p className='text-sm text-muted-foreground'>使用 nvm 安装 Node.js LTS 版本。</p>
                        <CodeBlock>{`nvm install --lts
nvm use --lts
node -v
npm -v`}</CodeBlock>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>4. 安装 Codex CLI</h3>
                        <p className='text-sm text-muted-foreground'>接着用 npm 全局安装 Codex CLI，并检查版本是否可用。</p>
                        <CodeBlock>{`npm install -g @openai/codex`}</CodeBlock>
                        <div className='mt-3'>
                          <CodeBlock>{`codex --version`}</CodeBlock>
                        </div>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>5. 手动创建 `~/.codex/config.toml`</h3>
                        <p className='text-sm text-muted-foreground'>先创建配置目录，再写入 Codex 配置文件。</p>
                        <CodeBlock>{`mkdir -p ~/.codex
chmod 700 ~/.codex

cat > ~/.codex/config.toml <<'EOF'
model = "gpt-5.4-mini"
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
                        <h3 className='mb-2 text-sm font-semibold'>6. 设置 API Key</h3>
                        <p className='text-sm text-muted-foreground'>
                          先把 API Key 配到当前终端里，最清晰，也最不容易把 key 写死到配置里。
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
                        <h3 className='mb-2 text-sm font-semibold'>7. 启动 Codex 测试</h3>
                        <p className='text-sm text-muted-foreground'>进入一个测试目录后，直接启动 Codex 验证配置是否生效。</p>
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
                  <Section title='Windows 安装 Claude Code' id='windows'>
                    <div className='space-y-4'>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>1. 安装 Node.js</h3>
                        <p className='text-sm text-muted-foreground'>
                          先去安装 <strong>Node.js LTS</strong>。安装完成后，打开 PowerShell 检查版本。
                        </p>
                        <CodeBlock>{`node -v
npm -v`}</CodeBlock>
                        <p className='mt-3 text-sm text-muted-foreground'>
                          只要 Node.js 是 18 或更高就可以。官方 npm 安装方式要求 Node.js 18+。
                        </p>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>2. 安装 Claude Code</h3>
                        <p className='text-sm text-muted-foreground'>在 PowerShell 里执行：</p>
                        <CodeBlock>{`npm install -g @anthropic-ai/claude-code`}</CodeBlock>
                        <p className='mt-3 text-sm text-muted-foreground'>检查：</p>
                        <CodeBlock>{`claude --version
where claude`}</CodeBlock>
                        <p className='mt-3 text-sm text-muted-foreground'>如果能看到版本号，说明安装成功。</p>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>3. 配置 ModelBridge 环境变量</h3>
                        <p className='text-sm text-muted-foreground'>你的域名是：</p>
                        <CodeBlock>{`https://www.modelbridge.cloud/`}</CodeBlock>
                        <p className='mt-3 text-sm text-muted-foreground'>建议 Claude Code 的 base URL 配成：</p>
                        <CodeBlock>{`https://www.modelbridge.cloud`}</CodeBlock>
                        <p className='mt-3 text-sm text-muted-foreground'>在 PowerShell 执行，替换成你的真实 key：</p>
                        <CodeBlock>{`setx ANTHROPIC_BASE_URL "https://www.modelbridge.cloud"
setx ANTHROPIC_AUTH_TOKEN "sk-你的ModelBridge_API_KEY"
setx ANTHROPIC_API_KEY ""`}</CodeBlock>
                        <p className='mt-3 text-sm text-muted-foreground'>
                          执行完后，关闭当前 PowerShell，重新打开一个新的 PowerShell。
                        </p>
                        <p className='mt-3 text-sm text-muted-foreground'>检查：</p>
                        <CodeBlock>{`echo $env:ANTHROPIC_BASE_URL
echo $env:ANTHROPIC_AUTH_TOKEN
echo $env:ANTHROPIC_API_KEY`}</CodeBlock>
                        <p className='mt-3 text-sm text-muted-foreground'>安全一点可以只显示前几位：</p>
                        <CodeBlock>{`$env:ANTHROPIC_AUTH_TOKEN.Substring(0, 8)`}</CodeBlock>
                        <p className='mt-3 text-sm text-muted-foreground'>
                          Claude 官方环境变量文档说明，`ANTHROPIC_BASE_URL` 用于指定自定义 API 网关 / 代理；`ANTHROPIC_AUTH_TOKEN`
                          会作为 `Authorization: Bearer ...` 发送；`ANTHROPIC_API_KEY` 会作为 `X-Api-Key` 发送。
                        </p>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>4. 测试 Claude Code</h3>
                        <p className='text-sm text-muted-foreground'>进入一个测试目录后，直接启动 Claude 验证配置是否生效。</p>
                        <CodeBlock>{`打开项目终端
claude`}</CodeBlock>
                      </div>
                    </div>
                  </Section>
                ) : (
                  <Section title='Windows' id='codex-windows'>
                    <div className='space-y-4'>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>1. 安装 Node.js</h3>
                        <p className='text-sm text-muted-foreground'>
                          先去 Node.js 官网下载并安装 LTS 版本。
                        </p>
                        <CodeBlock>{`https://nodejs.org/zh-cn`}</CodeBlock>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>2. 安装 Codex CLI</h3>
                        <p className='text-sm text-muted-foreground'>使用 npm 全局安装 Codex CLI。</p>
                        <CodeBlock>{`npm i -g @openai/codex`}</CodeBlock>
                        <div className='mt-3'>
                          <CodeBlock>{`codex --version`}</CodeBlock>
                        </div>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>3. 打开 PowerShell</h3>
                        <p className='text-sm text-muted-foreground'>
                          按 <code className='mx-1 rounded bg-muted px-1 py-0.5'>Win</code> +{' '}
                          <code className='mx-1 rounded bg-muted px-1 py-0.5'>R</code>，输入
                          <code className='mx-1 rounded bg-muted px-1 py-0.5'>powershell</code>，然后回车打开。
                        </p>
                        <div className='mt-3'>
                          <CodeBlock>{`powershell`}</CodeBlock>
                        </div>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>4. 创建 Codex 配置文件</h3>
                        <p className='text-sm text-muted-foreground'>先创建配置目录，再打开配置文件进行编辑。</p>
                        <CodeBlock>{`New-Item -ItemType Directory -Force "$env:USERPROFILE\\.codex"
notepad "$env:USERPROFILE\\.codex\\config.toml"`}</CodeBlock>
                        <p className='mt-3 text-sm text-muted-foreground'>然后把下面这段内容粘贴进去：</p>
                        <div className='mt-3'>
                          <CodeBlock>{`model = "gpt-5.4-mini"
model_provider = "modelbridge"
model_reasoning_effort = "medium"
disable_response_storage = true

[model_providers.modelbridge]
name = "ModelBridge"
base_url = "https://www.modelbridge.cloud/v1"
env_key = "OPENAI_API_KEY"
wire_api = "responses"`}</CodeBlock>
                        </div>
                        <p className='mt-3 text-sm text-muted-foreground'>粘贴完成后，保存并关闭记事本。</p>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>5. 设置 API Key</h3>
                        <p className='text-sm text-muted-foreground'>回到 PowerShell，把下面命令里的 key 换成你的真实 API Key 后执行。</p>
                        <div className='mt-3'>
                          <CodeBlock>{`setx OPENAI_API_KEY "sk-你的ModelBridge_API_KEY"`}</CodeBlock>
                        </div>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>6. 启动 Codex 测试</h3>
                        <p className='text-sm text-muted-foreground'>进入一个测试目录后，直接启动 Codex 验证配置是否生效。</p>
                        <div className='mt-3'>
                          <CodeBlock>{`cd /path/to/your/project
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
                      <h3 className='mb-2 text-sm font-semibold'>1. 安装 Homebrew</h3>
                      <p className='text-sm text-muted-foreground'>如果还没有 Homebrew，先安装它，后面会用它装 Node.js。</p>
                      <CodeBlock>{`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>2. 安装 nvm</h3>
                      <p className='text-sm text-muted-foreground'>先安装 nvm，再用它来管理 Node.js 版本。</p>
                      <CodeBlock>{`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>3. 通过 nvm 安装 Node.js</h3>
                      <p className='text-sm text-muted-foreground'>使用 nvm 安装 Node.js LTS 版本。</p>
                      <CodeBlock>{`nvm install --lts
nvm use --lts
node -v
npm -v`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>4. 清理旧环境</h3>
                      <p className='text-sm text-muted-foreground'>先清理旧的 Claude Code 环境变量，避免和新配置冲突。</p>
                      <CodeBlock>{`unset ANTHROPIC_API_KEY
unset ANTHROPIC_AUTH_TOKEN
unset ANTHROPIC_BASE_URL
unset ANTHROPIC_MODEL`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>5. 安装 Claude Code CLI</h3>
                      <p className='text-sm text-muted-foreground'>使用 npm 全局安装 Claude Code CLI。</p>
                      <CodeBlock>{`npm i @anthropic-ai/claude-code -g`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>6. 配置 ModelBridge</h3>
                      <p className='text-sm text-muted-foreground'>
                        把下面内容追加到 <code className='mx-1 rounded bg-muted px-1 py-0.5'>~/.zshrc</code>，然后执行
                        <code className='mx-1 rounded bg-muted px-1 py-0.5'>source ~/.zshrc</code> 让配置生效。
                      </p>
                      <CodeBlock>{`cat >> ~/.zshrc <<'EOF'

# Claude Code via ModelBridge
# ANTHROPIC_AUTH_TOKEN到https://www.modelbridge.cloud/keys创建获取
export ANTHROPIC_BASE_URL="https://www.modelbridge.cloud"
export ANTHROPIC_AUTH_TOKEN="sk-你的ModelBridge_API_KEY"
export ANTHROPIC_API_KEY=""
EOF

source ~/.zshrc`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>7. 启动 Claude Code 测试</h3>
                      <p className='text-sm text-muted-foreground'>进入一个测试目录后，直接启动 Claude Code 验证配置是否生效。</p>
                      <CodeBlock>{`cd /path/to/your/project
claude`}</CodeBlock>
                    </div>
                  </div>
                  </Section>
                ) : (
                  <Section title='Linux' id='codex-linux'>
                    <div className='space-y-4'>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>1. 安装 nvm</h3>
                        <p className='text-sm text-muted-foreground'>先安装 nvm，再用它来管理 Node.js 版本。</p>
                        <CodeBlock>{`sudo apt update
sudo apt install -y curl
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash`}</CodeBlock>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>2. 通过 nvm 安装 Node.js</h3>
                        <p className='text-sm text-muted-foreground'>重新加载 shell 后，使用 nvm 安装 Node.js LTS 版本。</p>
                        <CodeBlock>{`source ~/.bashrc
nvm install --lts
nvm use --lts
node -v
npm -v`}</CodeBlock>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>3. 安装 Codex CLI</h3>
                        <p className='text-sm text-muted-foreground'>使用 npm 全局安装 Codex CLI，并检查版本是否可用。</p>
                        <CodeBlock>{`npm i -g @openai/codex
codex --version`}</CodeBlock>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>4. 手动创建 `~/.codex/config.toml`</h3>
                        <p className='text-sm text-muted-foreground'>先创建配置目录，再写入 Codex 配置文件。</p>
                        <CodeBlock>{`mkdir -p ~/.codex
chmod 700 ~/.codex

cat > ~/.codex/config.toml <<'EOF'
model = "gpt-5.4-mini"
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
                        <h3 className='mb-2 text-sm font-semibold'>5. 设置 API Key</h3>
                        <p className='text-sm text-muted-foreground'>
                          在当前终端里先设置环境变量，最清晰，也最不容易把 key 写死到配置里。
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
                        <p className='text-sm text-muted-foreground'>进入一个测试目录后，直接启动 Codex 验证配置是否生效。</p>
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
