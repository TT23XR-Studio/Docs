# `_senri_ffi` 内部 FFI API 文档

> [!WARNING]
> `_senri_ffi` 在 `stable=True`（默认）时被禁用。如需在生产环境中使用 FFI 功能，请查看 [stable 模式替代方案](/zh/reference/stable-alternatives)。

`_senri_ffi` 是 KossJS 内置的 **C 外部函数接口（Foreign Function Interface）**，挂载在 `globalThis._senri_ffi` 上。
通过它，JS 代码可以直接调用任意原生动态库（`.dll` / `.so` / `.dylib`）中的 C ABI 函数，不需要任何 C 编译步骤或原生插件。

---

## 功能概述

| 能力 | 同步 | 异步 |
|------|------|------|
| 动态库加载/关闭 | `open(path)` / `lib.close()` | `lib.closeAsync()` |
| C 函数绑定 | `lib.func(name, ret, args)` | `lib.funcAsync(name, ret, args, opts)` |
| 回调函数 | `createCallback(ret, args, fn)` | `funcAsync` 内置支持 |
| 内存管理 | `alloc(size)` / `free(ptr)` | — |
| 数组地址 | `addressOf(buf)` | — |
| 指针操作 | `ptr.readIntXX(offset)` / `ptr.writeIntXX(offset, val)` | — |
| 结构体 | `struct(fields, opts)` | — |

---

## API 导航

| 文档 | 描述 |
|------|------|
| [类型系统](./types.md) | `_senri_ffi.types` — 14 种 FFI 类型详解 |
| [动态库管理](./library.md) | `open`、`close`、`closeAsync` |
| [同步函数绑定](./func.md) | `lib.func()` — 同步调用 C 函数 |
| [异步函数绑定](./funcAsync.md) | `lib.funcAsync()` — 异步调用 C 函数（含回调、超时、强制终止） |
| [回调函数](./callback.md) | `createCallback()` — 将 JS 函数转为 C 函数指针 |
| [内存管理](./memory.md) | `alloc`、`free`、`addressOf`、`errno`、`strerror` |
| [指针操作](./pointer.md) | Pointer 对象的读写方法、偏移、转换 |
| [结构体](./struct.md) | `struct()` 构造、字段访问、内存布局 |
| [数组类型](./array.md) | `array(innerType, count)` 类型定义 |
| [完整示例](./examples.md) | 覆盖主要 API 的综合示例 |

---

## 快速上手

```javascript
const ffi = globalThis._senri_ffi;

// 1. 加载 C 标准库
const libc = ffi.open(
  process.platform === 'win32' ? 'msvcrt.dll' : 'libc.so.6'
);

// 2. 绑定同步函数 — 计算平方根
const sqrt = libc.func('sqrt', ffi.types.float64, [ffi.types.float64]);
console.log(sqrt(16.0)); // 4.0

// 3. 绑定异步函数 — 不阻塞主线程
const sleep = libc.funcAsync('sleep', ffi.types.uint32, [ffi.types.uint32]);
await sleep(2); // 阻塞 2 秒（在后台线程）

// 4. 内存操作
const buf = ffi.alloc(64);
buf.writeInt32(0, 42);
console.log(buf.readInt32(0)); // 42
ffi.free(buf);

// 5. 结构体
const Point = ffi.struct([
  { name: 'x', type: ffi.types.float64 },
  { name: 'y', type: ffi.types.float64 },
]);
const p = new Point({ x: 1.0, y: 2.0 });
console.log(p.x, p.y, p.sizeof); // 1.0 2.0 16

// 6. 关闭
await libc.closeAsync();
```

---

## 线程安全

- **同步 API**：在 KossJS 主线程中执行，直接调用 C 函数。C 函数执行期间**阻塞主线程**。
- **异步 API**：C 函数在**独立系统线程**中执行，不阻塞 KossJS 主线程。**被调用的 C 函数必须是线程安全的**。KossJS 不提供任何同步锁机制。
- **回调**（异步模式）：回调通过通道代理到主线程执行 JS 函数，在 `process_io_results` 中处理。

---

## 跨平台支持

| 平台 | 状态 |
|------|------|
| Windows (x86_64) | 完全支持 |
| Linux (x86_64) | 完全支持 |
| macOS (x86_64/arm64) | 完全支持 |
| Android | 不支持（系统限制动态调用） |
| iOS | 不支持（系统限制动态调用） |
| HarmonyOS | 不支持（系统限制） |
