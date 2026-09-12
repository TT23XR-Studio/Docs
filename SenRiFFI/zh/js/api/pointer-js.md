# Pointer（JavaScript）

`Pointer` 类提供对原始内存的读写操作，支持所有基本 C 类型的读写以及 C 字符串和指针操作。

## 导入

```ts
import { Pointer } from '@tt23xrstudio/senri_ffi';
```

## 创建 Pointer

Pointer 通常不直接使用 `new` 创建，而是通过以下方式获得：

### `alloc(size)` — 分配新内存

```ts
import { alloc } from '@tt23xrstudio/senri_ffi';

const ptr = alloc(64); // 分配 64 字节
```

### `addressOf(buffer)` — 从 ArrayBuffer 获取指针

```ts
import { addressOf } from '@tt23xrstudio/senri_ffi';

const buf = new ArrayBuffer(16);
const ptr = addressOf(buf);
```

### `callback()` — 从回调函数获取指针

```ts
import { callback, types } from '@tt23xrstudio/senri_ffi';

const cb = callback(types.int32, [types.pointer, types.pointer], (a, b) => a - b);
```

### 手动创建

```ts
const ptr = new Pointer(bigintAddress);
const ptr2 = new Pointer(arrayBuffer);
```

---

## 读方法

所有读取方法接受一个可选的 `offset` 参数（默认 0），从该偏移处读取对应类型的值。

| 方法 | 返回类型 | 说明 |
|------|---------|------|
| `readInt8(offset?)` | `number` | 读取 int8 |
| `readUint8(offset?)` | `number` | 读取 uint8 |
| `readInt16(offset?)` | `number` | 读取 int16（小端） |
| `readUint16(offset?)` | `number` | 读取 uint16（小端） |
| `readInt32(offset?)` | `number` | 读取 int32（小端） |
| `readUint32(offset?)` | `number` | 读取 uint32（小端） |
| `readInt64(offset?)` | `bigint` | 读取 int64（小端） |
| `readUint64(offset?)` | `bigint` | 读取 uint64（小端） |
| `readFloat32(offset?)` | `number` | 读取 float32（小端） |
| `readFloat64(offset?)` | `number` | 读取 float64（小端） |
| `readPointer(offset?)` | `Pointer` | 读取指针值（uint64 → new Pointer） |
| `readCString(offset?)` | `string` | 读取以 null 结尾的 UTF-8 字符串 |

## 写方法

| 方法 | 参数 | 说明 |
|------|------|------|
| `writeInt8(offset, value)` | `number` | 写入 int8 |
| `writeUint8(offset, value)` | `number` | 写入 uint8 |
| `writeInt16(offset, value)` | `number` | 写入 int16（小端） |
| `writeUint16(offset, value)` | `number` | 写入 uint16（小端） |
| `writeInt32(offset, value)` | `number` | 写入 int32（小端） |
| `writeUint32(offset, value)` | `number` | 写入 uint32（小端） |
| `writeInt64(offset, value)` | `bigint` | 写入 int64（小端） |
| `writeUint64(offset, value)` | `bigint` | 写入 uint64（小端） |
| `writeFloat32(offset, value)` | `number` | 写入 float32（小端） |
| `writeFloat64(offset, value)` | `number` | 写入 float64（小端） |
| `writePointer(offset, value)` | `Pointer \| bigint` | 写入指针值 |
| `writeCString(offset, str)` | `string` | 写入以 null 结尾的 UTF-8 字符串 |

---

## 指针操作

### `add(offset)` — 指针偏移

```ts
ptr.add(offset: number): Pointer
```

返回一个新的 Pointer，地址偏移 `offset` 字节。

```ts
const head = alloc(64);
const tail = head.add(32); // tail 指向 head 的中间位置
```

### `toBigInt()` — 转为 BigInt

```ts
ptr.toBigInt(): bigint
```

返回指针地址的 BigInt 表示。

### `address` — 获取地址

```ts
ptr.address: bigint
```

只读 getter，返回指针的地址值。**v2 起从 `number` 改为 `bigint`**，以支持 64 位地址和 Deno 的 `UnsafePointer`。

```ts
const ptr = alloc(64);
console.log(ptr.address);   // → 0x1A2B3C4D5n (bigint)
ptr.isNull();               // → false
```

### `numberAddress` — 兼容旧代码 ⚠️

```ts
ptr.numberAddress: number
```

将地址转为 `number`。**已废弃**（deprecated）。当地址超过 `Number.MAX_SAFE_INTEGER` 时抛出 `RangeError`。

```ts
// 旧代码: ptr.address === 0
if (ptr.address === 0n) { ... }    // ✅ 新写法
if (ptr.isNull()) { ... }          // ✅ 更好的写法
if (ptr.numberAddress === 0) { ... } // ⚠️ deprecated
```

### `isNull()` — 检查空指针

```ts
ptr.isNull(): boolean
```

返回 `ptr.address === 0n`。比手动比较更清晰。

```ts
const ptr = alloc(64);
console.log(ptr.isNull()); // false

const nullPtr = new Pointer(0n);
console.log(nullPtr.isNull()); // true
```

---

## 完整示例

```ts
import { alloc } from '@tt23xrstudio/senri_ffi';

// 分配 64 字节
const ptr = alloc(64);

// 写入数据
ptr.writeInt32(0, 42);           // 偏移 0: int32 = 42
ptr.writeFloat64(4, 3.14159);   // 偏移 4: float64 = 3.14159
ptr.writeCString(12, 'hello');  // 偏移 12: "hello\0"

// 读取数据
console.log(ptr.readInt32(0));     // 42
console.log(ptr.readFloat64(4));   // 3.14159
console.log(ptr.readCString(12));  // "hello"

// 指针操作（bigint）
console.log(ptr.address);           // → 0x1A2B3C4D5n (bigint)
console.log(ptr.isNull());         // → false
const offsetPtr = ptr.add(12);
console.log(offsetPtr.readCString(0)); // "hello"

// 指针链
ptr.writePointer(0, offsetPtr.address);
const recovered = ptr.readPointer(0);
console.log(recovered.readCString(0)); // "hello"
```

## 内部结构

Pointer 内部使用 `_data` 对象存储底层引用：

```ts
{
  __ptr: bigint,       // 指针地址（v2: bigint）
  __buf: ArrayBuffer,   // 后备缓冲区（可选）
  __size: number,       // 缓冲区大小
  __u8: Uint8Array,     // Bun 适配器的 Uint8Array 视图（可选）
}
```

读写操作通过 `DataView` 访问后备缓冲区。如果没有后备缓冲区，读写会抛出 `FFIError`（C 字符串读取会安全返回空字符串）。
