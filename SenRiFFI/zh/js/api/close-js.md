# close — 同步关闭库（JavaScript）

`lib.close()` 同步关闭库句柄并释放资源。

## 语法

```ts
lib.close();
```

### 返回值

`void` — 无返回值。

## 行为

- 清空函数缓存（`_funcCache.clear()`）
- 释放库句柄（取决于语言/运行时实现）
- 设置 `_closed = true`
- 重复调用不报错（幂等）

## 各语言/运行时实现

| 语言/运行时 | 实现 |
|--------|------|
| KossJS | `handle.close()` — 调用 `dlclose` / `FreeLibrary` |
| Bun | 置空内部引用 (`__lib = null`) |
| Deno | `handle.close()` |
| Node.js | 空操作（koffi 自动管理生命周期） |

> [!WARNING]
> `close()` **不等待**异步任务完成。如果存在进行中的 `funcAsync` 任务，调用 `close()` 后这些任务可能继续访问已释放的内存。

## 使用示例

```ts
import { Library, types } from '@tt23xrstudio/senri_ffi';

const lib = Library.load('libm.so.6');

const sqrt = lib.func('sqrt', types.float64, [types.float64]);
console.log(sqrt(4.0)); // 2.0

lib.close();

// 关闭后调用 func() 会抛出 FFIError
// lib.func('abs', types.int32, [types.int32]); // → "Library is closed"
```

## 检查是否已关闭

```ts
try {
  lib.func('abs', types.int32, [types.int32]);
} catch (e) {
  if (e instanceof FFIError) {
    console.log('Library is closed');
  }
}
```

---

**相关文档**:
- [closeAsync() — 异步关闭库](/zh/api/closeAsync)
- [Library.load()](/zh/api/library)
- [func() — 同步函数绑定](/zh/api/func)
