遵循您的指示，我将**直接复用**现有的 `src/lib/cloudbase.ts` 配置，并专注于前端 UI 的实现。

### 📅 开发计划

#### 第一步：创建 AI 分析组件 (`src/components/AIReportCard.tsx`)
这将是一个独立的、自包含的组件，负责与云函数交互和展示结果。
*   **数据源**: 通过 `import { app } from '../lib/cloudbase'` 引入云开发实例（*假设您的文件中已导出 `app`*）。
*   **核心逻辑**:
    *   **触发**: 点击按钮调用 `app.callFunction({ name: 'analyzeMood', ... })`。
    *   **状态管理**: `idle` (待机) → `loading` (思考中) → `streaming` (打字机输出) → `done` (完成)。
*   **UI 交互**:
    *   ✨ **入口**: 带有流光效果的 "AI 深度分析" 按钮。
    *   ⏳ **等待**: 优雅的骨架屏动画 + "AI 正在阅读您的日记..." 提示。
    *   📝 **展示**: 实现 **打字机特效 (Typewriter Effect)**，模拟咨询师逐字语重心长地对话，增强沉浸感。
    *   🎨 **排版**: 自动识别段落，进行美观的文本渲染。

#### 第二步：集成到周回顾页面 (`src/pages/ReviewPage.tsx`)
*   **位置**: 在周回顾列表上方插入 `AIReportCard`。
*   **数据连接**: 实时传入当前选中周的 `moodScores` 和 `notes`。
*   **联动**: 切换周次时，自动重置分析状态，确保用户总是看到对应周的报告。

我将开始编写代码。请确认 `src/lib/cloudbase.ts` 中确实导出了名为 `app` 的实例（如果没有，请您自行添加 `export const app = ...`）。