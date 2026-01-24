我将按照您提供的图片指示修复 `ReportVisualization.tsx` 中的图表数据处理逻辑。

### 修改计划

1.  **引入必要的工具函数**：
    在文件顶部添加 `getMoodState` 和 `getHarvestLevel` 的导入，这两个函数分别用于处理普通心情和“收获”类型的记录。
    ```typescript
    import { getMoodState } from '../utils/moodUtils';
    import { getHarvestLevel } from '../utils/harvestUtils';
    ```

2.  **修正 `chartData` 生成逻辑**：
    将原本直接访问不存在的 `r.mood` 属性，改为根据 `r.type` 和 `r.score` 动态计算标签。
    ```typescript
    // 修改前: mood: r.mood
    // 修改后:
    mood: r.type === 'harvest' ? getHarvestLevel(r.score).label : getMoodState(r.score).label
    ```

3.  **修正 `moodDist` 分布统计逻辑**：
    同样，将原本依赖 `r.mood` 进行统计的逻辑，改为先动态计算标签，再统计分布。
    ```typescript
    // 修改前: dist[r.mood] = ...
    // 修改后:
    const label = r.type === 'harvest' ? getHarvestLevel(r.score).label : getMoodState(r.score).label;
    dist[label] = (dist[label] || 0) + 1;
    ```

**验证：**
我已经确认 `record` 数据结构中包含 `type` 和 `score` 字段，且 `getMoodState` 和 `getHarvestLevel` 工具函数确实存在于项目中。这个修改方案是安全且正确的。
