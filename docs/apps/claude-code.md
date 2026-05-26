# Claude Code

Claude Code 教程，说明如何把 Anthropic 的终端编程助手接入 New API。它适合代码理解、多文件编辑和终端内的日常开发流程，也可以和 VS Code、JetBrains 等 IDE 配合使用。

## 项目介绍

Claude Code 的核心价值是把终端里的编程助手和项目代码库直接连接起来。你可以用它快速扫描大规模代码库、理解项目结构、生成代码修改建议，并把原本需要多步完成的开发任务压缩成更自然的命令式工作流。

官方主页：

- https://www.anthropic.com/claude-code

## 效果演示

原文包含两张演示图，分别展示 Claude Code 的介绍界面与实际工作流。离线文档中先保留该章节，方便后续补齐截图资源。

## 特性

- 代码理解：通过智能代理做深度代码库分析，帮助理解项目结构和依赖关系，也能自动生成高层级概览，降低上手大仓库的成本。
- 代码编辑：支持多文件协同编辑，适合复杂修改，输出的建议会尽量贴近项目既有模式和架构。
- 集成能力：可在终端直接运行，不需要切换上下文，也能与 VS Code、JetBrains IDE 兼容。
- 代码生成和优化：可生成代码、创建测试、修复错误，覆盖从概念到提交的完整流程，并针对代码生成和理解做过优化。
- 安全与灵活性：改动需要用户明确授权，文件和命令操作更安全，同时可适配用户的代码规范并支持自定义配置。
- 工具链整合：可与 GitHub、GitLab 等工具结合，也能接入测试套件和构建系统，强化现有开发工具链。
- 跨平台与扩展：支持 Windows、macOS、Linux，也可以配置在 SDK 或 GitHub Actions 中运行。
- 主要应用场景：代码库入门和理解、代码问题修复与优化、项目重构和新功能实现。
- 用户反馈亮点：可减少日常开发中的重复劳动，在复杂多步骤任务中表现稳定，能扩展开发方式。

## AI 模型配置方法

### Windows

#### 1. 安装 Node.js 环境

Claude Code 需要 Node.js 环境。

建议做法：

1. 打开 Node.js 官方站点并下载 LTS 版本。
2. 运行 `.msi` 安装包。
3. 按默认选项完成安装。

验证安装：

```powershell
node --version
npm --version
```

### Windows 注意事项

- 建议使用 PowerShell 而不是 CMD。
- 如果遇到权限问题，尝试以管理员身份运行。
- 某些杀毒软件可能会误报，需要加入白名单。

#### 2. 安装 Git Bash

Windows 环境下建议使用 Git Bash 完成 Claude Code 的安装步骤，后续的环境变量配置和日常使用仍然可以在 PowerShell 或 CMD 中进行。

安装完成后可验证：

```bash
git --version
```

#### 3. 安装 Claude Code

在 PowerShell 中执行：

```powershell
npm install -g @anthropic-ai/claude-code
```

安装完成后验证：

```bash
claude --version
```

如果系统提示需要补充 `PATH`，可执行：

```powershell
[Environment]::SetEnvironmentVariable('Path', ([Environment]::GetEnvironmentVariable('Path','User') + ";$HOME\.local\bin"), 'User')
```

#### 4. 设置环境变量

Windows 下可以直接执行一键配置脚本：

```powershell
iex (irm 'https://raw.githubusercontent.com/QuantumNous/new-api-docs/refs/heads/main/helper/claude-cli-setup.ps1')
```

#### 5. 开始使用 Claude Code

启动 Claude Code：

```bash
claude
```

如果在项目目录中使用：

```bash
cd C:\path\to\your\project
claude
```

进入 Claude Code 后，输入：

```bash
/model
```

然后选择模型即可。

> 注意：设置环境变量后，所有模型请求都会走自定义接入点，包括官方预设模型在内，也不会消耗官方账号额度。

### macOS 端图文指引

#### 1. 安装 Claude Code CLI

在终端中执行：

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

如果安装脚本提示需要补充 PATH，可按提示执行对应命令：

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

#### 2. 设置环境变量

macOS 下可以通过脚本一键配置：

```bash
curl -fsSL https://raw.githubusercontent.com/QuantumNous/new-api-docs/refs/heads/main/helper/claude-cli-setup.sh | bash
```

验证安装：

```bash
claude --version
```

#### 3. 开始使用 Claude Code

启动 Claude Code：

```bash
claude
```

在项目目录中使用：

```bash
cd /path/to/your/project
claude
```

输入：

```bash
/model
```

然后选择模型即可。

> 注意：设置环境变量修改 `ANTHROPIC_BASE_URL` 后，所有模型请求都会走自定义接入点，也不会使用官方账号额度。

#### 4. macOS 常见问题解决

如果 macOS 因安全策略阻止 Claude Code 运行，可以：

1. 打开“系统偏好设置”。
2. 进入“安全性与隐私”。
3. 选择“仍要打开”或“允许”。

如果仍然无法通过系统限制，可按需在终端中执行：

```bash
sudo spctl --master-disable
```

### Linux 端图文指引

#### 1. 安装 Claude Code

在终端中执行：

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

如果遇到权限问题，可以改用：

```bash
sudo curl -fsSL https://claude.ai/install.sh | bash
```

验证安装：

```bash
claude --version
```

#### 2. 设置环境变量

Linux 下可通过脚本一键配置：

```bash
curl -fsSL https://raw.githubusercontent.com/QuantumNous/new-api-docs/refs/heads/main/helper/claude-cli-setup.sh | bash
```

#### 3. 开始使用 Claude Code

启动 Claude Code：

```bash
claude
```

在项目目录中使用：

```bash
cd /path/to/your/project
claude
```

输入：

```bash
/model
```

然后选择模型即可。

> 注意：设置环境变量修改 `ANTHROPIC_BASE_URL` 后，所有模型请求都会走自定义接入点，也不会使用官方账号额度。

#### 4. Linux 常见问题解决

如果 Linux 发行版缺少依赖，可以按发行版补装开发工具链：

```bash
# Ubuntu / Debian
sudo apt install build-essential

# CentOS / RHEL
sudo dnf groupinstall "Development Tools"
```

如果环境变量没有生效，建议检查：

1. 是否修改了正确的配置文件，例如 `~/.bashrc` 或 `~/.zshrc`。
2. 是否重新打开了终端，或者执行了 `source ~/.bashrc`。
3. 是否能通过下面的命令看到配置值：

```bash
echo $ANTHROPIC_BASE_URL
```

## 相关链接

- 官方主页：`https://www.anthropic.com/claude-code`
- 目标文档：`https://docs.newapi.pro/zh/docs/apps/claude-code`
