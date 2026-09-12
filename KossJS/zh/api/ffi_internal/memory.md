# 内存管理 (`alloc` / `free` / `addressOf`)

`_senri_ffi` 提供手动内存管理 API，用于分配和释放原生内存缓冲区，供 C 函数使用。

---

## `_senri_ffi.alloc(size)` → `Pointer`

分配原生内存块。

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `size` | `number` | 分配的字节数（对齐到 16 字节） |

### 返回值

返回一个 **Pointer 对象**，提供内存地址和大小信息，以及便利的读写方法。

### 行为

- 分配的内存初始内容为**未定义**（可能包含旧数据）
- `size = 0` 返回一个空指针（address = 0, size = 0）
- 使用 Rust 全局分配器（`std::alloc`）
- 对齐到 16 字节

```javascript
const ptr = ffi.alloc(256);
console.log(ptr.address); // 如: 140728912345678
console.log(ptr.size);    // 256
```

---

## `_senri_ffi.free(ptr)` → `undefined`

释放由 `alloc()` 分配的内存块。

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `ptr` | `Pointer` | 由 `alloc()` 返回的 Pointer 对象 |

### 行为

- 调用 Rust 全局释放器（`std::alloc::dealloc`）
- 释放后 `ptr` 不应再被使用（访问会触发未定义行为）
- 传 `null` 指针或 size=0 是安全的（无操作）

```javascript
const buf = ffi.alloc(1024);
// ... 使用 buf ...
ffi.free(buf);
// buf 不应再被访问
```

---

## `_senri_ffi.allocType(type, [count])` → `Pointer`

按类型大小分配内存。

### 参数

| 参数 | 类型 | 必须 | 说明 |
|------|------|------|------|
| `type` | `string\|Object` | 是 | FFI 类型（如 `'int32'`） |
| `count` | `number` | 否 | 元素数量（默认 `1`） |

### 返回值

返回一个 Pointer 对象，大小为 `sizeof(type) * count`。

```javascript
const int32Arr = ffi.allocType(ffi.types.int32, 10);  // 分配 40 字节
const floatArr = ffi.allocType(ffi.types.float64, 5); // 分配 40 字节

// 等价于
const buf1 = ffi.alloc(4 * 10);  // 40 字节
const buf2 = ffi.alloc(8 * 5);   // 40 字节
```

### 复合类型

```javascript
const Point = ffi.struct([
  { name: 'x', type: ffi.types.float64 },
  { name: 'y', type: ffi.types.float64 },
]);

const points = ffi.allocType(Point, 100); // 分配 1600 字节 (16 * 100)
```

---

## `_senri_ffi.addressOf(arrayBuffer)` → `Pointer`

获取 `ArrayBuffer` 或 `TypedArray` 的原生内存地址。

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `arrayBuffer` | `ArrayBuffer` \| `TypedArray` | JS 数组缓冲区 |

### 返回值

返回一个 Pointer 对象，其地址指向传入的 ArrayBuffer 的数据区域。

### 用途

允许将 JS 的 `ArrayBuffer` 直接传递给需要原生指针的 C 函数，避免数据拷贝。

```javascript
const buf = new ArrayBuffer(64);
const view = new Uint8Array(buf);
view.fill(42);

const ptr = ffi.addressOf(buf);
console.log(ptr.address);  // ArrayBuffer 数据的原生地址
console.log(ptr.size);     // 64

// 直接传给 memset
const libc = ffi.open('libc.so.6');
const memset = libc.func('memset', ffi.types.pointer, [
  ffi.types.pointer, ffi.types.int32, ffi.types.uint64
]);
memset(ptr, 0, 64); // 将 ArrayBuffer 清零
// buf 现在全为 0
```

> **注意**：`addressOf` 返回的指针**不能**用 `free()` 释放（它指向 GC 管理的内存，不是堆分配的）。仅用于传递给 C 函数。

---

## `_senri_ffi.errno()` → `number`

返回当前线程的错误码。**当前为桩实现，始终返回 `0`**。

```javascript
console.log(ffi.errno()); // 0
```

---

## `_senri_ffi.strerror(errno)` → `string`

将错误码转为描述字符串。

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `errno` | `number` | POSIX 错误码 |

### 返回值

- `0` → `"Success"`
- 非零 → `"Error code: {errno}"`（桩实现）

```javascript
console.log(ffi.strerror(0));   // "Success"
console.log(ffi.strerror(2));   // "Error code: 2"
```

> 未来版本将支持通过 `libc.so.6` 的 `strerror()` 获取真实错误描述。

---

## 内存管理最佳实践

### 配对分配/释放

```javascript
// ✅ 正确
const buf = ffi.alloc(256);
doSomething(buf);
ffi.free(buf);

// — 或使用 try/finally —
const buf = ffi.alloc(256);
try {
  doSomething(buf);
} finally {
  ffi.free(buf);
}
```

### 不要双重释放

```javascript
const buf = ffi.alloc(256);
ffi.free(buf);
ffi.free(buf); // ❌ 未定义行为（double-free）
```

### 不要对 addressOf 结果调用 free

```javascript
const ab = new ArrayBuffer(64);
const ptr = ffi.addressOf(ab);
ffi.free(ptr); // ❌ 尝试释放 GC 管理的内存
```

### 异步模式下的指针生命周期

异步调用时指针数据**不会被拷贝**，只复制地址值（8 字节）。用户需确保指针指向的数据在异步调用期间保持有效：

```javascript
const readAsync = libc.funcAsync('read', ffi.types.int64, [
  ffi.types.int32, ffi.types.pointer, ffi.types.uint64
]);

// ❌ 危险 — buf 可能在异步调用完成前被释放
{
  const buf = ffi.alloc(1024);
  const promise = readAsync(fd, buf, 1024);
  ffi.free(buf); // 释放了异步读取的目标缓冲区！
  await promise; // 读取到已释放的内存 ← 未定义行为
}

// ✅ 正确 — 在 Promise 完成后释放
{
  const buf = ffi.alloc(1024);
  try {
    await readAsync(fd, buf, 1024);
  } finally {
    ffi.free(buf);
  }
}
```

---

## 完整示例

```javascript
const ffi = _senri_ffi;

// 基础分配
const buf = ffi.alloc(128);
console.log(`Allocated ${buf.size} bytes at address ${buf.address}`);

// 写入数据
buf.writeInt32(0, 0xDEADBEEF);
buf.writeFloat64(4, 3.14159265358979);
buf.writeCString(12, 'Hello, Memory!');

// 读取数据
console.log('0x' + buf.readInt32(0).toString(16)); // 0xdeadbeef
console.log(buf.readFloat64(4));                   // 3.14159265358979
console.log(buf.readCString(12));                  // "Hello, Memory!"

ffi.free(buf);

// ArrayBuffer → Pointer（零拷贝）
const jsBuf = new ArrayBuffer(32);
const jsView = new Int32Array(jsBuf);
jsView[0] = 100;
jsView[1] = 200;

const ptr = ffi.addressOf(jsBuf);

const libc = ffi.open('libc.so.6');
const memcpy = libc.func('memcpy', ffi.types.pointer, [
  ffi.types.pointer, ffi.types.pointer, ffi.types.uint64
]);

// 从 ArrayBuffer 拷贝到堆分配的内存
const heapBuf = ffi.alloc(32);
memcpy(heapBuf, ptr, 32);

// heapBuf 现在有 ArrayBuffer 的数据副本
console.log(heapBuf.readInt32(0)); // 100
console.log(heapBuf.readInt32(4)); // 200

ffi.free(heapBuf);
libc.close();
```
