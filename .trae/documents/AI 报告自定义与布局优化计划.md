我将根据您的最新需求，对应用进行以下三个方面的优化：

### 🛠️ 优化计划

#### 1. 调整记录编辑弹窗布局 (`src/components/RecordEditModal.tsx`)
*   **目标**: 将“调整分数”滑块移动到“笔记/评论”区域下方。
*   **修改**: 调整 JSX 结构，交换 `Score Slider` 和 `Note Edit Area` 代码块的顺序。

#### 2. 重构 AI 报告下拉菜单 (`src/components/AIReportCard.tsx`)
*   **目标**:
    *   增加折叠功能：默认只显示大类（“选择时间范围”、“报告自定义”），点击大类展开子项。
    *   新增“报告自定义”大类：与“选择时间范围”同级。
*   **修改**:
    *   重构下拉菜单的数据结构，支持嵌套菜单。
    *   新增 `activeMenu` 状态来管理当前展开的菜单项。
    *   实现“报告自定义”点击后的交互逻辑。

#### 3. 实现自定义 Prompt 功能 (`src/components/AIReportCard.tsx`)
*   **目标**: 点击“报告自定义”后，主按钮区域变为输入框。
*   **修改**:
    *   新增 `customPromptMode` 状态。
    *   当该状态激活时，渲染一个带发送按钮的输入框替代原本的“生成情绪报告”按钮。
    *   用户输入 Prompt 后，调用 `AIReportModal` 并传递自定义 Prompt（需要同步修改 Modal 组件以支持接收 Prompt）。

### 📅 执行顺序
1.  **调整 Modal 布局**: 修改 `RecordEditModal.tsx`。
2.  **升级 Modal 接口**: 修改 `AIReportModal.tsx`，使其支持 `customPrompt` 参数。
3.  **重构 Dropdown**: 修改 `AIReportCard.tsx`，实现折叠菜单和自定义输入框逻辑。

请确认执行。