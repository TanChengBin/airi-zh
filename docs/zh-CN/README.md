# AIRI 项目启动指南

## 环境要求

- **Node.js**: 18+ (推荐使用 LTS 版本)
- **pnpm**: 8+ (推荐使用最新版本)
- **Git**: 最新版本

## 快速启动

### 1. 安装依赖

```bash
# 安装所有依赖
pnpm install
```

### 2. 启动开发服务器

#### Web 版本
```bash
# 启动 Web 开发服务器
pnpm dev:web
```

#### Tauri 桌面版本
```bash
# 启动 Tauri 开发版本
pnpm dev:tauri
```

### 3. 访问应用

- **Web**: http://localhost:5173
- **Tauri**: 会自动打开桌面应用窗口

## 常用命令

```bash
# 构建生产版本
pnpm build:web          # Web 版本
pnpm build:tauri        # Tauri 版本

# 代码检查
pnpm lint               # ESLint 检查
pnpm type-check         # TypeScript 类型检查

# 测试
pnpm test               # 运行测试
```

## 项目结构

```
airi/
├── apps/               # 应用目录
│   ├── stage-web/     # Web 版本
│   └── stage-tamagotchi/  # Tauri 版本
├── packages/           # 共享包
├── crates/            # Rust 相关
└── services/          # 服务目录
```

## 常见问题

### 依赖安装失败
```bash
# 清理缓存后重试
pnpm store prune
pnpm install
```

### 端口被占用
修改 `vite.config.ts` 中的端口配置，或使用其他可用端口。

### Tauri 构建失败
确保已安装 Rust 工具链：
```bash
rustup update
rustup target add wasm32-unknown-unknown
```

## 开发提示

- 使用 `pnpm dev:web` 进行快速 Web 开发
- 使用 `pnpm dev:tauri` 测试桌面功能
- 修改共享包后需要重启开发服务器
- 查看控制台日志获取详细错误信息

## 更多信息

- 详细文档: [docs/](docs/)
- 问题反馈: 提交 Issue 或 PR
- 社区讨论: 查看项目讨论区
