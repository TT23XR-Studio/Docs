# 基础用法示例

本页展示 SenRi FFI 的常见使用模式（JavaScript/TypeScript 和 Python 对照）。

---

## 1. 加载库并调用函数

### JavaScript / TypeScript

```ts
import { Library, types } from '@tt23xrstudio/senri_ffi';

const libm = Library.load(
  process.platform === 'win32' ? 'msvcrt.dll'
    : process.platform === 'darwin' ? 'libm.dylib'
    : 'libm.so.6'
);

const abs  = libm.func('abs', types.int32, [types.int32]);
const sqrt = libm.func('sqrt', types.float64, [types.float64]);
const pow  = libm.func('pow', types.float64, [types.float64, types.float64]);

console.log(abs(-42));   // 42
console.log(sqrt(25));   // 5
console.log(pow(2, 10)); // 1024

libm.close();
```

### Python

```python
from senri_ffi import Library, types
import platform

libm = Library.load(
    "msvcrt.dll" if platform.system() == "Windows"
    else "libm.dylib" if platform.system() == "Darwin"
    else "libm.so.6"
)

abs_fn = libm.func("abs", types.int32, [types.int32])
sqrt = libm.func("sqrt", types.float64, [types.float64])
pow = libm.func("pow", types.float64, [types.float64, types.float64])

print(abs_fn(-42))   # 42
print(sqrt(25))      # 5.0
print(pow(2, 10))    # 1024.0

libm.close()
```

---

## 2. 内存分配与读写

### JavaScript / TypeScript

```ts
import { alloc, free } from '@tt23xrstudio/senri_ffi';

const mem = alloc(32);

mem.writeInt32(0, 42);
mem.writeFloat64(4, 3.14159);
mem.writeCString(12, 'hello');

console.log(mem.readInt32(0));     // 42
console.log(mem.readFloat64(4));   // 3.14159
console.log(mem.readCString(12));  // "hello"

free(mem);
```

### Python

```python
from senri_ffi import alloc, free

mem = alloc(32)

mem.write_int32(0, 42)
mem.write_float64(4, 3.14159)
mem.write_cstring(12, "hello")

print(mem.read_int32(0))     # 42
print(mem.read_float64(4))   # 3.14159
print(mem.read_cstring(12))  # "hello"

free(mem)
```

---

## 3. 从缓冲区获取指针

### JavaScript / TypeScript

```ts
import { addressOf } from '@tt23xrstudio/senri_ffi';

const buf = new ArrayBuffer(16);
const view = new DataView(buf);
view.setInt32(0, 42, true);
view.setFloat64(4, 3.14, true);

const ptr = addressOf(buf);
console.log(ptr.readInt32(0));   // 42
console.log(ptr.readFloat64(4)); // 3.14
```

### Python

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

## 4. 指针偏移操作

### JavaScript / TypeScript

```ts
import { alloc } from '@tt23xrstudio/senri_ffi';

const mem = alloc(64);
mem.writeInt32(0, 100);
mem.writeInt32(4, 200);
mem.writeInt32(8, 300);

const second = mem.add(4);
console.log(second.readInt32(0)); // 200
console.log(second.readInt32(4)); // 300
```

### Python

```python
from senri_ffi import alloc

mem = alloc(64)
mem.write_int32(0, 100)
mem.write_int32(4, 200)
mem.write_int32(8, 300)

second = mem.add(4)
print(second.read_int32(0))  # 200
print(second.read_int32(4))  # 300
```

---

## 5. 错误处理

### JavaScript / TypeScript

```ts
import { Library, types, FFIError } from '@tt23xrstudio/senri_ffi';

try {
  const lib = Library.load('nonexistent_library.so');
} catch (e) {
  if (e instanceof FFIError) {
    console.error('无法加载库:', e.message);
  }
}
```

### Python

```python
from senri_ffi import Library, FFIError

try:
    lib = Library.load("nonexistent_library.so")
except FFIError as e:
    print(f"无法加载库: {e}")
```
