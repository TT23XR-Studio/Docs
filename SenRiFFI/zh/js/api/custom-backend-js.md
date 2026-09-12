# 自定义后端（JavaScript）

允许用户注入完全自定义的 FFI 后端实现，替换 SenRi 内置的语言/运行时自动检测机制。

## 概述

默认情况下 SenRi FFI 自动检测当前语言/运行时（KossJS / Bun / Deno / Node.js）并选用对应的内置适配器。但某些场景下你可能需要：

- 使用不同于内置支持的 FFI 引擎（如 `ffi-napi`、`fflate` 等）
- 在不受支持的语言/运行时上使用 SenRi 的上层 API
- 对底层 FFI 调用进行拦截、日志或 mock 测试
- 需要特殊的内存管理或回调处理逻辑

自定义后端功能允许你实现 `LibraryLike` 接口，SenRi 通过适配器包装器将其接入现有架构。**你负责底层 FFI 引擎的所有细节（加载、绑定、内存分配、回调、错误信息），SenRi 继续提供上层统一 API（类型系统、Pointer、struct、alloc/free 等）**。

## 导入

```ts
import {
  type LibraryLike,
  type PartialLibraryLike,
  isLibraryLike,
  getMissingMethods,
  createBackendWithFallback,
  FFIBackendError,
} from '@tt23xrstudio/senri_ffi';
```

## LibraryLike 接口

```ts
interface LibraryLike {
  // ---------- 生命周期钩子（可选） ----------
  init?(): void;
  destroy?(): void;

  // ---------- 库操作（强制） ----------
  open(path: string): any;
  bind(handle: any, name: string, retType: NormalizedType, argTypes: NormalizedType[]): Function;
  close(handle: any): void;

  // ---------- 内存管理（强制） ----------
  alloc(size: number): { __ptr: bigint; __buf: any; __size: number; };
  free(ptr: any): void;
  addressOf(buffer: ArrayBuffer | ArrayBufferView): bigint;

  // ---------- 回调管理（强制） ----------
  registerCallback(func: Function, retType: NormalizedType, argTypes: NormalizedType[]): { __ptr: bigint; __cb: any; };
  unregisterCallback(ptr: any): void;

  // ---------- 错误信息（强制） ----------
  getErrno(): number;
  getStrerror(errno: number): string;

  // ---------- 异步绑定（可选） ----------
  bindAsync?(handle: any, name: string, retType: NormalizedType, argTypes: NormalizedType[]): (...args: any[]) => Promise<any>;
}
```

### 方法说明

#### 生命周期钩子（可选）

| 方法 | 说明 |
|------|------|
| `init()` | 后端初始化函数。在包装器构造时调用一次。适合用于初始化线程池、全局驱动等。若抛出异常，`Library.load` 将抛出 `FFIError` 中止加载 |
| `destroy()` | 后端销毁函数。在全局适配器被替换前调用。必须为同步操作，不可抛出异常 |

#### 库操作（强制）

| 方法 | 说明 |
|------|------|
| `open(path)` | 打开动态库。返回不透明句柄（任意类型），后续原样传给 `bind`/`close` |
| `bind(handle, name, retType, argTypes)` | 绑定同步 C 函数。返回可调用的 JavaScript 函数 |
| `close(handle)` | 关闭库释放资源。静默处理，不可抛出异常 |

其中 `retType` 和 `argTypes` 的参数类型为标准化后的 `NormalizedType`，你无需关心 SenRi 内部类型映射——直接接收标准类型描述即可。

#### 内存管理（强制）

| 方法 | 说明 |
|------|------|
| `alloc(size)` | 分配原生内存。返回对象必须包含 `__ptr`（bigint）、`__buf`（任何）、`__size`（number） |
| `free(ptr)` | 释放由 `alloc` 分配的内存。静默处理，不可抛出异常 |
| `addressOf(buffer)` | 获取 ArrayBuffer 或 TypedArray 的原生起始地址，返回 bigint |

`__buf` 必须能被 `new DataView()` 接受（即 `ArrayBuffer`、Node.js 的 `Buffer` 或 `Uint8Array` 等），因为 `Pointer` 类的读写操作依赖它。

#### 回调管理（强制）

| 方法 | 说明 |
|------|------|
| `registerCallback(func, retType, argTypes)` | 将 JS 函数注册为 C 回调。返回对象必须包含 `__ptr`（bigint 函数指针地址）和 `__cb`（引擎侧回调句柄） |
| `unregisterCallback(ptr)` | 释放先前注册的回调。静默处理，不可抛出异常 |

#### 错误信息（强制）

| 方法 | 说明 |
|------|------|
| `getErrno()` | 获取最后一次系统调用的错误码。返回 number |
| `getStrerror(errno)` | 根据错误码获取可读的错误描述字符串 |

#### 异步绑定（可选）

| 方法 | 说明 |
|------|------|
| `bindAsync(handle, name, retType, argTypes)` | 绑定异步 C 函数（非阻塞），返回 Promise 风格的函数。若未实现，`funcAsync` 自动降级为同步包装 |

## 类型守卫

### `isLibraryLike(obj)`

检查对象是否实现了 `LibraryLike` 接口的所有强制方法。

```ts
if (isLibraryLike(myBackend)) {
  // 可以安全地传入 Library.load()
}
```

### `getMissingMethods(obj)`

返回缺失的强制方法名列表（全部实现则返回空数组）。

```ts
const missing = getMissingMethods(myBackend);
if (missing.length > 0) {
  console.error('缺失方法:', missing.join(', '));
}
```

## 部分实现回退

### `PartialLibraryLike`

允许用户只实现部分方法，其余回退到内置适配器。

```ts
type PartialLibraryLike = Partial<LibraryLike>;
```

### `createBackendWithFallback(partial, builtinAdapter)`

用部分实现 + 内置适配器创建完整后端。

```ts
const backend = createBackendWithFallback(
  {
    open(path) { return myOpen(path); },
    bind(handle, name, retType, argTypes) { return myBind(handle, name); },
    close(handle) { myClose(handle); },
    // alloc/free/addressOf/registerCallback/... 回退到内置适配器
  },
  getGlobalAdapter() // 当前内置适配器
);
```

返回的对象满足 `LibraryLike` 接口，每个方法优先调用 `partial` 中对应实现，若未提供则调用内置适配器的对应方法。

## Library.load 使用自定义后端

### 签名

```ts
Library.load(path: string, backend?: LibraryLike | { new (path: string): LibraryLike }): Library
```

- `path` — 共享库文件路径
- `backend` — 可选。不传时使用内置语言/运行时检测

### 传入对象实例

```ts
const myBackend: LibraryLike = {
  open(path) {
    return myffi.load(path);
  },
  bind(handle, name, retType, argTypes) {
    return (...args: any[]) => myffi.call(handle, name, args);
  },
  close(handle) {
    myffi.unload(handle);
  },
  alloc(size) {
    const buf = new ArrayBuffer(size);
    return { __ptr: myffi.addressOf(buf), __buf: buf, __size: size };
  },
  free(ptr) {
    ptr.__buf = null;
  },
  addressOf(buffer) {
    return myffi.addressOf(buffer);
  },
  registerCallback(func, retType, argTypes) {
    return myffi.createCallback(func, retType, argTypes);
  },
  unregisterCallback(ptr) {
    myffi.releaseCallback(ptr);
  },
  getErrno() {
    return 0;
  },
  getStrerror(errno) {
    return 'Error: ' + errno;
  },
};

const lib = Library.load('/path/to/lib.so', myBackend);
const abs = lib.func('abs', types.int32, [types.int32]);
console.log(abs(-42)); // 42
lib.close();
```

### 传入构造函数

```ts
class MyFFI {
  open(path: string) { return myffi.load(path); }
  bind(handle: any, name: string, retType: NormalizedType, argTypes: NormalizedType[]) {
    return (...args: any[]) => myffi.call(handle, name, args);
  }
  close(handle: any) { myffi.unload(handle); }
  alloc(size: number) {
    const buf = new ArrayBuffer(size);
    return { __ptr: myffi.addressOf(buf), __buf: buf, __size: size };
  }
  free(ptr: any) { ptr.__buf = null; }
  addressOf(buffer: ArrayBuffer | ArrayBufferView) { return myffi.addressOf(buffer); }
  registerCallback(func: Function, retType: NormalizedType, argTypes: NormalizedType[]) {
    return myffi.createCallback(func, retType, argTypes);
  }
  unregisterCallback(ptr: any) { myffi.releaseCallback(ptr); }
  getErrno() { return 0; }
  getStrerror(errno: number) { return 'Error: ' + errno; }
}

const lib = Library.load('/path/to/lib.so', MyFFI);
```

构造函数会在调用时接收 `path` 参数：`new MyFFI(path)`。

## 异步绑定

### 实现 bindAsync

若你的后端引擎支持真正的非阻塞 FFI 调用，可以实现 `bindAsync` 方法：

```ts
const backend: LibraryLike = {
  // ... 其他强制方法 ...
  bindAsync(handle, name, retType, argTypes) {
    return async (...args: any[]) => {
      // 真正的异步 FFI 调用
      return await myffi.callAsync(handle, name, args);
    };
  },
};

const lib = Library.load('/path/to/lib.so', backend);
const result = await lib.funcAsync('heavy_work', types.int32, [types.int32])(42);
```

### 自动降级

若未提供 `bindAsync`，`funcAsync` 自动降级为同步包装（返回 Promise.resolve(syncFn(...args))），并输出一次警告：

```text
[SenRi FFI] funcAsync("add") fallback to synchronous call: the custom backend
does not support bindAsync. The underlying C function MUST be thread-safe.
To suppress: set SENRI_FFI_QUIET=1
```

降级后的函数附带 `_isSyncFallback = true` 属性，可供程序检测：

```ts
const asyncFn = lib.funcAsync('add', types.int32, [types.int32]);
if ((asyncFn as any)._isSyncFallback) {
  console.log('注意：当前为同步降级模式');
}
```

## 烟雾测试

`Library.load` 在加载自定义后端时会自动执行烟雾测试：

1. 调用 `alloc(1)` 验证返回值包含 `__ptr`（bigint）、`__buf`（非空）、`__size`（number）
2. 调用 `free` 释放
3. 调用 `getErrno()` 验证返回类型为 `number`

任何验证失败均抛出 `FFITypeError`。

可通过环境变量跳过烟雾测试：

```bash
SENRI_FFI_SKIP_SMOKE_TEST=1 node app.js
```

## 安全切换机制

### 版本戳（僵尸句柄防御）

每次切换全局适配器时，内部版本号递增。`Library` 实例在创建时记录当前版本号，每次调用 `func()` / `funcAsync()` 时比对全局版本。若不一致，立即抛出 `FFIError`：

```text
Library instance has expired: the global FFI backend has been replaced.
Please reload the library via Library.load().
```

这避免了因全局适配器被替换后，旧 `Library` 实例调用已销毁后端的崩溃。

### 资源注册表

SenRi 内部维护一个资源注册表，追踪所有通过当前适配器分配的**内存块**和**回调**：

- `alloc()` 成功时注册，`free()` 时注销
- `registerCallback()` 成功时注册，`unregisterCallback()` 时注销

切换适配器时，若注册表中仍有活跃资源，默认抛出 `FFIError`：

```text
Cannot switch FFI backend: there are 2 active memory allocation(s)
and 1 active callback(s). Free all resources before switching...
```

可通过 `setGlobalAdapter(adapter, true)` 强制切换（风险自负）。

### 回调同步清理

切换适配器前，框架会同步遍历资源注册表中的所有回调，调用其对应的 `unregisterCallback` 释放 C 层回调资源，再将它们从注册表中移除。`FinalizationRegistry` 的 GC 清理作为最后的防线——使用存储在回调描述符上的闭包而非全局适配器引用，避免因适配器已切换导致的释放错配。

## 完整示例

以下是一个使用 `ffi-napi` 作为后端的完整示例：

```ts
import { Library, types, LibraryLike, isLibraryLike } from '@tt23xrstudio/senri_ffi';
import ffi from 'ffi-napi';
import ref from 'ref-napi';

const myBackend: LibraryLike = {
  open(path: string) {
    const lib = ffi.Library(path, {});
    return lib;
  },

  bind(handle: any, name: string, _retType: any, _argTypes: any[]) {
    // 实际使用中需要将 retType/argTypes 映射为 ffi-napi 的 types
    // 此处仅为简化示意
    return (...args: any[]) => {
      const fn = handle[name];
      if (typeof fn === 'function') return fn(...args);
      throw new Error('Symbol not found: ' + name);
    };
  },

  close(handle: any) {
    // ffi-napi 不提供显式关闭
  },

  alloc(size: number) {
    const buf = Buffer.alloc(size);
    return { __ptr: BigInt(ref.address(buf)), __buf: buf, __size: size };
  },

  free(ptr: any) {
    ptr.__buf = null;
  },

  addressOf(buffer: ArrayBuffer | ArrayBufferView) {
    return BigInt(ref.address(buffer));
  },

  registerCallback(func: Function, _retType: any, _argTypes: any[]) {
    const cb = ffi.Callback('void', ['void'], func);
    return { __ptr: BigInt(ref.address(cb)), __cb: cb };
  },

  unregisterCallback(ptr: any) {
    ptr.__cb = null;
  },

  getErrno() { return 0; },
  getStrerror(errno: number) { return 'Error: ' + errno; },
};

console.log(isLibraryLike(myBackend)); // true

const lib = Library.load('libc.so.6', myBackend);
const abs = lib.func('abs', types.int32, [types.int32]);
console.log(abs(-42)); // 42
lib.close();
```

## 错误处理

| 场景 | 错误类型 | 说明 |
|------|---------|------|
| 传入的 backend 非对象 | `FFITypeError` | `Invalid backend: expected a LibraryLike object or a constructor` |
| 后端缺少强制方法 | `FFITypeError` | `Invalid backend: missing mandatory methods: alloc, free, ...` |
| 烟雾测试失败 | `FFITypeError` | `Smoke test failed: alloc(1) returned object with invalid __ptr` |
| 后端 init 抛出异常 | `FFIError` | `Custom backend init failed: 原始错误信息` |
| 后端 bind 抛出异常 | `FFIError` | `Failed to bind function "xxx": 原始错误信息` |
| 切换适配器有活跃资源 | `FFIError` | `Cannot switch FFI backend: there are N active...` |
| Library 实例过期 | `FFIError` | `Library instance has expired: the global FFI backend has been replaced` |
