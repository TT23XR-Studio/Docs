# API 概览（JavaScript）

SenRi FFI JavaScript/TypeScript 版导出的公共 API 一览。

## 模块导出

```ts
import {
  // 核心
  Library,
  types,

  // 类型构造器
  pointer,
  array,
  struct,

  // 指针操作
  Pointer,
  callback,

  // 内存管理
  alloc,
  free,
  addressOf,
  errno,
  strerror,

  // 自定义后端
  isLibraryLike,
  getMissingMethods,
  createBackendWithFallback,

  // 错误
  FFIError,
  FFITypeError,
  FFIBackendError,
} from '@tt23xrstudio/senri_ffi';
```

## API 分类

### Library — 库加载与函数绑定

| 导出 | 说明 | 文档 |
|------|------|------|
| `Library.load(path)` | 加载原生共享库 (.dll/.so/.dylib) | [Library.load()](/zh/js/api/library-js) |
| `lib.func(name, retType, argTypes, options?)` | 绑定 C 函数 — 同步调用（带缓存） | [func()](/zh/js/api/func-js) |
| `lib.funcAsync(name, retType, argTypes)` | 绑定 C 函数 — 异步调用，返回 Promise | [funcAsync()](/zh/js/api/funcAsync-js) |
| `lib.close()` | 同步关闭库并释放资源 | [close()](/zh/js/api/close-js) |
| `lib.closeAsync()` | 异步关闭库，等待 Worker 和异步任务完成 | [closeAsync()](/zh/js/api/closeAsync-js) |

详见 [Library](/zh/js/api/library-js)

### types — 统一类型系统

| 类型 | C 等价 | 大小 |
|------|--------|------|
| `types.void` | `void` | 0 |
| `types.int8` | `int8_t` | 1 |
| `types.uint8` | `uint8_t` | 1 |
| `types.int16` | `int16_t` | 2 |
| `types.uint16` | `uint16_t` | 2 |
| `types.int32` | `int32_t` | 4 |
| `types.uint32` | `uint32_t` | 4 |
| `types.int64` | `int64_t` | 8 |
| `types.uint64` | `uint64_t` | 8 |
| `types.float32` | `float` | 4 |
| `types.float64` | `double` | 8 |
| `types.pointer` | `void*` | 8 |
| `types.cstring` | `char*` | 8 |

详见 [类型系统](/zh/js/api/types-js)

### pointer / array — 复合类型构造器

| 函数 | 说明 |
|------|------|
| `pointer(type?)` | 创建指针类型描述符 |
| `array(type, length)` | 创建数组类型描述符 |

详见 [类型系统](/zh/js/api/types-js)

### struct — 结构体定义

| 函数 | 说明 |
|------|------|
| `struct(fields, options?)` | 定义 C 结构体类型 |

详见 [struct](/zh/js/api/struct-js)

### Pointer — 原始内存读写

| 方法 | 读/写 |
|------|-------|
| `readInt8` / `writeInt8` | `int8` |
| `readUint8` / `writeUint8` | `uint8` |
| `readInt16` / `writeInt16` | `int16` |
| `readUint16` / `writeUint16` | `uint16` |
| `readInt32` / `writeInt32` | `int32` |
| `readUint32` / `writeUint32` | `uint32` |
| `readInt64` / `writeInt64` | `int64` (BigInt) |
| `readUint64` / `writeUint64` | `uint64` (BigInt) |
| `readFloat32` / `writeFloat32` | `float32` |
| `readFloat64` / `writeFloat64` | `float64` |
| `readPointer` / `writePointer` | `pointer` |
| `readCString` / `writeCString` | C 字符串 |
| `add(offset)` | 指针偏移 → 新 Pointer |
| `toBigInt()` | 转为 BigInt |
| `address` (getter) | 获取地址（返回 `bigint`） |
| `isNull()` | 检查是否为空指针 |
| `numberAddress` (getter) | 兼容旧代码的 Number 地址（deprecated） |

详见 [Pointer](/zh/js/api/pointer-js)

### callback — 回调函数

| 函数 | 说明 |
|------|------|
| `callback(retType, argTypes, fn, options?)` | 将 JS 函数封装为 C 函数指针 |

详见 [callback](/zh/js/api/callback-js)

### 内存管理

| 函数 | 说明 |
|------|------|
| `alloc(size)` | 分配指定大小的内存 |
| `free(ptr)` | 释放内存 |
| `addressOf(buffer)` | 获取 ArrayBuffer 的指针地址 |
| `errno()` | 获取最后一次系统调用的错误码 |
| `strerror(code?)` | 获取错误码对应的描述字符串 |

详见 [内存管理](/zh/js/api/memory-js)

### 自定义后端

| 导出 | 说明 | 文档 |
|------|------|------|
| `LibraryLike` (类型) | 自定义后端接口契约 | [自定义后端](/zh/js/api/custom-backend-js) |
| `PartialLibraryLike` (类型) | 部分实现类型（所有方法可选） | [自定义后端](/zh/js/api/custom-backend-js) |
| `isLibraryLike(obj)` | 检查对象是否实现 LibraryLike 接口 | [自定义后端](/zh/js/api/custom-backend-js) |
| `getMissingMethods(obj)` | 获取缺失的强制方法名列表 | [自定义后端](/zh/js/api/custom-backend-js) |
| `createBackendWithFallback(partial, builtinAdapter)` | 用部分实现 + 内置适配器创建完整后端 | [自定义后端](/zh/js/api/custom-backend-js) |

详见 [自定义后端](/zh/js/api/custom-backend-js)

### 错误类型

| 类 | 说明 |
|----|------|
| `FFIError` | 通用 FFI 错误 |
| `FFITypeError` | 类型相关错误（继承自 FFIError） |
| `FFIBackendError` | 自定义后端相关错误（继承自 FFIError） |

详见 [错误处理](/zh/js/api/errors-js)

---

**详细文档**:
- [Library](/zh/js/api/library-js) - 库加载和函数绑定
- [类型系统](/zh/js/api/types-js) - 类型定义和使用
- [Pointer](/zh/js/api/pointer-js) - 指针读写操作
- [struct](/zh/js/api/struct-js) - 结构体定义
- [callback](/zh/js/api/callback-js) - 回调函数
- [内存管理](/zh/js/api/memory-js) - 内存分配和释放
- [错误处理](/zh/js/api/errors-js) - 错误类型
- [自定义后端](/zh/js/api/custom-backend-js) - 注入自定义 FFI 实现
