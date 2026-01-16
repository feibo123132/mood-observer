根据您的反馈，我将对应用进行以下三项优化：

### 🛠️ 优化计划

#### 1. AI 报告按钮逻辑优化 (`src/components/AIReportCard.tsx`)
*   **目标**: 即使生成了报告，按钮依然显示为“✨ 生成情绪报告”，允许用户重新生成。
*   **修改**: 移除 `hasSavedReport` 对按钮文字和样式的控制，统一使用渐变色和生成文案。点击后打开弹窗，如果已有报告则在弹窗内显示（弹窗逻辑保持不变，支持覆盖）。

#### 2. 历史报告图标常驻 (`src/pages/ReviewPage.tsx`)
*   **目标**: 无论是否有历史报告，历史记录入口（文件图标）始终可见。
*   **修改**: 移除 `hasReports` 的条件渲染判断，使该按钮常驻显示。点击进入空列表页也是符合预期的行为。

#### 3. 记录编辑功能增强 (`src/components/RecordEditModal.tsx`)
*   **目标**: 允许用户修改情绪分数。
*   **修改**:
    *   在 Modal 头部增加一个滑动条 (`MoodSlider` 的简化版或直接使用 `<input type="range">`)。
    *   实时更新头部显示的数字和背景颜色。
    *   保存时将新的 `score` 一并提交给 `updateRecord`。
    *   **注意**: `updateRecord` 目前在 Store 中只接受 `newNote`，我需要先升级 Store 方法以支持更新分数。

### 📅 执行顺序
1.  **更新 Store**: 修改 `useMoodStore.ts` 中的 `updateRecord` 方法，使其支持部分更新（Partial Update）。
2.  **更新 Modal**: 改造 `RecordEditModal.tsx`，添加分数调节功能。
3.  **更新 ReviewPage**: 移除历史图标的条件判断。
4.  **更新 AIReportCard**: 统一按钮状态。

请确认执行。