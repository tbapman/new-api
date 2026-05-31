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
                      <h3 className='mb-2 text-sm font-semibold'>2. 安装 Node.js</h3>
                      <p className='text-sm text-muted-foreground'>用 Homebrew 安装 Node.js，作为 Claude Code 的运行环境。</p>
                      <CodeBlock>{`brew update
brew install node`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>3. 清理旧环境</h3>
                      <p className='text-sm text-muted-foreground'>先清理旧的 Claude Code 环境变量，避免和新配置冲突。</p>
                      <CodeBlock>{`unset ANTHROPIC_API_KEY
unset ANTHROPIC_AUTH_TOKEN
unset ANTHROPIC_BASE_URL
unset ANTHROPIC_MODEL`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>4. 安装 Claude Code CLI</h3>
                      <p className='text-sm text-muted-foreground'>使用 npm 全局安装 Claude Code CLI。</p>
                      <CodeBlock>{`npm i @anthropic-ai/claude-code -g`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>5. 配置 ModelBridge</h3>
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
                      <h3 className='mb-2 text-sm font-semibold'>6. 启动 Claude Code 测试</h3>
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
                        <h3 className='mb-2 text-sm font-semibold'>2. 安装 Node.js</h3>
                        <p className='text-sm text-muted-foreground'>用 Homebrew 安装 Node.js，作为 Codex CLI 的运行环境。</p>
                        <CodeBlock>{`brew update
brew install node`}</CodeBlock>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>3. 安装 Codex CLI</h3>
                        <p className='text-sm text-muted-foreground'>接着用 npm 全局安装 Codex CLI，并检查版本是否可用。</p>
                        <CodeBlock>{`npm install -g @openai/codex`}</CodeBlock>
                        <div className='mt-3'>
                          <CodeBlock>{`codex --version`}</CodeBlock>
                        </div>
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

              <TabsContent value='windows' className='space-y-6'>
                {activeApp === 'claude' ? (
                  <Section title='WSL Ubuntu 安装 Claude Code' id='windows'>
                    <div className='space-y-4'>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>1. 安装 WSL</h3>
                        <p className='text-sm text-muted-foreground'>用管理员身份打开 PowerShell，执行下面命令安装 WSL。</p>
                        <CodeBlock>{`wsl --install`}</CodeBlock>
                        <p className='mt-3 text-sm text-muted-foreground'>安装完成后重启电脑，然后打开 Ubuntu，设置 Linux 用户名和密码。</p>
                        <p className='mt-3 text-sm text-muted-foreground'>检查 WSL 是否正常：</p>
                        <CodeBlock>{`uname -a`}</CodeBlock>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>2. 在 WSL 里安装 Node.js</h3>
                        <p className='text-sm text-muted-foreground'>进入 Ubuntu 后，先更新系统软件包并安装 curl。</p>
                        <CodeBlock>{`sudo apt update
sudo apt install -y curl`}</CodeBlock>
                        <p className='mt-3 text-sm text-muted-foreground'>推荐使用 nvm 安装 Node.js：</p>
                        <CodeBlock>{`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash`}</CodeBlock>
                        <p className='mt-3 text-sm text-muted-foreground'>重新加载 shell：</p>
                        <CodeBlock>{`source ~/.bashrc`}</CodeBlock>
                        <p className='mt-3 text-sm text-muted-foreground'>安装 Node LTS：</p>
                        <CodeBlock>{`nvm install --lts
nvm use --lts`}</CodeBlock>
                        <p className='mt-3 text-sm text-muted-foreground'>检查 Node.js 和 npm：</p>
                        <CodeBlock>{`node -v
npm -v`}</CodeBlock>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>3. 在 WSL 里安装 Claude Code</h3>
                        <p className='text-sm text-muted-foreground'>使用 npm 全局安装 Claude Code。</p>
                        <CodeBlock>{`npm install -g @anthropic-ai/claude-code`}</CodeBlock>
                        <p className='mt-3 text-sm text-muted-foreground'>检查安装结果：</p>
                        <CodeBlock>{`claude --version
which claude`}</CodeBlock>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>4. 在 WSL 里配置 ModelBridge</h3>
                        <CodeBlock>{`cat >> ~/.bashrc <<'EOF'

# Claude Code via ModelBridge
export ANTHROPIC_BASE_URL="https://www.modelbridge.cloud"
export ANTHROPIC_AUTH_TOKEN="sk-你的ModelBridge_API_KEY"
export ANTHROPIC_API_KEY=""
EOF

source ~/.bashrc`}</CodeBlock>
                        <p className='mt-3 text-sm text-muted-foreground'>检查环境变量是否生效，不要完整打印 key：</p>
                        <CodeBlock>{`echo "$ANTHROPIC_BASE_URL"
echo "\${ANTHROPIC_AUTH_TOKEN:0:8}"
echo "$ANTHROPIC_API_KEY"`}</CodeBlock>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>5. 启动 Claude Code 测试</h3>
                        <p className='text-sm text-muted-foreground'>进入一个测试目录后，直接启动 Claude 验证配置是否生效。</p>
                        <CodeBlock>{`cd /path/to/your/project
claude`}</CodeBlock>
                      </div>
                    </div>
                  </Section>
                ) : (
                  <Section title='Windows + WSL 安装并配置 Codex CLI' id='codex-windows'>
                    <div className='space-y-4'>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>1. 安装 WSL</h3>
                        <p className='text-sm text-muted-foreground'>先用管理员身份打开 PowerShell。</p>
                        <p className='text-sm text-muted-foreground'>按 <code className='mx-1 rounded bg-muted px-1 py-0.5'>Win</code> 键，搜索：</p>
                        <CodeBlock>{`PowerShell`}</CodeBlock>
                        <p className='text-sm text-muted-foreground'>右键选择：</p>
                        <CodeBlock>{`以管理员身份运行`}</CodeBlock>
                        <p className='text-sm text-muted-foreground'>然后执行：</p>
                        <CodeBlock>{`wsl --install`}</CodeBlock>
                        <p className='text-sm text-muted-foreground'>安装完成后，重启电脑。</p>
                        <p className='text-sm text-muted-foreground'>重启后，系统会自动打开 Ubuntu 初始化窗口。按照提示设置 Linux 用户名和密码。</p>
                        <p className='text-sm text-muted-foreground'>如果没有自动打开，可以按 <code className='mx-1 rounded bg-muted px-1 py-0.5'>Win</code> 键搜索：</p>
                        <CodeBlock>{`Ubuntu`}</CodeBlock>
                        <p className='text-sm text-muted-foreground'>然后打开。</p>
                        <p className='text-sm text-muted-foreground'>进入 Ubuntu 后，执行下面命令确认 WSL 正常：</p>
                        <CodeBlock>{`uname -a`}</CodeBlock>
                        <p className='text-sm text-muted-foreground'>如果能看到 Linux 相关信息，说明 WSL 已经安装成功。</p>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>2. 在 WSL 里安装 Node.js</h3>
                        <p className='text-sm text-muted-foreground'>进入 Ubuntu 终端后，先更新系统软件包：</p>
                        <CodeBlock>{`sudo apt update
sudo apt install -y curl`}</CodeBlock>
                        <p className='text-sm text-muted-foreground'>推荐使用 nvm 安装 Node.js：</p>
                        <CodeBlock>{`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash`}</CodeBlock>
                        <p className='text-sm text-muted-foreground'>安装完成后，重新加载 shell 配置：</p>
                        <CodeBlock>{`source ~/.bashrc`}</CodeBlock>
                        <p className='text-sm text-muted-foreground'>安装 Node.js LTS 版本：</p>
                        <CodeBlock>{`nvm install --lts
nvm use --lts`}</CodeBlock>
                        <p className='text-sm text-muted-foreground'>检查 Node.js 和 npm 是否安装成功：</p>
                        <CodeBlock>{`node -v
npm -v`}</CodeBlock>
                        <p className='text-sm text-muted-foreground'>只要能正常输出版本号，就说明 Node.js 安装成功。</p>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>3. 在 WSL 里安装 Codex CLI</h3>
                        <p className='text-sm text-muted-foreground'>使用 npm 全局安装 Codex CLI：</p>
                        <CodeBlock>{`npm i -g @openai/codex`}</CodeBlock>
                        <p className='text-sm text-muted-foreground'>检查 Codex CLI 是否安装成功：</p>
                        <CodeBlock>{`codex --version
which codex`}</CodeBlock>
                        <p className='text-sm text-muted-foreground'>如果能看到 Codex 版本号，并且路径类似：</p>
                        <CodeBlock>{`/home/你的用户名/.nvm/versions/node/xxx/bin/codex`}</CodeBlock>
                        <p className='text-sm text-muted-foreground'>说明 Codex CLI 已经安装成功。</p>
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>4. 在 WSL 里配置 ModelBridge</h3>
                        <p className='text-sm text-muted-foreground'>先创建 Codex 配置目录：</p>
                        <CodeBlock>{`mkdir -p ~/.codex
chmod 700 ~/.codex`}</CodeBlock>
                        <p className='mt-3 text-sm text-muted-foreground'>然后创建并写入配置文件：</p>
                        <div className='mt-3'>
                          <CodeBlock>{`cat > ~/.codex/config.toml <<'EOF'
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
                        <p className='mt-3 text-sm text-muted-foreground'>接着配置 ModelBridge API Key。</p>
                        <p className='text-sm text-muted-foreground'>把下面命令里的 <code className='mx-1 rounded bg-muted px-1 py-0.5'>sk-你的ModelBridge_API_KEY</code> 替换成你的真实 API Key：</p>
                        <div className='mt-3'>
                          <CodeBlock>{`echo 'export OPENAI_API_KEY="sk-你的ModelBridge_API_KEY"' >> ~/.bashrc
source ~/.bashrc`}</CodeBlock>
                        </div>
                        <p className='mt-3 text-sm text-muted-foreground'>验证 API Key 是否生效，不要完整打印 key：</p>
                        <CodeBlock>{`echo \${OPENAI_API_KEY:0:8}`}</CodeBlock>
                        <p className='mt-3 text-sm text-muted-foreground'>检查 Codex 配置文件：</p>
                        <CodeBlock>{`cat ~/.codex/config.toml`}</CodeBlock>
                        <p className='mt-3 text-sm text-muted-foreground'>最终配置文件应该类似这样：</p>
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
                      </div>
                      <div>
                        <h3 className='mb-2 text-sm font-semibold'>5. 启动 Codex 测试</h3>
                        <p className='text-sm text-muted-foreground'>进入一个测试目录后，直接启动 Codex 验证配置是否生效。</p>
                        <CodeBlock>{`cd /path/to/your/project
codex`}</CodeBlock>
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
                      <h3 className='mb-2 text-sm font-semibold'>2. 安装 Node.js</h3>
                      <p className='text-sm text-muted-foreground'>用 Homebrew 安装 Node.js，作为 Claude Code 的运行环境。</p>
                      <CodeBlock>{`brew update
brew install node`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>3. 清理旧环境</h3>
                      <p className='text-sm text-muted-foreground'>先清理旧的 Claude Code 环境变量，避免和新配置冲突。</p>
                      <CodeBlock>{`unset ANTHROPIC_API_KEY
unset ANTHROPIC_AUTH_TOKEN
unset ANTHROPIC_BASE_URL
unset ANTHROPIC_MODEL`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>4. 安装 Claude Code CLI</h3>
                      <p className='text-sm text-muted-foreground'>使用 npm 全局安装 Claude Code CLI。</p>
                      <CodeBlock>{`npm i @anthropic-ai/claude-code -g`}</CodeBlock>
                    </div>
                    <div>
                      <h3 className='mb-2 text-sm font-semibold'>5. 配置 ModelBridge</h3>
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
                      <h3 className='mb-2 text-sm font-semibold'>6. 启动 Claude Code 测试</h3>
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
                        <h3 className='mb-2 text-sm font-semibold'>1. 安装 Node.js</h3>
                        <p className='text-sm text-muted-foreground'>先安装 Node.js，作为 Codex CLI 的运行环境。</p>
                        <CodeBlock>{`sudo curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs`}</CodeBlock>
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
                        <h3 className='mb-2 text-sm font-semibold'>3. 手动创建 `~/.codex/config.toml`</h3>
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
                        <h3 className='mb-2 text-sm font-semibold'>4. 设置 API Key</h3>
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
                        <h3 className='mb-2 text-sm font-semibold'>5. 启动 Codex 测试</h3>
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
