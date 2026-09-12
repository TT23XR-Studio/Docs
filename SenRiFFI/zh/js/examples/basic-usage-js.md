# 基础用法示例（JavaScript）

本页展示 SenRi FFI 的常见使用模式。

---

## 1. 加载库并调用函数

```ts
import { Library, types } from '@tt23xrstudio/senri_ffi';

// 跨平台加载 C 数学库
const libm = Library.load(
  process.platform === 'win32' ? 'msvcrt.dll'
    : process.platform === 'darwin' ? 'libm.dylib'
    : 'libm.so.6'
);

// 绑定函数
const abs  = libm.func('abs', types.int32, [types.int32]);
const sqrt = libm.func('sqrt', types.float64, [types.float64]);
const pow  = libm.func('pow', types.float64, [types.float64, types.float64]);

console.log(abs(-42));   // 42
console.log(sqrt(25));   // 5
console.log(pow(2, 10)); // 1024

libm.close();
```

---

## 2. Windows — 调用 MessageBoxW

```ts
import { Library, types } from '@tt23xrstudio/senri_ffi';

const user32 = Library.load('user32.dll');

const MessageBoxW = user32.func(
  'MessageBoxW',
  types.int32,
  [types.pointer, types.cstring, types.cstring, types.uint32]
);

const result = MessageBoxW(null, 'Hello from SenRi FFI!', 'SenRi FFI Demo', 0);
console.log('MessageBox 返回:', result);

user32.close();
```

---

## 3. 内存分配与读写

```ts
import { alloc, free } from '@tt23xrstudio/senri_ffi';

const mem = alloc(32);

// 写入不同类型的数据
mem.writeInt32(0, 42);
mem.writeFloat64(4, 3.14159);
mem.writeCString(12, 'hello');

// 读取数据
console.log(mem.readInt32(0));     // 42
console.log(mem.readFloat64(4));   // 3.14159
console.log(mem.readCString(12));  // "hello"

free(mem);
```

---

## 4. 从 ArrayBuffer 获取指针

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

---

## 5. 指针偏移操作

```ts
import { alloc } from '@tt23xrstudio/senri_ffi';

const mem = alloc(64);

// 在偏移 0 写入 int32
mem.writeInt32(0, 100);
// 在偏移 4 写入 int32
mem.writeInt32(4, 200);
// 在偏移 8 写入 int32
mem.writeInt32(8, 300);

// 使用 add 进行指针偏移
const second = mem.add(4);
console.log(second.readInt32(0)); // 200
console.log(second.readInt32(4)); // 300
```

---

## 6. errno / strerror — 获取系统错误信息

```ts
import { Library, types, errno, strerror } from '@tt23xrstudio/senri_ffi';

// errno 仅在 KossJS 上有实际支持
const code = errno();
if (code !== 0) {
  console.log(`errno: ${code} — ${strerror(code)}`);
}

// 与其他 FFI 操作配合使用
const libc = Library.load(
  process.platform === 'win32' ? 'msvcrt.dll' : 'libc.so.6'
);

// 调用一个可能失败的系统函数...
const fopen = libc.func('fopen', types.pointer, [types.cstring, types.cstring]);
const file = fopen('nonexistent.txt', 'r');

if (file.address === 0n) {
  const err = errno();
  console.error(`打开文件失败: ${strerror(err)}`);
}

libc.close();
```

---

## 7. 跨运行时同一代码

以下代码在 KossJS、Bun、Deno 和 Node.js 上都能运行，无需修改：

```ts
import { Library, types } from '@tt23xrstudio/senri_ffi';

const platform = process.platform;
const libPath = platform === 'win32' ? 'msvcrt.dll'
  : platform === 'darwin' ? 'libSystem.dylib'
  : 'libc.so.6';

const libc = Library.load(libPath);

const abs   = libc.func('abs', types.int32, [types.int32]);
const atoi  = libc.func('atoi', types.int32, [types.cstring]);

console.log(abs(-99));        // 99
console.log(atoi('12345'));   // 12345

libc.close();
```

---

## 8. 错误处理

```ts
import { Library, types, FFIError } from '@tt23xrstudio/senri_ffi';

// 加载不存在的库
try {
  const lib = Library.load('nonexistent_library.so');
} catch (e) {
  if (e instanceof FFIError) {
    console.error('无法加载库:', e.message);
  }
}

// 库已关闭后调用
try {
  const lib = Library.load('libm.so.6');
  lib.close();
  lib.func('abs', types.int32, [types.int32]); // 库已关闭
} catch (e) {
  if (e instanceof FFIError) {
    console.error('调用失败:', e.message); // "Library is closed"
  }
}

// alloc 参数验证
import { alloc } from '@tt23xrstudio/senri_ffi';

try {
  alloc(-1);
} catch (e) {
  if (e instanceof FFIError) {
    console.error(e.message); // "alloc requires a positive size"
  }
}
```
