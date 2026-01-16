您希望将“报告自定义”的交互体验升级为一个独立的弹窗，以便提供更大的输入空间和更丰富的视觉体验。

### 🛠️ 优化计划

#### 1. 创建“情绪魔法师”弹窗组件 (`src/components/CustomPromptModal.tsx`)
*   **目标**: 替换当前的小输入框交互。
*   **UI 设计**:
    *   **标题**: "✨ 情绪魔法师" (使用渐变色或俏皮字体)。
    *   **内容**: 一个大的 `textarea`，支持多行输入，有 placeholder 提示用户（如“用鲁迅的口吻...”）。
    *   **装饰**: 添加一些魔法相关的图标（如 `Wand2`, `Sparkles`）和背景微动效。
    *   **操作**: 底部有“开始施法” (Send) 和“取消”按钮。
*   **交互**: 弹窗居中显示，背景模糊。

#### 2. 修改 AIReportCard 组件 (`src/components/AIReportCard.tsx`)
*   **逻辑变更**:
    *   点击下拉菜单中的“报告自定义”不再是将主按钮变为输入框。
    *   改为设置 `isCustomPromptModalOpen` 状态为 `true`，直接打开新弹窗。
    *   移除原有的 `customPromptMode` 及其相关的输入框渲染逻辑，恢复主按钮的单一职责。
*   **数据流**:
    *   `CustomPromptModal` 接收 `onConfirm(prompt)` 回调。
    *   当用户在弹窗中点击“开始施法”，`AIReportCard` 接收 prompt，设置 `customPrompt` 状态，并调用 `setIsModalOpen(true)` 打开原本的报告展示弹窗（`AIReportModal`）。

### 📅 执行顺序
1.  **创建组件**: 新建 `src/components/CustomPromptModal.tsx`。
2.  **集成组件**: 修改 `src/components/AIReportCard.tsx`，引入新弹窗并移除旧的行内输入逻辑。

请确认执行。