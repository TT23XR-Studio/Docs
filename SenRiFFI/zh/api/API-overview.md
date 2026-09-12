# API 概览

SenRi FFI 是一个**跨语言 FFI（外部函数接口）统一抽象库**，提供 JavaScript/TypeScript 和 Python 两个语言版本，共享统一的类型系统和 API 设计理念。

## 语言/运行时版本

| 语言/运行时 | 包 | 版本 | 文档 |
|------------|-----|------|------|
| JavaScript/TypeScript（KossJS、Node.js、Bun、Deno） | `@tt23xrstudio/senri_ffi` | 0.3.2 | [JS API 文档](/zh/js/api/API-overview-js) |
| Python（ctypes / cffi） | `senri-ffi` | 0.1.0 | [Python API 文档](/zh/py/api/API-overview-py) |

## 统一 API 设计

两个语言版本共享相同的设计理念和 API 命名：

### Library — 库加载与函数绑定

| API | JavaScript/TypeScript | Python |
|-----|----------------------|--------|
| 加载库 | `Library.load(path)` | `Library.load(path)` |
| 绑定函数 | `lib.func(name, ret, args)` | `lib.func(name, ret, args)` |
| 异步绑定 | `lib.funcAsync(name, ret, args)` | ❌ 不支持 |
| 关闭库 | `lib.close()` / `lib.closeAsync()` | `lib.close()` |

### types — 统一类型系统

| 类型 | C 等价 | JS 对应 | Python 对应 |
|------|--------|---------|-------------|
| `types.void` | `void` | `undefined` | `None` |
| `types.int8` | `int8_t` | `number` | `int` |
| `types.uint8` | `uint8_t` | `number` | `int` |
| `types.int16` | `int16_t` | `number` | `int` |
| `types.uint16` | `uint16_t` | `number` | `int` |
| `types.int32` | `int32_t` | `number` | `int` |
| `types.uint32` | `uint32_t` | `number` | `int` |
| `types.int64` | `int64_t` | `bigint` | `int` |
| `types.uint64` | `uint64_t` | `bigint` | `int` |
| `types.float32` | `float` | `number` | `float` |
| `types.float64` | `double` | `number` | `float` |
| `types.pointer` | `void*` | `bigint` | `int` |
| `types.cstring` | `char*` | `string` | `bytes` |

### 类型构造器

| 构造器 | JavaScript/TypeScript | Python |
|--------|----------------------|--------|
| 指针类型 | `pointer(types.int32)` | `pointer(types.int32)` |
| 数组类型 | `array(types.uint8, 256)` | `array(types.uint8, 256)` |

### struct — 结构体

| API | JavaScript/TypeScript | Python |
|-----|----------------------|--------|
| 定义 | `struct({ x: types.float64 })` | `struct({"x": types.float64})` |
| 创建 | `new Point({ x: 1.0 })` | `Point({"x": 1.0})` |
| 大小 | `Point.sizeof` | `Point._total_size` |
| 指针 | `p.ptr` / `p.toPointer()` | `p.ptr` / `p.to_pointer()` |
| 反序列化 | `Point.fromPointer(ptr)` | `Point.from_pointer(ptr)` |

### Pointer — 指针读写

| 方法 | JavaScript/TypeScript | Python |
|------|----------------------|--------|
| 读 int32 | `ptr.readInt32(offset)` | `ptr.read_int32(offset)` |
| 写 int32 | `ptr.writeInt32(offset, v)` | `ptr.write_int32(offset, v)` |
| 读 float64 | `ptr.readFloat64(offset)` | `ptr.read_float64(offset)` |
| 写 float64 | `ptr.writeFloat64(offset, v)` | `ptr.write_float64(offset, v)` |
| 读指针 | `ptr.readPointer(offset)` | `ptr.read_pointer(offset)` |
| 写指针 | `ptr.writePointer(offset, v)` | `ptr.write_pointer(offset, v)` |
| 读字符串 | `ptr.readCString(offset)` | `ptr.read_cstring(offset)` |
| 写字符串 | `ptr.writeCString(offset, s)` | `ptr.write_cstring(offset, s)` |
| 偏移 | `ptr.add(offset)` | `ptr.add(offset)` |
| 地址 | `ptr.address` (bigint) | `ptr.address` (int) |
| 空检查 | `ptr.isNull()` | `ptr.is_null()` |

### callback — 回调函数

| API | JavaScript/TypeScript | Python |
|-----|----------------------|--------|
| 创建 | `callback(ret, args, fn)` | `callback(ret, args, fn)` |
| 获取地址 | `cb.address` | `cb.address` |
| 自动释放 | `FinalizationRegistry` | `weakref.WeakValueDictionary` |

### 内存管理

| 函数 | JavaScript/TypeScript | Python |
|------|----------------------|--------|
| 分配 | `alloc(size)` | `alloc(size)` |
| 释放 | `free(ptr)` | `free(ptr)` |
| 获取地址 | `addressOf(buffer)` | `address_of(buffer)` |
| 错误码 | `errno()` | `errno()` |
| 错误描述 | `strerror(code)` | `strerror(code)` |

### 错误类型

| 错误类 | 说明 |
|--------|------|
| `FFIError` | 通用 FFI 错误 |
| `FFITypeError` | 类型相关错误 |
| `FFIBackendError` | 自定义后端相关错误 |

### 自定义后端

两个语言版本均支持自定义 FFI 后端：

| API | JavaScript/TypeScript | Python |
|-----|----------------------|--------|
| 接口 | `LibraryLike` | `LibraryLike`（鸭子类型） |
| 检查 | `isLibraryLike(obj)` | `is_library_like(obj)` |
| 缺失方法 | `getMissingMethods(obj)` | `get_missing_methods(obj)` |

---

## 快速导航

### JavaScript/TypeScript

- [什么是 SenRi FFI (JS)](/zh/js/guide/what-is-senri-ffi-js) — 项目背景和架构
- [快速开始 (JS)](/zh/js/guide/getting-started-js) — 安装和第一个调用
- [API 文档 (JS)](/zh/js/api/API-overview-js) — 完整 JS API 参考

### Python

- [什么是 SenRi FFI (Python)](/zh/py/guide/what-is-senri-ffi-py) — 项目背景和架构
- [快速开始 (Python)](/zh/py/guide/getting-started-py) — 安装和第一个调用
- [API 文档 (Python)](/zh/py/api/API-overview-py) — 完整 Python API 参考
