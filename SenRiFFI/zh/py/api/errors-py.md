# 错误处理（Python）

SenRi FFI Python 版定义了三个错误类用于统一错误处理。

## 导入

```python
from senri_ffi import FFIError, FFITypeError, FFIBackendError
```

## 错误类型

### `FFIError`

通用 FFI 错误，基类。继承自 `Exception`。

```python
class FFIError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.name = "FFIError"
```

### `FFITypeError`

类型相关错误，继承自 `FFIError`。

```python
class FFITypeError(FFIError):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.name = "FFITypeError"
```

### `FFIBackendError`

自定义后端相关错误，继承自 `FFIError`。在自定义后端初始化、验证或运行阶段抛出。

```python
class FFIBackendError(FFIError):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.name = "FFIBackendError"
```

---

## 各模块抛出的错误

### Library

| 场景 | 错误类型 | 消息 |
|------|---------|------|
| 后端未初始化 | `FFIError` | `'Adapter not initialized'` |
| 加载库失败 | `FFIError` | `'Failed to load library "{path}": {reason}'` |
| 库已关闭后绑定函数 | `FFIError` | `'Library is closed'` |
| 绑定函数失败 | `FFIError` | `'Failed to bind function "{name}": symbol not found'` |

### callback

| 场景 | 错误类型 | 消息 |
|------|---------|------|
| 后端未初始化 | `FFIError` | `'Adapter not initialized'` |
| 参数不可调用 | `FFIError` | `'callback requires a callable'` |

### 内存管理

| 场景 | 错误类型 | 消息 |
|------|---------|------|
| 后端未初始化 | `FFIError` | `'Adapter not initialized'` |
| alloc size 无效 | `FFIError` | `'alloc requires a positive size'` |
| address_of 参数无效 | `FFIError` | `'address_of requires bytes, bytearray, or memoryview'` |

### Pointer

| 场景 | 错误类型 | 消息 |
|------|---------|------|
| 读取无缓冲区指针 | `FFIError` | `'Cannot read from this pointer: no backing buffer'` |
| 写入无缓冲区指针 | `FFIError` | `'Cannot write to this pointer: no backing buffer'` |

### 自定义后端

| 场景 | 错误类型 | 消息 |
|------|---------|------|
| backend 参数类型无效 | `FFITypeError` | `'Invalid backend: expected a LibraryLike object or a constructor, got {type}'` |
| 后端缺失强制方法 | `FFITypeError` | `'Invalid backend: missing mandatory methods: alloc, free, ...'` |
| 烟雾测试返回值不符 | `FFITypeError` | `'Smoke test failed: alloc(1) returned object with invalid __ptr'` |
| 后端 bind 抛出异常 | `FFIError` | `'Failed to bind function "{name}": {reason}'` |

---

## 使用示例

```python
from senri_ffi import Library, FFIError

try:
    lib = Library.load("nonexistent.so")
except FFIError as e:
    print(f"FFI 错误: {e}")
except Exception as e:
    print(f"未知错误: {e}")
```

```python
from senri_ffi import alloc, FFIError

try:
    mem = alloc(-1)  # 无效大小
except FFIError as e:
    print(e)  # "alloc requires a positive size"
```

## 与 JavaScript 版的对照

Python 版和 JavaScript 版的错误类设计完全一致：

| 错误类 | JavaScript 版 | Python 版 |
|--------|--------------|-----------|
| 通用错误 | `FFIError` | `FFIError` |
| 类型错误 | `FFITypeError` | `FFITypeError` |
| 后端错误 | `FFIBackendError` | `FFIBackendError` |
| 基类 | `Error` | `Exception` |
