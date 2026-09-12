# 异步函数绑定 (`lib.funcAsync()`)

`lib.funcAsync(name, retType, argTypes, [opts])` 返回一个 **async 函数**，每次调用该函数返回一个 `Promise`。C 函数在**独立系统线程**中执行，**不阻塞 KossJS 主线程**。

---

## 语法

```javascript
lib.funcAsync(symbolName, returnType, [argTypes])
lib.funcAsync(symbolName, returnType, [argTypes], options)
```

### 参数

| 参数 | 类型 | 必须 | 说明 |
|------|------|------|------|
| `symbolName` | `string` | 是 | C 符号名称 |
| `returnType` | `string\|Object` | 是 | 返回值类型 |
| `argTypes` | `Array` | 是 | 参数类型数组 |
| `options` | `Object` | 否 | 绑定级选项（全局生效） |

### 返回值

返回一个 **异步 JavaScript 函数** `asyncFn(...args)`。

每次调用 `asyncFn(...args)` 时：

1. 在**主线程**中将 JS 参数序列化为字节缓冲区
2. 创建 `Promise`（`JsPromise::new_pending`）
3. 启动**独立系统线程** (`std::thread::spawn`)
4. 在后台线程中：通过 libffi 调用 C 函数
5. 结果通过 `mpsc` 通道传回主线程
6. 主线程的 `tick()` 循环中解析 Promise

---

## 选项 (`options`)

### 绑定级选项

在调用 `funcAsync()` 时指定，影响所有调用：

```javascript
const fn = lib.funcAsync('heavy_work', ffi.types.int32, [ffi.types.int32], {
  // 回调超时（毫秒），默认 30000 (30秒)
  callbackTimeout: 10000,

  // 是否允许强制杀线程（AbortController → kill thread）
  allowForceKill: false,  // 默认 false

  // 最大并发异步任务数（全局，首次设置生效）
  maxConcurrency: 8,
});
```

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `callbackTimeout` | `number` | `30000` | 回调等待超时（毫秒） |
| `allowForceKill` | `boolean` | `false` | 允许 AbortController 强制杀线程 |
| `maxConcurrency` | `number` | `64` | 全局最大并发数 |

### 调用级选项

在调用返回的 async 函数时指定：

```javascript
await fn(arg1, arg2, { signal: abortController.signal, forceKill: true });
```

---

## 与同步 `func()` 的关键区别

| 特性 | 同步 `func()` | 异步 `funcAsync()` |
|------|-------------|-------------------|
| 阻塞主线程 | 是 | 否 |
| 返回值 | 直接 JS 值 | `Promise<JS值>` |
| 执行线程 | KossJS 主线程 | 独立系统线程 |
| C 函数线程安全要求 | 无（单线程） | **必须线程安全** |
| 回调支持 | 直接调用 JS（libffi Closure） | 通道代理（主线程执行 JS） |
| 回调超时 | 无（直接同步） | 可配置（默认 30 秒） |
| 任务取消 | 不支持 | 支持（AbortController） |
| 强制杀线程 | 不支持 | 可选（`allowForceKill`） |
| 性能开销 | 极低 | 有线程/序列化开销 |
| 适用场景 | 快速操作、计算 | I/O 阻塞、长时间操作 |

---

## 基础用法

### 简单异步调用

```javascript
const ffi = _senri_ffi;
const libc = ffi.open('libc.so.6');

const sleep = libc.funcAsync('sleep', ffi.types.uint32, [ffi.types.uint32]);

// 调用 — 不阻塞主线程
const promise = sleep(3);

// 可以继续做其他事情（同步代码或 Promise）
console.log('Sleep started, continuing...');

// await 等待完成
await promise;
console.log('Sleep done');

await libc.closeAsync();
```

### 携带回调的异步调用

```javascript
const { int32, pointer, uint64, void: VOID } = ffi.types;

// int qsort(void *base, size_t nmemb, size_t size,
//           int (*compar)(const void *, const void *))
const CompareFunc = ffi.callback(int32, [pointer, pointer]);
const qsort = libc.funcAsync('qsort', VOID, [
  pointer, uint64, uint64, CompareFunc
]);

// 准备数据
const buf = ffi.alloc(40); // 10 个 int32
for (let i = 0; i < 10; i++) {
  buf.writeInt32(i * 4, 10 - i - 1); // 降序
}

// 异步调用 — 回调在后台线程触发，在主线程执行 JS
await qsort(buf, 10, 4, (aPtr, bPtr) => {
  const a = ptr_readInt32(aPtr);
  const b = ptr_readInt32(bPtr);
  return a - b; // 升序
});

// 验证
for (let i = 0; i < 10; i++) {
  console.log(buf.readInt32(i * 4)); // 1, 2, 3, ..., 10
}

ffi.free(buf);
```

**回调代理流程**：

```
C 线程调用 compar(a, b)
  │
  ├─ callback trampoline:
  │    ├─ 序列化参数 a, b → (task_id, cb_index, [bytes])
  │    ├─ callback_tx.send(CallbackRequest) ────→ 主线程
  │    ├─ resp_rx.recv_timeout(30s) ← 阻塞等待
  │    └─ 反序列化返回值 → return 给 C
  │
  ▼ 主线程 (process_io_results)
  ├─ callback_rx.try_recv()
  ├─ js_func.call(args, ctx)
  └─ resp_tx.send(result) → 解除阻塞线程
```

---

## 任务取消

### Soft Cancel（软取消）

**默认行为**：`AbortController` 只拒绝 Promise，C 函数继续在后台运行。

```javascript
const ctrl = new AbortController();

const work = libc.funcAsync('long_work', ffi.types.int32, [ffi.types.int32]);
const promise = work(100, { signal: ctrl.signal });

// 1 秒后取消
setTimeout(() => ctrl.abort(), 1000);

try {
  await promise;
} catch (e) {
  console.log(e.name); // 'AbortError'
  // C 函数仍在后台运行直到结束
}
```

### Force Kill（强制杀线程）

**需 opt-in**：在 `funcAsync()` 绑定或调用时指定 `allowForceKill: true`。

```javascript
const eternal = libc.funcAsync('infinite_loop', ffi.types.void, [], {
  allowForceKill: true,   // ← 必须
  callbackTimeout: 5000,
});

const ctrl = new AbortController();
const promise = eternal({ signal: ctrl.signal });

setTimeout(() => {
  ctrl.abort(); // 操作系统级杀线程
}, 3000);

try {
  await promise;
} catch (e) {
  console.log(e.name); // 'AbortError'
  // 线程已被杀，库标记为 tainted
}

// 此时 libc 被标记为 tainted
// 该库上任何后续 func() 或 funcAsync() 调用都会抛错
```

**Force Kill 的后果**：

| 后果 | 说明 |
|------|------|
| 库标记为 `tainted` | 该库所有后续调用立即失败 |
| 线程内分配的内存泄漏 | kill 线程无法执行清理代码 |
| 文件句柄可能泄漏 | 线程持有的 fd 不会关闭 |
| `closeAsync()` 不等待该线程 | 立即释放库句柄 |

> **强烈建议**：只在确认 C 函数可能永不返回（如死循环）的危险场景下启用 Force Kill。
> 常规使用请使用 Soft Cancel。

---

## 并发控制

全局最大并发数限制（默认 64），防止线程爆炸：

```javascript
// 首次调用 set 全局上限
const fn = libc.funcAsync('work', ffi.types.void, [ffi.types.int32], {
  maxConcurrency: 4,
});

// 同时启动 10 个任务，只有 4 个会并发执行
for (let i = 0; i < 10; i++) {
  fn(i).then(() => console.log(`Task ${i} done`));
}
// Task 0 done, Task 1 done, ..., Task 9 done （逐批完成）
```

---

## 错误处理

| 错误类型 | 时机 | 处理方式 |
|----------|------|---------|
| 库已关闭 | 调用 funcAsync | 抛出同步错误 |
| 库被污染 (tainted) | 调用 funcAsync | 抛出同步错误 |
| 符号未找到 | 调用 funcAsync | 抛出同步错误 |
| 无效符号名 | 调用 funcAsync | 抛出同步错误 |
| AbortError (soft) | 等待 Promise 时 | Promise reject |
| 线程创建失败 | 调用 async 函数 | Promise reject |
| C 函数崩溃 | 后台线程执行期间 | **进程崩溃**（不可恢复） |
| 回调超时 | 后台线程等待回调时 | 回调返回零值，C 函数继续 |
| 无事件循环 | 调用 async 函数 | Promise reject |

---

## 生命周期

### 正常流程

```
open() → funcAsync() → asyncFn(arg) → Promise pending
  → (后台线程执行) → Promise resolved → closeAsync() → 库释放
```

### Soft Cancel 流程

```
open() → funcAsync() → asyncFn(arg) → Promise pending
  → abort() → Promise rejected
  → (后台线程继续运行至结束) → 结果丢弃
  → closeAsync() → 库释放（不等待已 abort 的任务）
```

### Force Kill 流程

```
open() → funcAsync({allowForceKill: true}) → asyncFn(arg) → Promise pending
  → abort() → 操作系统杀线程 → Promise rejected
  → 库标记为 tainted
  → closeAsync() → 立即释放库
```

---

## 完整示例

```javascript
const ffi = _senri_ffi;
const { int32, float64, pointer, cstring, uint64 } = ffi.types;

const libc = ffi.open('libc.so.6');

// === 异步文件读取 (POSIX) ===
const openAsync = libc.funcAsync('open', int32, [cstring, int32]);
const readAsync = libc.funcAsync('read', int64, [int32, pointer, uint64]);
const closeAsync = libc.funcAsync('close', int32, [int32]);

const O_RDONLY = 0;
const fd = await openAsync('/etc/hostname', O_RDONLY);

const buf = ffi.alloc(256);
const bytesRead = await readAsync(fd, buf, 256);
console.log(`Read ${bytesRead} bytes`);
console.log(buf.readCString(0));

ffi.free(buf);
await closeAsync(fd);

// === 带超时的异步 DNS 查询 ===
const gethostbynameAsync = libc.funcAsync(
  'gethostbyname',
  pointer,
  [cstring],
  { callbackTimeout: 5000 }
);

try {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), 3000);
  const hostent = await gethostbynameAsync('example.com', {
    signal: ctrl.signal,
  });
  // (需要手动解析 hostent 结构体)
} catch (e) {
  console.error('DNS lookup failed or timed out:', e.message);
}

// === 并行异步任务 ===
const task1 = readAsync(fd, buf, 128);
const task2 = readAsync(fd, buf, 64);
const task3 = readAsync(fd, buf, 32);
await Promise.all([task1, task2, task3]);

// 清理
await libc.closeAsync();
```
