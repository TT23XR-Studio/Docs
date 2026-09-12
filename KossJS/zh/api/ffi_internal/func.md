# 同步函数绑定 (`lib.func()`)

`lib.func(name, retType, argTypes, [opts])` 返回一个 JS 函数，该函数会**同步**调用 C 动态库中的对应符号。

---

## 语法

```javascript
lib.func(symbolName, returnType, [argTypes])
lib.func(symbolName, returnType, [argTypes], options)
```

### 参数

| 参数 | 类型 | 必须 | 说明 |
|------|------|------|------|
| `symbolName` | `string` | 是 | C 符号名称（函数名） |
| `returnType` | `string\|Object` | 是 | 返回值类型，使用 `_senri_ffi.types.*` 常量 |
| `argTypes` | `Array` | 是 | 参数类型数组 `[arg1Type, arg2Type, ...]` |
| `options` | `Object` | 否 | 可选配置（调用约定等） |

### 返回值

返回一个 JavaScript 函数。调用该函数时：

1. 将 JS 参数按类型转换为 C 字节表示
2. 通过 **libffi** 调用原生 C 函数
3. 将返回值按类型转换为 JS 值

---

## 参数转换细节

### 数值类型 (`int8` ~ `float64`)

```javascript
const fn = lib.func('add', ffi.types.int32, [ffi.types.int32, ffi.types.int32]);
fn(3, 5); // → 8
// JS: (3, 5)  → C: add(3, 5)  → JS: 8
```

### 指针类型 (`pointer`)

指针作为 JS `number`（地址值）或 `Pointer` 对象传递：

```javascript
const memset = lib.func('memset', ffi.types.pointer, [
  ffi.types.pointer,   // void *s
  ffi.types.int32,     // int c
  ffi.types.uint64     // size_t n
]);

const buf = ffi.alloc(128);
memset(buf, 0, 128);   // buf 是 Pointer 对象，自动提取地址
// 等价于：C: memset(buf_ptr, 0, 128)
```

### C 字符串 (`cstring`)

```javascript
const puts = lib.func('puts', ffi.types.int32, [ffi.types.cstring]);
puts('Hello, World!'); // C: puts("Hello, World!")

const strlen = lib.func('strlen', ffi.types.uint64, [ffi.types.cstring]);
strlen('你好'); // C: strlen("你好")  → 6 (UTF-8 字节数)
```

`null` / `undefined` 会被转为 C 空指针：

```javascript
const fn = lib.func('some_fn', ffi.types.void, [ffi.types.cstring]);
fn(null); // C: some_fn(NULL)
```

### 结构体参数

```javascript
const Point = ffi.struct([
  { name: 'x', type: ffi.types.float64 },
  { name: 'y', type: ffi.types.float64 },
]);

const distance = lib.func('distance', ffi.types.float64, [Point, Point]);
const p1 = new Point({ x: 0, y: 0 });
const p2 = new Point({ x: 3, y: 4 });
distance(p1, p2); // C: distance({0,0}, {3,4}) → 5.0
```

### 数组参数

```javascript
const IntArr = ffi.array(ffi.types.int32, 5);
const sum = lib.func('sum_int_array', ffi.types.int32, [IntArr]);
const arr = [1, 2, 3, 4, 5];
sum(arr); // C: sum_int_array({1,2,3,4,5})
```

### 回调参数

```javascript
const CompareFunc = ffi.callback(ffi.types.int32, [
  ffi.types.pointer, ffi.types.pointer
]);
const cb = ffi.createCallback(ffi.types.int32, [
  ffi.types.pointer, ffi.types.pointer
], (aPtr, bPtr) => aPtr - bPtr);

const qsort = lib.func('qsort', ffi.types.void, [
  ffi.types.pointer, ffi.types.uint64, ffi.types.uint64, CompareFunc
]);
qsort(buf, count, elemSize, cb);
```

---

## 可变参数函数

使用 `'...'` 类型标记可变参数：

```javascript
const { int32, cstring, float64 } = ffi.types;

// int printf(const char *format, ...)
const printf = lib.func('printf', int32, [cstring, '...']);
printf('Value: %d, Name: %s\n', 42, 'Alice');
// 输出: Value: 42, Name: Alice

// 可变参数按 usize 宽度传递（64位系统上为 8 字节）
```

可变参数的特殊规则：

1. `'...'` 标记之后的所有参数视为可变参数
2. 可变参数按 `usize` 宽度传递（与 C ABI 的默认参数提升一致）
3. `float32` 可变参数不支持（C ABI 将 float 提升为 double，但 libffi 处理受限）
4. 建议对可变参数的浮点数使用 `float64`

---

## 错误处理

### 符号未找到

```javascript
try {
  lib.func('nonexistent_function', ffi.types.void, []);
} catch (e) {
  console.error(e.message);
  // "symbol not found: nonexistent_function: ..."
}
```

### 库已关闭

```javascript
lib.close();
try {
  lib.func('sqrt', ffi.types.float64, [ffi.types.float64]);
} catch (e) {
  console.error(e.message); // "library is closed"
}
```

### 参数数量不匹配

```javascript
const add = lib.func('add', ffi.types.int32, [ffi.types.int32, ffi.types.int32]);
add(1); // Error: expected 2 arguments, got 1
add(1, 2, 3); // Error: expected 2 arguments, got 3
```

### C 函数崩溃（段错误）

如果 C 函数发生段错误或未定义行为，**整个 KossJS 进程会崩溃**。这是操作系统级别的限制，无法捕获。

---

## 调用约定选项

```javascript
const fn = lib.func('MessageBoxW', ffi.types.int32, [
  ffi.types.pointer, ffi.types.pointer, ffi.types.pointer, ffi.types.uint32
], {
  callingConvention: 'stdcall',  // 'cdecl' | 'stdcall' | 'fastcall' | 'thiscall'
});
```

| 约定 | 清理栈者 | 适用场景 |
|------|---------|---------|
| `cdecl` | 调用者 | C 语言默认，Unix/Linux |
| `stdcall` | 被调用者 | Win32 API 标准 |
| `fastcall` | 被调用者 | 性能优化 |
| `thiscall` | 被调用者 | C++ 成员函数 |

---

## 生命周期

`func()` 返回的函数绑定到库的生命周期：

- 库关闭后，绑定的函数**不再有效**
- 调用已关闭库的函数会抛出 `"library is closed"` 错误

```javascript
const sqrt = lib.func('sqrt', ffi.types.float64, [ffi.types.float64]);
lib.close();
sqrt(4.0); // Error: library is closed
```

---

## 完整示例

```javascript
const ffi = _senri_ffi;
const { int32, int64, float64, pointer, cstring, uint64 } = ffi.types;

const libc = ffi.open('libc.so.6');

// === 字符串操作 ===
const strlen = libc.func('strlen', uint64, [cstring]);
console.log(strlen('Hello')); // 5

const strcmp = libc.func('strcmp', int32, [cstring, cstring]);
console.log(strcmp('abc', 'abd')); // < 0

// === 数学运算 ===
const libm = ffi.open('libm.so.6');
const pow = libm.func('pow', float64, [float64, float64]);
console.log(pow(2.0, 10.0)); // 1024.0

// === 内存操作 ===
const memset = libc.func('memset', pointer, [pointer, int32, uint64]);
const memcpy = libc.func('memcpy', pointer, [pointer, pointer, uint64]);

const src = ffi.alloc(64);
src.writeCString(0, 'Hello, Memory!');
const dst = ffi.alloc(64);
memcpy(dst, src, 64);
console.log(dst.readCString(0)); // "Hello, Memory!"
ffi.free(src);
ffi.free(dst);

// === 文件操作 (POSIX) ===
const open = libc.func('open', int32, [cstring, int32]);
const write = libc.func('write', int64, [int32, pointer, uint64]);
const close = libc.func('close', int32, [int32]);

const O_WRONLY = 1;
const O_CREAT = 0x40;
const fd = open('test.txt', O_WRONLY | O_CREAT);
const msg = ffi.alloc(32);
msg.writeCString(0, 'POSIX write test\n');
write(fd, msg, 17);
close(fd);
ffi.free(msg);

// === printf (可变参数) ===
const fprintf = libc.func('fprintf', int32, [pointer, cstring, '...']);
// (需要知道 FILE* 的地址才能用)

libc.close();
libm.close();
```
