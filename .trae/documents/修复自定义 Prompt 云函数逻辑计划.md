经过分析，问题出在云函数 `analyzeMood/index.js` 中。虽然我在前端 `AIReportModal` 组件中正确传递了 `customPrompt` 参数，但云函数并没有**使用**这个参数来覆盖或调整发送给 AI 的 Prompt。目前云函数内部依然使用写死的模板。

### 🚀 修复计划

#### 1. 修改云函数逻辑 (`cloudfunctions/analyzeMood/index.js`)
*   **目标**: 优先使用 `customPrompt`。
*   **逻辑**:
    *   解构参数时获取 `customPrompt`。
    *   在构建 Prompt 阶段：
        *   **如果有 `customPrompt`**: 直接将用户的 Prompt 作为主指令，但为了保证效果，我会在后面**追加**数据概览（分数和日记），确保 AI 知道要分析什么数据。
        *   **如果没有 `customPrompt`**: 继续使用原本的“心理咨询师”模板。

#### 2. 前端微调 (`src/components/AIReportModal.tsx`)
*   **目标**: 确保参数正确传递（已检查，代码正确，无需修改）。
*   **验证**: 再次确认 `handleAnalyze` 中 `data: { moodScores, notes, customPrompt }` 是否包含该字段。

### 📅 执行顺序
1.  **修改云函数**: 更新 `cloudfunctions/analyzeMood/index.js`。
2.  **部署云函数**: 这一步非常重要！修改云函数代码后，**必须重新部署**才能在云端生效。您需要使用 CloudBase CLI 或在控制台手动上传。由于我无法直接操作云端控制台，我将为您提供更新后的代码，并提示您如何部署（如果您配置了本地 CLI 部署流程，我可以直接更新文件）。**假设您本地有环境，我将更新本地文件。**

请确认执行。