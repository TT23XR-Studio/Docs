# 错误处理（JavaScript）

SenRi FFI 定义了两个错误类用于统一错误处理。

## 导入

```ts
import { FFIError, FFITypeError, FFIBackendError } from '@tt23xrstudio/senri_ffi';
```

## 错误类型

### `FFIError`

通用 FFI 错误，基类。继承自 `Error`。

```ts
class FFIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FFIError';
  }
}
```

### `FFITypeError`

类型相关错误，继承自 `FFIError`。

```ts
class FFITypeError extends FFIError {
  constructor(message: string) {
    super(message);
    this.name = 'FFITypeError';
  }
}
```

### `FFIBackendError`

自定义后端相关错误，继承自 `FFIError`。在自定义后端初始化、验证或运行阶段抛出。

```ts
class FFIBackendError extends FFIError {
  constructor(message: string) {
    super(message);
    this.name = 'FFIBackendError';
  }
}
```

---

## 各模块抛出的错误

### Library

| 场景 | 错误类型 | 消息 |
|------|---------|------|
| 适配器未初始化 | `FFIError` | `'Adapter not initialized'` |
| 加载库失败 | `FFIError` | `'Failed to load library "{path}": {reason}'` |
| 库已关闭后绑定函数 | `FFIError` | `'Library is closed'` |
| 绑定函数失败 | `FFIError` | `'Failed to bind function "{name}": {reason}'` |

### callback

| 场景 | 错误类型 | 消息 |
|------|---------|------|
| 适配器未初始化 | `FFIError` | `'Adapter not initialized'` |
| 参数不是函数 | `FFIError` | `'callback requires a function'` |
| 创建回调失败 | `FFIError` | `'Failed to create callback: {reason}'` |

### 内存管理

| 场景 | 错误类型 | 消息 |
|------|---------|------|
| 适配器未初始化 | `FFIError` | `'Adapter not initialized'` |
| alloc size 无效 | `FFIError` | `'alloc requires a positive size'` |
| addressOf 参数无效 | `FFIError` | `'addressOf requires ArrayBuffer or TypedArray'` |

### Pointer

| 场景 | 错误类型 | 消息 |
|------|---------|------|
| 读取无缓冲区指针 | `FFIError` | `'Cannot read from this pointer: no backing buffer'` |
| 写入无缓冲区指针 | `FFIError` | `'Cannot write to this pointer: no backing buffer'` |

### 适配器

| 场景 | 错误类型 | 消息 |
|------|---------|------|
| KossJS: `_senri_ffi` 不可用 | `FFIError` | `'_senri_ffi not found in global scope'` |
| Bun: `Bun.FFI` 不可用 | `FFIError` | `'Bun.FFI not available'` |
| Deno: `Deno.dlopen` 不可用 | `FFIError` | `'Deno.dlopen not available'` |
| Node.js: koffi 未安装 | `FFIError` | `'koffi is required for Node.js FFI. Install with: npm install koffi'` |
| 未知类型 | `FFIError` | `'Unknown type: {type}'` |
| 不支持的语言/运行时 | `Error` | `'Unsupported JavaScript runtime: expected KossJS, Bun (>=1.3), Deno (>=2.0), or Node.js (>=18)'` |

### 类型系统

| 场景 | 错误类型 | 消息 |
|------|---------|------|
| 未知类型描述符 | `Error` | `'Unknown type descriptor: {json}'` |
| 符号未找到 | `FFIError` | `'Symbol not found: {name}'` |
| 无效库句柄 | `FFIError` | `'Invalid library handle'` |

### 自定义后端

| 场景 | 错误类型 | 消息 |
|------|---------|------|
| backend 参数类型无效 | `FFITypeError` | `'Invalid backend: expected a LibraryLike object or a constructor, got {type}'` |
| 后端缺失强制方法 | `FFITypeError` | `'Invalid backend: missing mandatory methods: alloc, free, ...'` |
| 烟雾测试返回值不符 | `FFITypeError` | `'Smoke test failed: alloc(1) returned object with invalid __ptr'` |
| 后端 init 抛出异常 | `FFIError` | `'Custom backend init failed: {reason}'` |
| 后端 bind 抛出异常 | `FFIError` | `'Failed to bind function "{name}": {reason}'` |
| 切换适配器有活跃资源 | `FFIError` | `'Cannot switch FFI backend: there are N active memory allocation(s) and M active callback(s)...'` |
| Library 实例过期（适配器已被替换） | `FFIError` | `'Library instance has expired: the global FFI backend has been replaced...'` |

---

## 使用示例

```ts
import { Library, types, FFIError } from '@tt23xrstudio/senri_ffi';

try {
  const lib = Library.load('nonexistent.so');
} catch (e) {
  if (e instanceof FFIError) {
    console.error('FFI 错误:', e.message);
  } else {
    console.error('未知错误:', e);
  }
}
```

```ts
import { alloc, FFIError } from '@tt23xrstudio/senri_ffi';

try {
  const mem = alloc(-1); // 无效大小
} catch (e) {
  console.error(e.message); // "alloc requires a positive size"
}
```
