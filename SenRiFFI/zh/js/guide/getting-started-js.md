# 快速开始（JavaScript）

## 简介

SenRi FFI 是一个统一 FFI 库，让您在 KossJS、Node.js、Bun 和 Deno 上使用同一套 API 调用原生 C 动态库。

本文档将指导您如何安装和使用 SenRi FFI。

## 安装

```bash
npm install @tt23xrstudio/senri_ffi
```

### Node.js 额外步骤

在 Node.js 上，还需要安装 `koffi`：

```bash
npm install koffi
```

### Deno 额外步骤

Deno 无需额外安装，内置 `Deno.dlopen` 支持。

## 第一个 FFI 调用

```ts
import { Library, types } from '@tt23xrstudio/senri_ffi';

// 加载 C 标准库
const lib = Library.load(
  process.platform === 'win32' ? 'msvcrt.dll' : 'libc.so.6'
);

// 绑定 C 函数
const abs = lib.func('abs', types.int32, [types.int32]);

// 调用 C 函数
console.log(abs(-42)); // 输出: 42

// 关闭库释放资源
lib.close();
```

## 跨平台示例

### Windows — 调用 MessageBox

```ts
import { Library, types } from '@tt23xrstudio/senri_ffi';

const user32 = Library.load('user32.dll');
const MessageBoxW = user32.func('MessageBoxW', types.int32, [
  types.pointer, types.cstring, types.cstring, types.uint32
]);

MessageBoxW(null, 'Hello from SenRi FFI!', 'Title', 0);
```

### Linux/macOS — 数学函数

```ts
import { Library, types } from '@tt23xrstudio/senri_ffi';

const libm = Library.load(
  process.platform === 'darwin' ? 'libSystem.B.dylib' : 'libm.so.6'
);

const sqrt = libm.func('sqrt', types.float64, [types.float64]);
const pow = libm.func('pow', types.float64, [types.float64, types.float64]);

console.log(sqrt(16));    // 4
console.log(pow(2, 10));  // 1024
```

## 基本类型系统

```ts
import { types } from '@tt23xrstudio/senri_ffi';

// 13 种基本 C 类型
types.int32    // C: int32_t
types.float64  // C: double
types.cstring  // C: const char*
types.pointer  // C: void*
types.void     // C: void
```

## 复合类型构造

```ts
import { pointer, array } from '@tt23xrstudio/senri_ffi';

pointer(types.int32);      // int32_t*
array(types.uint8, 256);   // uint8_t[256]
```

## 内存管理

```ts
import { alloc, free, addressOf } from '@tt23xrstudio/senri_ffi';

// 分配 64 字节
const ptr = alloc(64);
ptr.writeInt32(0, 42);
console.log(ptr.readInt32(0)); // 42

// 释放
free(ptr);
```

## 异步调用

```ts
import { Library, types } from '@tt23xrstudio/senri_ffi';

const lib = Library.load('libc.so.6');
const sleep = lib.funcAsync('sleep', types.uint32, [types.uint32]);
await sleep(2); // 不阻塞主线程
await lib.closeAsync();
```

## 运行时确认

你可以通过以下代码确认当前使用的运行时：

```ts
// KossJS
typeof globalThis._senri_ffi !== 'undefined' && globalThis._senri_ffi

// Bun
typeof Bun !== 'undefined' && Bun.FFI

// Deno
typeof Deno !== 'undefined' && Deno.dlopen

// Node.js
typeof process !== 'undefined' && process.versions && process.versions.node
```

SenRi FFI 会在模块加载时自动检测并选择正确的后端。

---

**下一步**:
- [运行时检测详解](/zh/guide/runtime-detection) - 了解自动检测机制
- [API 概览](/zh/api/API-overview) - 浏览所有 API
- [Library 详解](/zh/api/library) - 深入了解库加载和函数绑定
