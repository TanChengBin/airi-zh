# 项目本地启动指南（Windows｜中文）

> 适用对象：使用 nvm 管理 Node 版本，偏好 npm，但本仓库需要 pnpm 参与安装与脚本执行。

## 1. 环境准备

- Node.js：建议使用 Node 20（LTS）
- 包管理器：pnpm 10.14（仓库已固定版本）
- Git
- 可选（仅 Tauri 桌面端需要）：
  - Rust toolchain（rustup + stable-MSVC）
  - Visual Studio 2022 Build Tools（C++ 工作负载 + Windows 10/11 SDK）
  - Microsoft Edge WebView2 Runtime

### 1.1 使用 nvm 安装 Node 20
```powershell
nvm install 20
nvm use 20
node -v
```

### 1.2 启用 pnpm（仅作为工具使用）
> 本仓库脚本与 workspace 解析强依赖 pnpm；你仍可在其他项目继续使用 npm。

- 方式 A：Corepack（推荐）
```powershell
corepack enable
corepack prepare pnpm@10.14.0 --activate
pnpm -v
```
- 方式 B：全局安装
```powershell
npm i -g pnpm@10.14.0
pnpm -v
```

## 2. 安装依赖（必须在仓库根目录）
```powershell
pnpm install
```
> 说明：根 `package.json` 的 `postinstall` 会使用 pnpm 构建内部包，npm 无法替代。

## 3. 启动 Web 版本（无需 Rust）
- 开发模式（Vite）
```powershell
pnpm --filter @proj-airi/stage-web dev
```
- 默认访问：`http://localhost:5173/`

## 4. 启动桌面版 Tauri（需要 Rust + 构建工具）

### 4.1 安装 Rust 及工具链
```powershell
winget install --id Rustlang.Rustup -e
# 重新打开一个新的 PowerShell 窗口（重要）
rustup default stable
rustup update
rustup target add x86_64-pc-windows-msvc
```
> 若 `rustup` 未被识别：
> - 关闭并重新打开 PowerShell；或
> - 临时加入 PATH 后再永久保存：
> ```powershell
> $env:PATH += ";$env:USERPROFILE\.cargo\bin"
> [Environment]::SetEnvironmentVariable("PATH", $env:PATH, "User")
> rustup -V
> cargo -V
> ```

### 4.2 安装 Windows 构建依赖
```powershell
winget install --id Microsoft.VisualStudio.2022.BuildTools -e
# 安装时勾选“使用 C++ 的桌面开发”，并包含 Windows 10/11 SDK
winget install --id Microsoft.EdgeWebView2Runtime -e
```

### 4.3 启动 Tauri 应用
```powershell
pnpm --filter @proj-airi/stage-tamagotchi run app:dev
```

## 5. 其它常用命令
- 构建所有应用与包
```powershell
pnpm -w build
```
- 单独构建 Web
```powershell
pnpm --filter @proj-airi/stage-web build
```
- Lint 检查
```powershell
pnpm -w lint
```

## 6. 常见问题（FAQ）

### Q1：我想只用 npm 可以吗？
不建议。本仓库使用了 pnpm 的 workspace 过滤器、`catalog:` 与 `overrides` 等特性，npm 不兼容。若强制改造，需要：
- 重写根脚本与子包脚本，移除 pnpm 专属语法；
- 迁移锁文件与 workspace 链接；
- 全量回归验证。成本与风险较高。

### Q2：`rustup` / `cargo` 无法识别？
- 关掉当前 PowerShell，重新打开即可（刷新 PATH）。
- 或检查 `~\.cargo\bin\rustup.exe` 是否存在，并手动将其加入 PATH（见 4.1 备注）。

### Q3：端口被占用或页面无法访问？
- Vite 默认端口 `5173`，可在 `apps/stage-web/vite.config.ts` 修改或使用 CLI 指定其他端口。
- 检查防火墙或代理软件是否拦截本地端口。

### Q4：构建很慢？
- 初次安装会下载较多依赖；后续依赖缓存与 `turbo` 构建缓存会提速。
- 可按需运行目标包：`pnpm --filter <包名> dev|build`。

### Q5：安装 nightly 组件时报“could not rename downloaded file … (os error 2)”怎么办？
原因：项目使用 `rust-toolchain.toml` 强制 `nightly-2025-05-25`，安装组件（如 `rust-analyzer`）时，安全软件/权限有时会导致已下载临时文件重命名失败。

解决步骤（建议管理员 PowerShell）：
```powershell
# 1) 结束可能占用的 rust-analyzer 进程（VSCode/LSP）
Stop-Process -Name "rust-analyzer" -Force -ErrorAction SilentlyContinue

# 2) 清理 rustup 下载/临时目录
Remove-Item "$env:USERPROFILE\.rustup\downloads\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$env:USERPROFILE\.rustup\tmp\*" -Recurse -Force -ErrorAction SilentlyContinue

# 3) 预安装项目要求的 nightly 与组件
rustup toolchain install nightly-2025-05-25 `
  -c rustc -c cargo -c rustfmt -c clippy -c rust-analyzer `
  --profile minimal

# 4) 为该 nightly 添加 Windows 目标
rustup target add --toolchain nightly-2025-05-25 x86_64-pc-windows-msvc

# 5) 验证当前生效的 toolchain（应显示 nightly-2025-05-25 … overridden by rust-toolchain.toml）
rustup show active-toolchain
```

若仍失败：
- 重开管理员 PowerShell 重试第 1~4 步；
- 为 `C:\Users\<你>\.rustup\downloads` 与 `C:\Users\<你>\.rustup\tmp` 加白名单；
- 确认磁盘与路径权限正常。

### Q6：`error: linker link.exe not found` 怎么办？
原因：Windows 下 `x86_64-pc-windows-msvc` 目标依赖 MSVC 链接器 `link.exe`。如果没有安装 VS Build Tools 的 C++ 工作负载，或未在当前终端加载 VS 构建环境，就会报此错。

解决方案 A（推荐）：安装 C++ 工作负载并包含 Windows SDK
1) 打开“Visual Studio Installer”（随 Build Tools 安装），在“Build Tools 2022”条目点击“修改”。
2) 选择“使用 C++ 的桌面开发”工作负载，右侧“安装详细信息”中确保勾选：
   - MSVC v143 - VS 2022 C++ x64/x86 构建工具（`Microsoft.VisualStudio.Component.VC.Tools.x86.x64`）
   - Windows 10/11 SDK（任一最新版本均可）
   - C++ CMake tools for Windows（可选）
3) 应用安装后重启终端（必要时重启系统）。

```powershell
#执行完后，重开终端或运行 VsDevCmd.bat
where link
pnpm --filter @proj-airi/stage-tamagotchi run app:dev
```

解决方案 B：在当前会话加载 VS 构建环境（适用于已安装组件但未加载环境变量）
```powershell
# 找到 VS Build Tools 安装目录
& "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe" -products * -latest -property installationPath

# 假设输出为：C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools
$vsPath = (& "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe" -products * -latest -property installationPath)
& "$vsPath\Common7\Tools\VsDevCmd.bat" -host_arch=x64 -arch=x64 | Out-Null

# 验证 linker 是否可用
where link

# 再次编译或启动 Tauri
cargo --version
pnpm --filter @proj-airi/stage-tamagotchi run app:dev
```

若仍报 `link.exe not found`：
- 再次运行“Visual Studio Installer”，确认已安装上面列出的组件；
- 在“可选组件”中确保存在 `MSVC v143` 与“Windows 10/11 SDK”；
- 以管理员 PowerShell 重新执行 VsDevCmd；
- 或直接使用“x64 Native Tools Command Prompt for VS 2022”启动构建。

### Q7：页面提示 “Provider credentials for <id> not found”？
原因：未给选定的 Provider 配置凭据。项目在浏览器 `localStorage` 的 `settings/credentials/providers` 键下保存各 Provider 的 `apiKey/baseUrl` 等，缺失时会报错。

解决：在页面右上角或侧边栏进入“设置 → Providers（提供商）”，为你要使用的 Provider 填写最少必填项，保存后回到主界面选择模型即可。

常用 Provider 最小配置示例：
- OpenRouter（推荐聚合）
  - baseUrl: `https://openrouter.ai/api/v1/`
  - apiKey: `sk-...`（从 OpenRouter 账号获取）
- OpenAI 兼容（官方 OpenAI 或其他兼容服务）
  - baseUrl: `https://api.openai.com/v1`（或你的兼容服务地址）
  - apiKey: `sk-...`
- Groq
  - baseUrl: `https://api.groq.com/openai/v1`
  - apiKey: `gsk_...`
- Together.ai
  - baseUrl: `https://api.together.xyz/v1`
  - apiKey: `...`
- Google Gemini（如在 Web 端走兼容层，需对应代理/兼容端点）
  - baseUrl: 你的兼容端点（例如 unspeech/xsai 适配层）
  - apiKey: `...`

提示：
- 配置完成后，回到主界面模型选择器，确保能列出模型（列表依赖 Provider 的 listModels 能力和有效的 apiKey/baseUrl）。
- 若配置错乱，可在浏览器控制台执行清理：
```js
localStorage.removeItem('settings/credentials/providers')
```
然后刷新页面重新配置。

---

如需 Linux/macOS 启动说明或 CI 环境配置，我可以按你的实际平台继续补充。
