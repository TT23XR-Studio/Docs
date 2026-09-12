# 自定义后端

允许用户注入完全自定义的 FFI 后端实现，替换内置的语言/运行时自动检测机制。

## 导入

```ts
// JavaScript/TypeScript
import {
  type LibraryLike,
  type PartialLibraryLike,
  isLibraryLike,
  getMissingMethods,
  createBackendWithFallback,
} from '@tt23xrstudio/senri_ffi';
```

```python
# Python
from senri_ffi import Library
from senri_ffi.types.library_like import is_library_like, get_missing_methods
```

## 概述

默认情况下 SenRi FFI 自动检测当前语言/运行时并选用对应的内置适配器。自定义后端允许你实现 `LibraryLike` 接口，SenRi 通过适配器包装器将其接入现有架构。

## LibraryLike 接口

两个语言版本共享相同的设计理念，但接口定义方式不同：

| 方法 | JavaScript (类型) | Python (鸭子类型) |
|------|-------------------|-------------------|
| 加载库 | `open(path): any` | `load_library(path): Any` |
| 绑定函数 | `bind(handle, name, ret, args): Function` | `bind_function(handle, name, ret, args): Callable` |
| 关闭库 | `close(handle): void` | `close_library(handle): None` |
| 分配内存 | `alloc(size): {__ptr, __buf, __size}` | `alloc(size): dict` |
| 释放内存 | `free(ptr): void` | `free(ptr): None` |
| 获取地址 | `addressOf(buffer): bigint` | `address_of(buffer): int` |
| 注册回调 | `registerCallback(fn, ret, args): {__ptr, __cb}` | `register_callback(fn, ret, args): dict` |
| 释放回调 | `unregisterCallback(ptr): void` | `unregister_callback(ptr): None` |
| 错误码 | `getErrno(): number` | `get_errno(): int` |
| 错误描述 | `getStrerror(errno): string` | `get_strerror(errno): str` |
| 异步绑定 | `bindAsync?(...)` (JS 可选) | ❌ 不支持 |

## 类型守卫

| 语言/运行时 | 检查函数 | 获取缺失方法 |
|------------|---------|-------------|
| JavaScript | `isLibraryLike(obj)` | `getMissingMethods(obj)` |
| Python | `is_library_like(obj)` | `get_missing_methods(obj)` |

---

**详细文档**:
- [自定义后端 (JavaScript)](/zh/js/api/custom-backend-js)
- [自定义后端 (Python)](/zh/py/api/custom-backend-py)
