# 修复 GitHub Action 构建错误

GitHub Action 报错 `Property 'type' does not exist on type ...` 是因为 `<audio>` 标签本身不支持 `type` 属性（只有 `<source>` 标签支持）。TypeScript 对此进行了严格检查，导致构建失败。

为了修复这个问题，同时保留显式指定 `audio/mpeg` 类型的意图（这对移动端兼容性很重要），我将修改 `HomePage.tsx` 中的音频组件结构：

1.  **使用 `<source>` 标签**：
    将 `<audio>` 标签的 `src` 和 `type` 属性移动到其子元素 `<source>` 中。这是 HTML5 标准的写法，也是 TypeScript 接受的合法类型。

    ```tsx
    // 修改前 (会报错)
    <audio ref={audioRef} src={activeAudioSrc} type="audio/mpeg" ... />

    // 修改后 (标准写法)
    <audio ref={audioRef} ... >
      <source src={activeAudioSrc} type="audio/mpeg" />
    </audio>
    ```

2.  **保留加载逻辑**：
    现有的 `useEffect` 已经包含了 `audioRef.current.load()` 调用。这非常关键，因为当 `<source>` 的 `src` 改变时，浏览器不会自动重新加载音频，必须手动调用 `load()`。现有的代码已经处理好了这一点，所以这次修改是安全的。

### 变更详情

**文件**: `src/pages/HomePage.tsx`

```typescript
// 将原本的单标签写法改为包含 source 子标签
<audio 
  ref={audioRef} 
  // src={activeAudioSrc}  <-- 移除
  // type="audio/mpeg"     <-- 移除
  style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }} 
  preload="auto"
  playsInline
>
  <source src={activeAudioSrc} type="audio/mpeg" />
</audio>
```