# 错误处理

SenRi FFI 定义了三个错误类用于统一错误处理。

## 导入

```ts
// JavaScript/TypeScript
import { FFIError, FFITypeError, FFIBackendError } from '@tt23xrstudio/senri_ffi';
```

```python
# Python
from senri_ffi import FFIError, FFITypeError, FFIBackendError
```

## 错误类型

| 类 | 说明 | JS 基类 | Python 基类 |
|----|------|---------|-------------|
| `FFIError` | 通用 FFI 错误 | `Error` | `Exception` |
| `FFITypeError` | 类型相关错误 | `FFIError` | `FFIError` |
| `FFIBackendError` | 自定义后端相关错误 | `FFIError` | `FFIError` |

## 常见错误场景

| 场景 | 错误类型 | 消息 |
|------|---------|------|
| 加载库失败 | `FFIError` | `Failed to load library "{path}"` |
| 库已关闭 | `FFIError` | `Library is closed` |
| 符号未找到 | `FFIError` | `Failed to bind function "{name}"` |
| alloc 无效 | `FFIError` | `alloc requires a positive size` |
| 回调参数无效 | `FFIError` | `callback requires a function` (JS) / `callback requires a callable` (Python) |

---

**详细文档**:
- [错误处理 (JavaScript)](/zh/js/api/errors-js)
- [错误处理 (Python)](/zh/py/api/errors-py)
