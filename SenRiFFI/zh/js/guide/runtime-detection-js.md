# 运行时检测（JavaScript）

SenRi FFI 在模块首次加载时自动检测当前 JavaScript 运行时，并选择相应的 FFI 适配器。

## 检测逻辑

检测代码位于 `src/index.ts`，核心逻辑如下：

```ts
function detectRuntime(): any {
  // 1. 优先检测 KossJS
  if (typeof globalThis._senri_ffi !== 'undefined' && globalThis._senri_ffi) {
    return new KossJSAdapter();
  }
  // 2. 其次检测 Bun
  if (typeof Bun !== 'undefined' && Bun.FFI) {
    return new BunAdapter();
  }
  // 3. 检测 Deno
  if (typeof Deno !== 'undefined' && Deno.dlopen) {
    return new DenoAdapter();
  }
  // 4. 最后检测 Node.js
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    return new NodeAdapter();
  }
  throw new Error('Unsupported JavaScript runtime: expected KossJS, Bun (>=1.3), Deno (>=2.0), or Node.js (>=18)');
}
```

## 检测顺序

### 1. KossJS（最高优先级）

- **检测条件**：`globalThis._senri_ffi` 存在且为真值
- **适配器类**：`KossJSAdapter`
- **异步 FFI**：原生支持（真实系统线程 + libffi）

### 2. Bun

- **检测条件**：`Bun` 全局变量存在且 `Bun.FFI` 可用（v1.3+）
- **适配器类**：`BunAdapter`

### 3. Deno

- **检测条件**：`Deno` 全局变量存在且 `Deno.dlopen` 可用
- **适配器类**：`DenoAdapter`
- **异步 FFI**：原生支持（`nonblocking: true`）

### 4. Node.js

- **检测条件**：`process.versions.node` 存在
- **适配器类**：`NodeAdapter`

## 类型映射对照表

| 统一类型 | KossJS | Bun | Deno | Node.js (koffi v3) |
|---------|--------|-----|------|-------------------|
| `int32` | `int32` | `i32` | `i32` | `'int32'` |
| `float64` | `float64` | `f64` | `f64` | `'float64'` |
| `pointer` | `pointer` | `ptr` | `pointer` | `'void *'` |
| `cstring` | `cstring` | `cstring` | `buffer` | `'string'` |

---

**下一步**:
- [API 概览](/zh/api/API-overview) - 浏览所有可用 API
- [什么是 SenRi FFI](/zh/guide/what-is-senri-ffi) - 了解项目背景
