# closeAsync — 异步关闭库（JavaScript）

`await lib.closeAsync()` 异步关闭库句柄，等待所有异步任务和 Worker 完成后释放资源。

## 语法

```ts
await lib.closeAsync();
```

### 返回值

`Promise<void>` — 所有任务完成后 resolve。

## 各语言/运行时行为

| 语言/运行时 | 实现 |
|--------|------|
| **KossJS** | 调用原生 `handle.closeAsync()` — 标记库关闭 → 轮询等待异步任务（每 50ms）→ 所有任务完成后释放库句柄 |
| **Deno** | 调用 `handle.close()` + 清理引用 |
| **Node.js** | 主线程 `close()` + 优雅关闭 Worker（等待进行中任务 → 终止 Worker → 清理引用） |
| **Bun** | 主线程 `close()` + 优雅关闭 Worker |

## 与 `close()` 的区别

| | `close()` | `closeAsync()` |
|--|----------|---------------|
| 调用方式 | 同步 | `await` 异步 |
| 等待异步任务 | 否 | 是（KossJS/Node.js/Bun） |
| Worker 清理 | 否 | 是（Node.js/Bun） |
| 幂等 | 是 | 是 |

> [!WARNING]
> 如果你使用了 `funcAsync()`，**必须**使用 `closeAsync()` 而非 `close()`。直接调用 `close()` 可能导致 Worker 残留，任务继续在后台访问已释放的内存（未定义行为）。

## 使用示例

```ts
import { Library, types } from '@tt23xrstudio/senri_ffi';

const lib = Library.load(
  process.platform === 'win32' ? 'msvcrt.dll' : 'libc.so.6'
);

// 启动异步任务
const sleep = lib.funcAsync('sleep', types.uint32, [types.uint32]);
sleep(3); // 不 await — 任务在后台运行

// 优雅关闭 — 等待 sleep(3) 完成后释放
await lib.closeAsync();
console.log('Library fully closed');

// 或：不需要等待时直接同步关闭
const lib2 = Library.load('libc.so.6');
lib2.close(); // 立即关闭，不等待任何任务
```

## KossJS 的 Tainted 状态

在 KossJS 上，如果使用了 `allowForceKill` 强制杀了线程，库会被标记为 **`tainted`**（污染状态）：

```ts
const fn = lib.funcAsync('infinite_loop', types.void, [], {
  allowForceKill: true,
});
const ctrl = new AbortController();
fn({ signal: ctrl.signal });
ctrl.abort(); // 强制杀线程 → 库标记为 tainted

// tainted 状态下 closeAsync() 立即 resolve，不等待
await lib.closeAsync();
```

---

**相关文档**:
- [funcAsync() — 异步函数绑定](/zh/api/funcAsync)
- [close() — 同步关闭库](/zh/api/close)
- [Library.load()](/zh/api/library)
