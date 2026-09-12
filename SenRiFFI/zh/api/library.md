# Library.load()

加载原生共享库，是 SenRi FFI 的入口。加载后可通过 `func()` 等方法绑定 C 函数。

## 导入

```ts
// JavaScript/TypeScript
import { Library } from '@tt23xrstudio/senri_ffi';
```

```python
# Python
from senri_ffi import Library
```

## 签名

```ts
Library.load(path: string, backend?: LibraryLike): Library      // JS
```

```python
Library.load(path: str, backend: Any = None) -> Library          # Python
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `path` | `string` / `str` | 共享库路径（`.dll` / `.so` / `.dylib`） |
| `backend` | 可选 | 自定义 FFI 后端，不传则自动检测 |

## 语言/运行时特定行为

| 语言/运行时 | 加载实现 |
|------------|---------|
| KossJS | `_senri_ffi.open(path)` |
| Bun | `Bun.FFI.dlopen(path, {})` |
| Deno | `Deno.dlopen(path, {})` |
| Node.js | `koffi.load(path)` |
| Python (ctypes) | `ctypes.CDLL(path)` / `ctypes.WinDLL(path)` |
| Python (cffi) | `ffi.dlopen(path)` |

---

**详细文档**:
- [Library.load() (JavaScript)](/zh/js/api/library-js)
- [Library.load() (Python)](/zh/py/api/library-py)
