# 基础用法示例（Python）

本页展示 SenRi FFI Python 版的常见使用模式。

---

## 1. 加载库并调用函数

```python
from senri_ffi import Library, types
import platform

# 跨平台加载 C 数学库
if platform.system() == "Windows":
    libm = Library.load("msvcrt.dll")
elif platform.system() == "Darwin":
    libm = Library.load("libm.dylib")
else:
    libm = Library.load("libm.so.6")

# 绑定函数
abs_fn = libm.func("abs", types.int32, [types.int32])
sqrt = libm.func("sqrt", types.float64, [types.float64])
pow = libm.func("pow", types.float64, [types.float64, types.float64])

print(abs_fn(-42))   # 42
print(sqrt(25))      # 5.0
print(pow(2, 10))    # 1024.0

libm.close()
```

---

## 2. Windows — 调用 MessageBoxW

```python
from senri_ffi import Library, types

user32 = Library.load("user32.dll")

MessageBoxW = user32.func(
    "MessageBoxW",
    types.int32,
    [types.pointer, types.cstring, types.cstring, types.uint32]
)

result = MessageBoxW(None, b"Hello from SenRi FFI!", b"SenRi FFI Demo", 0)
print(f"MessageBox 返回: {result}")

user32.close()
```

---

## 3. 内存分配与读写

```python
from senri_ffi import alloc, free

mem = alloc(32)

# 写入不同类型的数据
mem.write_int32(0, 42)
mem.write_float64(4, 3.14159)
mem.write_cstring(12, "hello")

# 读取数据
print(mem.read_int32(0))     # 42
print(mem.read_float64(4))   # 3.14159
print(mem.read_cstring(12))  # "hello"

free(mem)
```

---

## 4. 从 bytearray 获取指针

```python
from senri_ffi import address_of
import struct

buf = bytearray(16)
struct.pack_into("<i", buf, 0, 42)
struct.pack_into("<d", buf, 4, 3.14)

ptr = address_of(buf)
print(ptr.read_int32(0))    # 42
print(ptr.read_float64(4))  # 3.14
```

---

## 5. 指针偏移操作

```python
from senri_ffi import alloc

mem = alloc(64)

# 在偏移 0 写入 int32
mem.write_int32(0, 100)
# 在偏移 4 写入 int32
mem.write_int32(4, 200)
# 在偏移 8 写入 int32
mem.write_int32(8, 300)

# 使用 add 进行指针偏移
second = mem.add(4)
print(second.read_int32(0))  # 200
print(second.read_int32(4))  # 300
```

---

## 6. errno / strerror — 获取系统错误信息

```python
from senri_ffi import Library, types, errno, strerror
import platform

code = errno()
if code != 0:
    print(f"errno: {code} — {strerror(code)}")

# 与其他 FFI 操作配合使用
libc = Library.load(
    "msvcrt.dll" if platform.system() == "Windows" else "libc.so.6"
)

# 调用一个可能失败的系统函数...
fopen = libc.func("fopen", types.pointer, [types.cstring, types.cstring])
file = fopen(b"nonexistent.txt", b"r")

if file.is_null():
    err = errno()
    print(f"打开文件失败: {strerror(err)}")

libc.close()
```

---

## 7. 跨后端同一代码

以下代码在 ctypes 和 cffi 后端上都能运行，无需修改：

```python
from senri_ffi import Library, types
import platform

lib_path = (
    "msvcrt.dll" if platform.system() == "Windows"
    else "libSystem.dylib" if platform.system() == "Darwin"
    else "libc.so.6"
)

libc = Library.load(lib_path)

abs_fn = libc.func("abs", types.int32, [types.int32])
atoi = libc.func("atoi", types.int32, [types.cstring])

print(abs_fn(-99))          # 99
print(atoi(b"12345"))       # 12345

libc.close()
```

---

## 8. 错误处理

```python
from senri_ffi import Library, types, FFIError

# 加载不存在的库
try:
    lib = Library.load("nonexistent_library.so")
except FFIError as e:
    print(f"无法加载库: {e}")

# 库已关闭后调用
try:
    lib = Library.load("libm.so.6")
    lib.close()
    lib.func("abs", types.int32, [types.int32])  # 库已关闭
except FFIError as e:
    print(f"调用失败: {e}")  # "Library is closed"

# alloc 参数验证
from senri_ffi import alloc

try:
    alloc(-1)
except FFIError as e:
    print(e)  # "alloc requires a positive size"
```
