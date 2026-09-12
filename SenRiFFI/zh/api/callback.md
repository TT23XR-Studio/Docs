# callback — 回调函数

`callback()` 将宿主语言函数封装为 C 函数指针，可以传递给 C 库作为回调。

## 导入

```ts
// JavaScript/TypeScript
import { callback, types } from '@tt23xrstudio/senri_ffi';
```

```python
# Python
from senri_ffi import callback, types
```

## 签名

```ts
// JavaScript/TypeScript
const cb = callback(retType, argTypes, jsFn, options?);
```

```python
# Python
cb = callback(ret_type, arg_types, python_fn, options=None)
```

## 返回值

返回 `Pointer` 实例，其 `address` 指向 C 回调的函数指针。

## 自动垃圾回收

| 语言/运行时 | 机制 |
|------------|------|
| JavaScript | `FinalizationRegistry` 自动释放 |
| Python | `weakref.WeakValueDictionary` 自动释放 |

> [!WARNING]
> 如果回调需要长期存活，务必保持对回调对象的引用，否则可能被 GC 回收。

---

**详细文档**:
- [callback (JavaScript)](/zh/js/api/callback-js)
- [callback (Python)](/zh/py/api/callback-py)
