# 动态库管理 (`open` / `close` / `closeAsync`)

`_senri_ffi` 的库管理 API 负责加载、使用和卸载原生动态库。

---

## `_senri_ffi.open(path)` → `LibraryHandle`

**同步加载**一个原生动态库。

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `path` | `string` | 动态库的绝对路径或文件名（依赖系统搜索路径） |

### 返回值

| 类型 | 说明 |
|------|------|
| `LibraryHandle` | 库句柄对象，包含 `func()`、`close()` 等方法 |

### 平台路径格式

| 平台 | 路径示例 |
|------|---------|
| Windows | `"C:\\Windows\\System32\\kernel32.dll"` 或 `"msvcrt.dll"` |
| Linux | `"/usr/lib/x86_64-linux-gnu/libc.so.6"` 或 `"libc.so.6"` |
| macOS | `"/usr/lib/libSystem.B.dylib"` |

### 错误

如果文件不存在或格式无效，抛出错误：
```
Error: failed to open library '/path/to/bad.so': library not found
```

---

## LibraryHandle 对象

`open()` 返回的 JS 对象提供以下成员：

| 属性/方法 | 说明 |
|-----------|------|
| `.path` | （只读）库的加载路径 |
| `.func(name, retType, [argTypes])` | [同步绑定 C 函数](./func.md) |
| `.funcAsync(name, retType, [argTypes], [opts])` | [异步绑定 C 函数](./funcAsync.md) |
| `.close()` | **同步**关闭库（不等待异步任务） |
| `.closeAsync()` | **异步**关闭库（等待所有异步任务完成） |

### 内部状态

每个 LibraryHandle 维护以下内部状态（用户不可直接访问）：

| 状态 | 说明 |
|------|------|
| `closed` | 库是否已关闭 |
| `tainted` | 库是否被污染（发生过强制杀线程） |
| `active_async_tasks` | 当前进行中的异步任务计数 |

---

## `lib.close()` → `undefined`

**同步关闭**库。

- 立即释放库句柄（调用 `dlclose` / `FreeLibrary`）
- **不等待**异步任务完成 — 如果存在进行中的异步任务，调用此方法后这些任务仍会继续，但可能访问已释放的内存（未定义行为）
- 建议：**如果需要等待异步任务，请使用 `closeAsync()`**

```javascript
const lib = ffi.open('libm.so');
const sqrt = lib.func('sqrt', ffi.types.float64, [ffi.types.float64]);
console.log(sqrt(4.0)); // 2.0
lib.close();
// 之后不能再调用 sqrt() — 会抛出 "library is closed"
```

---

## `await lib.closeAsync()` → `Promise<void>`

**异步关闭**库。

1. 标记库为"已关闭"，阻止新的函数绑定和调用
2. 轮询等待所有进行中的异步任务完成（每 50ms 检查一次）
3. 所有任务完成后，释放库句柄
4. resolve Promise

```javascript
const lib = ffi.open('libm.so');

// 启动多个异步调用
const sleep = lib.funcAsync('sleep', ffi.types.uint32, [ffi.types.uint32]);
Promise.all([sleep(1), sleep(2), sleep(3)]);

// 等待所有任务完成后关闭
await lib.closeAsync(); // ← 会自动等待 3 秒（最长的 sleep 完成）
console.log('Library fully closed, all tasks done');
```

### 行为细节

- 被 abort（`soft cancel`）的异步任务**不会被等待** — 这些任务可能在后台运行但不计入等待
- 被强制 kill（`allowForceKill`）的线程**不会被等待** — 线程已被杀，库被标记为 `tainted`
- 如果库已被标记为 `tainted`，`closeAsync()` 立即 resolve，不等待

---

## 使用示例

### 基本用法

```javascript
const ffi = _senri_ffi;

// 加载系统库
const libc = ffi.open(
  process.platform === 'win32' ? 'msvcrt.dll' : 'libc.so.6'
);

// 绑定函数
const puts = libc.func('puts', ffi.types.int32, [ffi.types.cstring]);
puts('Hello from C!'); // 在 stdout 输出

// 同步关闭
libc.close();
```

### 同时加载多个库

```javascript
const libm = ffi.open('/usr/lib/libm.so.6');
const libpthread = ffi.open('/usr/lib/libpthread.so.0');

const sqrt = libm.func('sqrt', ffi.types.float64, [ffi.types.float64]);
const pthreadCreateAsync = libpthread.funcAsync(
  'pthread_create',
  ffi.types.int32,
  [ffi.types.pointer, ffi.types.pointer, ffi.types.pointer, ffi.types.pointer]
);

console.log(sqrt(9.0)); // 3.0

await libm.closeAsync();
await libpthread.closeAsync();
```

### 错误处理

```javascript
try {
  const lib = ffi.open('/path/to/nonexistent.so');
} catch (e) {
  console.error('Failed to open library:', e.message);
}

const lib = ffi.open('libc.so.6');
const fn = lib.func('sqrt', ffi.types.float64, [ffi.types.float64]);
lib.close();

try {
  fn(4.0); // 错误：库已关闭（如果是同步调用）
} catch (e) {
  console.error(e.message); // "library is closed"
}
```

### Tainted 状态（强制杀线程后）

```javascript
const lib = ffi.open('libheavy.so');

// 绑定可能永远不返回的函数，启用强制杀线程
const stuck = lib.funcAsync('infinite_loop', ffi.types.void, [], {
  allowForceKill: true,
  callbackTimeout: 5000,
});

// 调用并等待 2 秒后 kill
const ctrl = new AbortController();
const promise = stuck({ signal: ctrl.signal });
setTimeout(() => ctrl.abort(), 2000); // force kill

try {
  await promise;
} catch (e) {
  // AbortError — 但线程已被杀
}

// 此时 lib 被标记为 tainted
try {
  lib.func('some_other_fn', ffi.types.void, []);
} catch (e) {
  console.error(e.message); // "library is tainted"
}

// 关闭被污染的库不需要等待
await lib.closeAsync();
```

---

## 调用约定 (Calling Convention)

同步和异步均支持通过 `options` 指定调用约定：

```javascript
const fn = lib.func('some_stdcall_fn', ffi.types.int32, [ffi.types.int32], {
  callingConvention: 'stdcall', // 'cdecl' | 'stdcall' | 'fastcall' | 'thiscall'
});
```

| 约定 | 说明 |
|------|------|
| `cdecl` | C 声明（默认），调用者清理栈 |
| `stdcall` | Windows 标准，被调用者清理栈 |
| `fastcall` | 快速调用，部分参数通过寄存器传递 |
| `thiscall` | C++ 成员函数，`this` 指针通过 ECX 传递 |

> 注意：`funcAsync` 目前仅支持 `cdecl`。非默认调用约定的支持将在后续版本中加入。
