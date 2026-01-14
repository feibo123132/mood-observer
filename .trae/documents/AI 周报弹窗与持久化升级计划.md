我将按照您的要求对 AI 周报功能进行重大升级，实现弹窗展示和本地持久化存储。

### 🚀 升级计划

#### 1. 💾 数据持久化 (`src/store/useMoodStore.ts`)
为了让周报内容“存起来”，我将在 Store 中新增管理逻辑：
*   **数据结构**: 新增 `reports: Record<string, string>`，Key 为 `年份-周数` (例如 `2024-3`)，Value 为报告内容。
*   **Actions**:
    *   `saveReport(year, week, content)`: 保存报告。
    *   `deleteReport(year, week)`: 删除报告。
    *   `getReport(year, week)`: 获取报告（辅助方法，也可直接访问 state）。
*   **持久化**: 利用现有的 `persist` 中间件，这些报告会自动保存到 LocalStorage，刷新页面不丢失。

#### 2. 🧩 创建弹窗组件 (`src/components/AIReportModal.tsx`)
这是一个全新的模态框组件，用于承载报告内容。
*   **UI**: 类似于 `RecordEditModal`，具有半透明背景、圆角卡片和关闭按钮。
*   **状态**:
    *   **Loading**: 显示骨架屏。
    *   **Streaming**: 打字机效果输出。
    *   **View**: 展示已保存的静态内容。
*   **操作**:
    *   **保存**: 仅在生成新报告后显示，点击调用 `saveReport`。
    *   **删除**: 仅在查看已保存报告时显示，点击调用 `deleteReport`。
    *   **关闭**: 简单的关闭弹窗。

#### 3. ⚡ 重构入口组件 (`src/components/AIReportCard.tsx`)
将原本的“大卡片”改为一个单纯的**触发按钮**。
*   **逻辑变更**:
    *   组件加载时，先检查 Store 中是否已有当周的报告。
    *   **如果有**: 显示“📜 查看本周情绪报告”按钮。
    *   **如果没有**: 显示“✨ 生成本周 AI 深度情绪报告”按钮。
*   **点击行为**: 无论是生成还是查看，点击后都**打开 Modal**，而不是在原地展开。

#### 4. 🔄 集成更新 (`src/pages/ReviewPage.tsx`)
*   传递 `currentYear` 给 `AIReportCard`，确保报告的 Key 是唯一的（`year-week`）。

我将按顺序执行这些修改。请确认是否开始？