# funcAsync — 异步函数绑定（JavaScript）

`lib.funcAsync(name, retType, argTypes)` 绑定一个 C 函数为**异步调用**，返回一个 JavaScript async 函数。每次调用该函数返回 `Promise`。

## 语法

```ts
const asyncFn = lib.funcAsync(symbolName, returnType, [argTypes]);
const result = await asyncFn(...args);
```

### 参数

| 参数           | 类型           | 必须 | 说明         |
| -------------- | -------------- | ---- | ------------ |
| `symbolName` | `string`     | 是   | C 函数名称   |
| `returnType` | 类型描述符     | 是   | 返回值类型   |
| `argTypes`   | 类型描述符数组 | 是   | 参数类型列表 |

### 返回值

返回一个 **async 函数** `asyncFn(...args) → Promise<any>`。

## 异步实现因语言/运行时而异

| 语言/运行时            | 实现方式                                       | 特性                                                                           |
| ----------------- | ---------------------------------------------- | ------------------------------------------------------------------------------ |
| **KossJS**  | 真实系统线程 (`std::thread`) + libffi        | 支持回调（channel proxy）、`AbortController`、`maxConcurrency`、Force Kill |
| **Deno**    | 原生非阻塞 (`nonblocking: true`)             | 零额外开销，最优化路径                                                         |
| **Node.js** | 单 Worker (`worker_threads`)                 | FIFO 串行执行，无需 C 函数线程安全                                             |
| **Bun**     | 单 Worker (Bun 的 `worker_threads` polyfill) | 同 Node.js                                                                     |

## 混合执行策略（Node.js / Bun）

调用 `funcAsync` 时自动检测参数中是否包含 `callback` 类型：

- **无 callback** → 单 Worker 异步执行，不阻塞主线程。首次使用输出警告：

```
[SenRi FFI] Async FFI on Node.js is emulated using a worker thread.
The underlying C function MUST be thread-safe. For true async FFI,
consider using Deno. To suppress: set SENRI_FFI_QUIET=1
```

- **有 callback** → 主线程同步执行（包裹为 Promise），并输出一次性警告：

```
[SenRi FFI] funcAsync("xxx") has callback parameters — executing synchronously
on main thread. For non-blocking async, avoid callback parameters or use Deno.
To suppress: set SENRI_FFI_QUIET=1
```

> [!NOTE]
> KossJS 和 Deno 无上述限制——它们原生支持回调的异步调用。

## 使用示例

### 基础异步调用

```ts
import { Library, types } from '@tt23xrstudio/senri_ffi';

const lib = Library.load(
  process.platform === 'win32' ? 'msvcrt.dll' : 'libc.so.6'
);

// 绑定异步函数
const sleep = lib.funcAsync('sleep', types.uint32, [types.uint32]);

// 调用 — 不阻塞主线程
console.log('Sleep started...');
await sleep(3);
console.log('Sleep done');
```

### 并行异步调用

```ts
const heavy = lib.funcAsync('heavy_work', types.int32, [types.int32]);
const results = await Promise.all([
  heavy(10),
  heavy(20),
  heavy(30),
]);
console.log(results); // [result1, result2, result3]
```

### 带错误处理

```ts
const readFile = lib.funcAsync('read_file', types.int32, [types.cstring]);

try {
  const fd = await readFile('/etc/passwd');
  console.log('File descriptor:', fd);
} catch (e) {
  if (e instanceof FFIError) {
    console.error('FFI call failed:', e.message);
  }
}
```

## KossJS 特有选项

在 KossJS 上，`funcAsync` 支持额外的绑定选项：

```ts
const fn = lib.funcAsync('heavy_work', types.int32, [types.int32], {
  callbackTimeout: 10000,    // 回调超时（毫秒），默认 30000
  allowForceKill: false,     // 是否允许 AbortController 强制杀线程
  maxConcurrency: 8,         // 全局最大并发数，默认 64
});
```

KossJS 的异步还支持调用级 `AbortController`：

```ts
const ctrl = new AbortController();
const promise = fn(100, { signal: ctrl.signal });
setTimeout(() => ctrl.abort(), 1000);
```

> [!WARNING]
> Node.js / Bun 模拟异步**不支持 callback 参数**作为非阻塞调用。如果函数签名包含回调，会自动回退到主线程同步执行。

## 限制

| 限制                            | 影响范围                                      |
| ------------------------------- | --------------------------------------------- |
| callback 参数不支持 Worker 执行 | Node.js / Bun（自动降级为主线程同步）         |
| C 函数必须线程安全              | Node.js / Bun Worker 模式（串行执行降低风险） |
| struct 参数需 `toPointer()`   | 所有语言/运行时（结构体实例转为内存指针传递）      |
| 不支持 `timeoutMs` 参数       | JS 侧无法安全中断 C 函数执行                  |

---

**相关文档**:

- [func() — 同步函数绑定](/zh/api/func)
- [closeAsync() — 异步关闭库](/zh/api/closeAsync)
- [Library.load()](/zh/api/library)
