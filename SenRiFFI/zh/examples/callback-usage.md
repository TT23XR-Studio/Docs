# 回调用法示例

本页展示如何使用 SenRi FFI 创建 C 回调函数（JavaScript/TypeScript 和 Python 对照）。

---

## 1. 基本回调创建

### JavaScript / TypeScript

```ts
import { callback, types } from '@tt23xrstudio/senri_ffi';

const add = callback(
  types.int32,
  [types.int32, types.int32],
  (a, b) => a + b
);

console.log(add.address); // 回调函数的地址
```

### Python

```python
from senri_ffi import callback, types

add = callback(
    types.int32,
    [types.int32, types.int32],
    lambda a, b: a + b
)

print(add.address)  # 回调函数的地址
```

---

## 2. qsort 排序

### JavaScript / TypeScript

```ts
import { Library, callback, types, alloc, pointer } from '@tt23xrstudio/senri_ffi';

const libc = Library.load(
  process.platform === 'win32' ? 'msvcrt.dll' : 'libc.so.6'
);

const compare = callback(
  types.int32,
  [pointer(types.int32), pointer(types.int32)],
  (a, b) => a.readInt32(0) - b.readInt32(0)
);

const arr = alloc(20);
arr.writeInt32(0, 42);
arr.writeInt32(4, 7);
arr.writeInt32(8, 99);
arr.writeInt32(12, 1);
arr.writeInt32(16, 33);

const qsort = libc.func('qsort', types.void, [
  types.pointer, types.uint64, types.uint64, types.pointer
]);

qsort(arr.address, 5, 4, compare.address);

console.log(arr.readInt32(0));  // 1
console.log(arr.readInt32(4));  // 7
console.log(arr.readInt32(8));  // 33
console.log(arr.readInt32(12)); // 42
console.log(arr.readInt32(16)); // 99

libc.close();
```

### Python

```python
from senri_ffi import Library, callback, types, alloc, pointer
import platform

libc = Library.load(
    "msvcrt.dll" if platform.system() == "Windows" else "libc.so.6"
)

compare = callback(
    types.int32,
    [pointer(types.int32), pointer(types.int32)],
    lambda a, b: a.read_int32(0) - b.read_int32(0)
)

arr = alloc(20)
arr.write_int32(0, 42)
arr.write_int32(4, 7)
arr.write_int32(8, 99)
arr.write_int32(12, 1)
arr.write_int32(16, 33)

qsort = libc.func("qsort", types.void, [
    types.pointer, types.uint64, types.uint64, types.pointer
])

qsort(arr.address, 5, 4, compare.address)

print(arr.read_int32(0))   # 1
print(arr.read_int32(4))   # 7
print(arr.read_int32(8))   # 33
print(arr.read_int32(12))  # 42
print(arr.read_int32(16))  # 99
```

---

## 3. 保持回调存活

### JavaScript / TypeScript

SenRi FFI 使用 `FinalizationRegistry` 自动释放回调。如果回调需要长期存活，必须保持 JavaScript 引用：

```ts
// 正确：保持引用
globalThis._persistentCb = callback(
  types.int32, [types.int32, types.int32],
  (a, b) => a * b
);
```

### Python

SenRi FFI 使用 `weakref.WeakValueDictionary` 自动释放回调。如果回调需要长期存活，必须保持 Python 引用：

```python
import gc

persistent_cb = callback(
    types.int32, [types.int32, types.int32],
    lambda a, b: a * b
)
gc.keep_alive(persistent_cb)
```
