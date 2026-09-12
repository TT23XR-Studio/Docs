# 类型系统（JavaScript）

SenRi FFI 提供了一套统一的 C 类型系统，在所有支持的运行时上使用相同的类型名称。

## 导入

```ts
import { types, pointer, array } from '@tt23xrstudio/senri_ffi';
```

## 类型常量概览

| 类型 | C 等价 | 大小 | JS 对应类型 |
|------|--------|------|------------|
| `types.void` | `void` | 0 | `undefined` |
| `types.int8` | `int8_t` | 1 | `number` |
| `types.uint8` | `uint8_t` | 1 | `number` |
| `types.int16` | `int16_t` | 2 | `number` |
| `types.uint16` | `uint16_t` | 2 | `number` |
| `types.int32` | `int32_t` | 4 | `number` |
| `types.uint32` | `uint32_t` | 4 | `number` |
| `types.int64` | `int64_t` | 8 | `bigint` |
| `types.uint64` | `uint64_t` | 8 | `bigint` |
| `types.float32` | `float` | 4 | `number` |
| `types.float64` | `double` | 8 | `number` |
| `types.pointer` | `void*` | 8 | `bigint` |
| `types.cstring` | `char*` | 8 | `string` |

## 类型构造器

### `pointer(type?)` — 指针类型

```ts
import { pointer, types } from '@tt23xrstudio/senri_ffi';

const Int32Ptr = pointer(types.int32);     // int32_t*
const VoidPtr = pointer();                  // void*
```

### `array(type, length)` — 数组类型

```ts
import { array, types } from '@tt23xrstudio/senri_ffi';

const Buffer256 = array(types.uint8, 256);  // uint8_t[256]
const IntArr10 = array(types.int32, 10);    // int32_t[10]
```

## 类型标准化流程

```
用户类型描述符
    ↓
normalizeType()  ─→  NormalizedType
    ├─ 原始类型 ('int32') → adapter.mapType() → 运行时类型
    ├─ pointer 描述符    → adapter.createPointerType()
    ├─ array 描述符      → adapter.createArrayType()
    └─ struct 描述符     → adapter.createStructType()
    ↓
运行时原生类型
    ↓
WeakMap 缓存（避免重复转换）
```

## 各运行时类型映射

| 统一类型 | KossJS | Bun | Deno | Node.js (koffi v3) |
|---------|--------|-----|------|---------------------|
| `void` | `'void'` | `'void'` | `'void'` | `'void'` |
| `int8` | `'int8'` | `'i8'` | `'i8'` | `'int8'` |
| `uint8` | `'uint8'` | `'u8'` | `'u8'` | `'uint8'` |
| `int16` | `'int16'` | `'i16'` | `'i16'` | `'int16'` |
| `uint16` | `'uint16'` | `'u16'` | `'u16'` | `'uint16'` |
| `int32` | `'int32'` | `'i32'` | `'i32'` | `'int32'` |
| `uint32` | `'uint32'` | `'u32'` | `'u32'` | `'uint32'` |
| `int64` | `'int64'` | `'i64'` | `'i64'` | `'int64'` |
| `uint64` | `'uint64'` | `'u64'` | `'u64'` | `'uint64'` |
| `float32` | `'float32'` | `'f32'` | `'f32'` | `'float32'` |
| `float64` | `'float64'` | `'f64'` | `'f64'` | `'float64'` |
| `pointer` | `'pointer'` | `'ptr'` | `'pointer'` | `'void *'` |
| `cstring` | `'cstring'` | `'cstring'` | `'buffer'` | `'string'` |
