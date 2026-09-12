# func — 同步函数绑定

绑定一个 C 函数，返回可调用的宿主语言函数。结果会被缓存，对同一签名重复调用返回相同的函数对象。

## 导入

```ts
// JavaScript/TypeScript
import { Library, types } from '@tt23xrstudio/senri_ffi';
```

```python
# Python
from senri_ffi import Library, types
```

## 签名

```ts
// JavaScript/TypeScript
const fn = lib.func(name, returnType, [argTypes], options?);
const result = fn(...args);
```

```python
# Python
fn = lib.func(name, return_type, [arg_types])
result = fn(*args)
```

## 参数

| 参数 | 类型 | 必须 | 说明 |
|------|------|------|------|
| `name` | `string` / `str` | 是 | C 函数名称 |
| `returnType` | 类型描述符 | 是 | 返回值类型 |
| `argTypes` | 类型描述符列表 | 是 | 参数类型列表 |
| `options` | `object?` | 否 | JS: 调用约定等；Python: 未使用 |

## 返回值

宿主语言函数。调用时参数按类型转换为 C 字节表示，通过底层 FFI 调用原生 C 函数，返回值按类型转换为宿主语言值。

---

**详细文档**:
- [func() (JavaScript)](/zh/js/api/func-js)
- [func() (Python)](/zh/py/api/func-py)
