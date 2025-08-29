# 变更记录（中文）

> 本文档用于记录在本仓库内进行的关键修改与其影响，便于后续排查与回溯。

## 2025-08-26

### 修复：Index TTS VLLM 声线下拉框显示问题
- 文件：`packages/stage-ui/src/stores/providers.ts`
- 修改：
  - 修复 Index TTS VLLM 提供者的声线列表显示问题
  - 将 `Object.keys(voices)` 改为支持数组和对象两种格式
  - 添加序号前缀，使声线下拉框显示为 `1-声线名称` 格式
- 背景：
  - 原代码使用 `Object.keys(voices)` 处理 API 返回的字符串数组
  - 导致下拉框显示数组索引（0, 1, 2...）而不是声线名称
  - 用户无法识别具体的声线选项
- 影响：
  - 修复后，声线下拉框正确显示声线名称
  - 添加序号前缀，提升用户体验和可读性
  - 保持向后兼容性，支持对象格式的 API 响应

### 修复：VoiceCard 组件布局问题导致声线名称显示不完整
- 文件：`packages/stage-ui/src/components/Menu/VoiceCard.vue`
- 修改：
  - 重构 VoiceCard 组件的布局结构
  - 将音频预览按钮和"No preview available"文本移到正确位置
  - 优化声线名称和预览按钮的排列方式
- 背景：
  - 原布局中音频预览按钮使用绝对定位，导致布局错乱
  - "No preview available"文本占用过多空间，影响声线名称显示
  - 声线名称被截断，用户无法看到完整的声线信息
- 影响：
  - 修复后，声线名称完整显示，不再被截断
  - 音频预览按钮位置更合理，用户体验更好
  - 整体布局更加清晰和美观

### 修复：VAD AudioWorklet 处理器名不一致
- 文件：`packages/stage-ui/src/libs/audio/vad.ts`
- 修改：
  - 将
    - `audioWorkletNode = new AudioWorkletNode(audioContext, 'vad-audio-worklet-processor')`
    替换为
    - `audioWorkletNode = new AudioWorkletNode(audioContext, 'vad-processor')`
- 背景：
  - 工作线程注册名为 `vad-processor`（见：
    - Web: `apps/stage-web/src/workers/vad/process.worklet.ts` 中 `registerProcessor('vad-processor', VADProcessor)`
    - Tauri: `apps/stage-tamagotchi/src/tauri/vad/process.worklet.ts` 中相同注册名
  - 主线程原本用 `'vad-audio-worklet-processor'` 实例化，导致浏览器报错：
    - `Failed to construct 'AudioWorkletNode': AudioWorkletNode cannot be created: The node name 'vad-audio-worklet-processor' is not defined in AudioWorkletGlobalScope.`
- 影响：
  - 修复后，“听觉模块 → Model Based（使用 AI 模型做更准确语音检测）”可正常初始化 AudioWorklet。

### 文档：新增中文启动指南与 FAQ
- 新增：`GETTING_STARTED.zh-CN.md`
  - 覆盖 Windows 环境（nvm + pnpm）、Web/Tauri 启动、常见问题。
  - FAQ 新增：
    - Q5：`could not rename downloaded file … (os error 2)` 的修复步骤（rustup 缓存清理、预装 nightly 组件等）。
    - Q6：`error: linker link.exe not found` 的修复方案（安装 VS Build Tools C++ 工作负载 / 加载 VsDevCmd 环境）。
    - Q7：`Provider credentials for <id> not found` 的成因与最小配置示例（OpenRouter / OpenAI 兼容 / Groq / Together 等）。
- `README.md` 顶部新增“快速开始（中文）”链接指向上述指南。
