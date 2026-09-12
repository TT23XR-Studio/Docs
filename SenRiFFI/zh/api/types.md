# types — 统一类型系统

SenRi FFI 提供了一套统一的 C 类型系统，在所有语言/运行时上使用相同的类型名称。

## 导入

```ts
// JavaScript/TypeScript
import { types, pointer, array } from '@tt23xrstudio/senri_ffi';
```

```python
# Python
from senri_ffi import types, pointer, array
```

## 类型常量

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

## 类型构造器

| 构造器 | 说明 |
|--------|------|
| `pointer(type?)` | 创建指针类型描述符 |
| `array(type, length)` | 创建数组类型描述符 |

---

**详细文档**:
- [类型系统 (JavaScript)](/zh/js/api/types-js)
- [类型系统 (Python)](/zh/py/api/types-py)
