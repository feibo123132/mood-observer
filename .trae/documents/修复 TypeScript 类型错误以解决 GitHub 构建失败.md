通过您提供的截图，我定位到了 GitHub Actions 构建失败的原因。

### 🚨 错误分析
截图中的错误信息明确指出：
`Error: src/services/AudioPlayer.ts(42,41): error TS2345: Argument of type 'AudioMode' is not assignable to parameter of type 'AudioMode'. Type '"friend"' is not assignable to type 'AudioMode'.`

**翻译成人话**：
在 `src/services/AudioPlayer.ts` 文件中，TypeScript 编译器发现您正在尝试使用一个名为 `"friend"` 的音频模式（可能是您最近添加的“友人模式”），但该模式**没有被定义在类型声明中**。

这通常是因为我们在业务逻辑中添加了新模式，却忘记更新类型定义文件，或者类型定义文件之间存在引用冲突。

### 🛠️ 解决方案
1.  **检查类型定义**：我需要找到定义 `AudioMode` 类型的文件（通常在 `types.ts` 或 `useSettingsStore.ts` 中），并确保 `"friend"` 被包含在联合类型中。
2.  **修复 AudioPlayer.ts**：确保 `AudioPlayer` 服务能正确处理 `"friend"` 类型。

我将按以下步骤进行修复：
1.  读取 `src/store/useSettingsStore.ts` 和 `src/services/AudioPlayer.ts`，查看类型定义。
2.  更新类型定义，将 `"friend"` 添加到 `AudioMode` 中。
3.  确保 `AudioPlayer` 中的逻辑支持新模式。