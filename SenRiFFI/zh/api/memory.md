# 内存管理

SenRi FFI 提供内存管理函数：`alloc`、`free`、`addressOf`/`address_of`、`errno`、`strerror`。

## 导入

```ts
// JavaScript/TypeScript
import { alloc, free, addressOf, errno, strerror } from '@tt23xrstudio/senri_ffi';
```

```python
# Python
from senri_ffi import alloc, free, address_of, errno, strerror
```

## API 对照

| 功能 | JavaScript | Python |
|------|-----------|--------|
| 分配内存 | `alloc(size)` | `alloc(size)` |
| 释放内存 | `free(ptr)` | `free(ptr)` |
| 获取地址 | `addressOf(buffer)` | `address_of(buffer)` |
| 错误码 | `errno()` | `errno()` |
| 错误描述 | `strerror(code)` | `strerror(code)` |

## addressOf / address_of 参数差异

| 语言/运行时 | 支持的类型 |
|------------|-----------|
| JavaScript | `ArrayBuffer`、`ArrayBufferView`（`Uint8Array` 等） |
| Python | `bytes`、`bytearray`、`memoryview` |

---

**详细文档**:
- [内存管理 (JavaScript)](/zh/js/api/memory-js)
- [内存管理 (Python)](/zh/py/api/memory-py)
