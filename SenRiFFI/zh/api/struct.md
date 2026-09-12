# struct — 结构体定义

`struct()` 函数用于定义 C 结构体类型，自动处理字段布局、对齐和紧凑排列。

## 导入

```ts
// JavaScript/TypeScript
import { struct, types } from '@tt23xrstudio/senri_ffi';
```

```python
# Python
from senri_ffi import struct, types
```

## 签名

```ts
// JavaScript/TypeScript
const Point = struct({ x: types.float64, y: types.float64 });
const p = new Point({ x: 1.0, y: 2.0 });
```

```python
# Python
Point = struct({"x": types.float64, "y": types.float64})
p = Point({"x": 1.0, "y": 2.0})
```

## API 对照

| 操作 | JavaScript | Python |
|------|-----------|--------|
| 定义 | `struct(fields, options?)` | `struct(fields, options?)` |
| 创建 | `new Point({ x: 1.0 })` | `Point({"x": 1.0})` |
| 大小 | `Point.sizeof` | `Point._total_size` |
| 指针 | `p.ptr` / `p.toPointer()` | `p.ptr` / `p.to_pointer()` |
| 反序列化 | `Point.fromPointer(ptr)` | `Point.from_pointer(ptr)` |
| packed | `{ packed: 1 }` | `{"packed": 1}` |

---

**详细文档**:
- [struct (JavaScript)](/zh/js/api/struct-js)
- [struct (Python)](/zh/py/api/struct-py)
