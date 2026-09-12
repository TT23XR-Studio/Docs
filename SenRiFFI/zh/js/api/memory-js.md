# 内存管理（JavaScript）

SenRi FFI 提供了一组内存管理函数：`alloc`、`free`、`addressOf`、`errno`、`strerror`。

## 导入

```ts
import { alloc, free, addressOf, errno, strerror } from '@tt23xrstudio/senri_ffi';
```

---

## `alloc(size)` — 分配内存

```ts
function alloc(size: number): Pointer
```

分配指定大小的内存，返回指向该内存的 `Pointer` 实例。

```ts
const mem = alloc(128); // 分配 128 字节
mem.writeInt32(0, 42);
```

**各运行时实现**:

| 运行时 | 实现 |
|--------|------|
| KossJS | `_senri_ffi.alloc(size)` |
| Bun | `new ArrayBuffer(size)` + `Bun.FFI.ptr(buf)` |
| Deno | `new ArrayBuffer(size)` + `Deno.UnsafePointer.of(buf)` |
| Node.js | `Buffer.allocUnsafe(size)` + `koffi.address(buf)` |

**错误**:

| 条件 | 抛出 |
|------|------|
| `size` 不是数字 | `FFIError('alloc requires a positive size')` |
| `size <= 0` | `FFIError('alloc requires a positive size')` |
| 适配器未初始化 | `FFIError('Adapter not initialized')` |

---

## `free(ptr)` — 释放内存

```ts
function free(ptr: Pointer | any): void
```

释放之前分配的内存。接受 `Pointer` 实例或原始的底层数据结构。

```ts
const mem = alloc(128);
// ... 使用 mem ...
free(mem);
```

**各运行时实现**:

| 运行时 | 实现 |
|--------|------|
| KossJS | `_senri_ffi.free(ptr)` |
| Bun | 置空内部 ArrayBuffer (`__buf = null`) |
| Deno | 置空内部 ArrayBuffer (`__buf = null`) |
| Node.js | 置空内部 Buffer (`__buf = null`) |

---

## `addressOf(buffer)` — 获取指针地址

```ts
function addressOf(buffer: ArrayBuffer | ArrayBufferView): Pointer
```

获取 `ArrayBuffer` 或 `ArrayBufferView`（如 `Uint8Array`）的指针地址。

```ts
const buf = new ArrayBuffer(16);
const u8 = new Uint8Array(buf);
u8[0] = 42;

const ptr = addressOf(buf);
console.log(ptr.readUint8(0)); // 42
```

**返回值 — Pointer 对象结构**:

```ts
{
  __ptr: <内存地址>,
  __buf: <原始 ArrayBuffer>,
  __size: <字节长度>
}
```

**各运行时实现**:

| 运行时 | 实现 |
|--------|------|
| KossJS | `_senri_ffi.addressOf(buffer)` |
| Bun | `Bun.FFI.ptr(buffer)` |
| Deno | `Deno.UnsafePointer.of(buffer)` |
| Node.js | `koffi.address(buffer)` |

**错误**: 如果 `buffer` 不是对象类型，抛出 `FFIError('addressOf requires ArrayBuffer or TypedArray')`

---

## `errno()` — 获取系统错误码

```ts
function errno(): number
```

获取最后一次系统调用的错误码（`errno`）。

```ts
const code = errno();
if (code !== 0) {
  console.log('系统错误:', strerror(code));
}
```

**各运行时支持**:

| 运行时 | 支持 | 说明 |
|--------|------|------|
| KossJS | 支持 | 返回实际 errno 值 |
| Bun | 不支持 | 始终返回 0 |
| Deno | 不支持 | 始终返回 0 |
| Node.js | 不支持 | 始终返回 0 |

---

## `strerror(code)` — 获取错误描述

```ts
function strerror(code?: number): string
```

将错误码转换为人类可读的描述字符串。

```ts
console.log(strerror(2));   // KossJS: "No such file or directory"
                            // 其他: "Error code: 2"
```

**各运行时支持**:

| 运行时 | 支持 | 说明 |
|--------|------|------|
| KossJS | 支持 | 返回实际 strerror 结果 |
| Bun | 不支持 | 返回 `"Error code: {code}"` |
| Deno | 不支持 | 返回 `"Error code: {code}"` |
| Node.js | 不支持 | 返回 `"Error code: {code}"` |

---

## 完整示例

```ts
import { alloc, free, addressOf, errno, strerror } from '@tt23xrstudio/senri_ffi';

// 分配和释放
const mem = alloc(256);
mem.writeCString(0, 'Hello from SenRi FFI!');
console.log(mem.readCString(0));
free(mem);

// 从现有缓冲区获取指针
const buf = new ArrayBuffer(8);
const view = new DataView(buf);
view.setInt32(0, 12345, true);

const ptr = addressOf(buf);
console.log(ptr.readInt32(0)); // 12345

// 系统错误检测
const code = errno();
if (code !== 0) {
  console.error(`系统错误 (${code}): ${strerror(code)}`);
}
```
