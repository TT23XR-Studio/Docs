# func — 同步函数绑定（Python）

`lib.func(name, retType, argTypes)` 绑定一个 C 函数，返回可调用的 Python 函数。结果会被缓存，对同一签名重复调用返回相同的函数对象。

## 语法

```python
fn = lib.func(symbol_name, return_type, [arg_types])
result = fn(*args)
```

### 参数

| 参数 | 类型 | 必须 | 说明 |
|------|------|------|------|
| `symbol_name` | `str` | 是 | C 函数名称 |
| `return_type` | 类型描述符 | 是 | 返回值类型 |
| `arg_types` | 类型描述符列表 | 是 | 参数类型列表 |

### 返回值

返回一个 Python 函数。调用该函数时：

1. Python 参数按类型转换为 C 字节表示
2. 通过后端底层 FFI 调用原生 C 函数
3. 返回值按类型转换为 Python 值

## 缓存机制

内部使用 `dict` 缓存已绑定的函数。类型描述符先通过 `normalize_type()` 标准化，再用 `serialize_type()` 生成稳定的字符串键。

```python
# 对相同签名，第二次调用直接返回缓存
fn1 = lib.func("abs", types.int32, [types.int32])
fn2 = lib.func("abs", types.int32, [types.int32])
assert fn1 is fn2  # True

# 不同签名有不同缓存
fn3 = lib.func("abs", types.float64, [types.float64])
assert fn1 is not fn3  # True
```

## 类型标准化

传入的类型描述符会经过 `normalize_type()` 标准化：

```python
# 用户传入
types.int32                              # → 'int32' 字符串
pointer(types.uint8)                     # → NormalizedType(kind='pointer', ...)
array(types.float64, 10)                 # → NormalizedType(kind='array', ...)
struct({"x": types.int32, "y": types.int32})  # → struct class

# 标准化后 → NormalizedType
# { kind: 'primitive', name: 'int32' }
# { kind: 'pointer', of: { kind: 'primitive', name: 'uint8' } }
# { kind: 'array', of: { ... }, length: 10 }
# { kind: 'struct', fields: { ... }, size: 8, align: 4 }
```

标准化后的 `NormalizedType` 被传给各后端适配器，由适配器内部映射为后端原生类型。

## 使用示例

### 基本类型

```python
from senri_ffi import Library, types
import platform

lib = Library.load(
    "libSystem.B.dylib" if platform.system() == "Darwin" else "libm.so.6"
)

abs_fn = lib.func("abs", types.int32, [types.int32])
print(abs_fn(-42))  # 42

sqrt = lib.func("sqrt", types.float64, [types.float64])
print(sqrt(25.0))  # 5.0
```

### 指针和字符串

```python
import platform
libc = Library.load(
    "msvcrt.dll" if platform.system() == "Windows" else "libc.so.6"
)

strlen = libc.func("strlen", types.int32, [types.cstring])
print(strlen(b"hello"))  # 5
```

## 错误处理

| 场景 | 错误 |
|------|------|
| 库已关闭 | `FFIError: Library is closed` |
| 符号未找到 | `FFIError: Failed to bind function "xxx"` |
| 后端未初始化 | `FFIError: Adapter not initialized` |
| 参数数量不匹配 | 运行时错误（各后端行为不同） |

---

**相关文档**:
- [Library.load()](/zh/py/api/library-py)
- [close() — 关闭库](/zh/py/api/close-py)
