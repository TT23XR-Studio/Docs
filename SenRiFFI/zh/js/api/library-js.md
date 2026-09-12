# Library（JavaScript）

`Library` 类用于加载原生共享库，是 SenRi FFI 的入口。加载后可通过 `func()`、`funcAsync()` 等方法绑定 C 函数。

## 导入

```ts
import { Library } from '@tt23xrstudio/senri_ffi';
```

---

## `Library.load(path, backend?)` — 加载共享库

加载指定路径的原生共享库，返回一个 `Library` 实例。

```ts
// 使用内置语言/运行时检测（默认）
const lib = Library.load(
  process.platform === 'win32' ? 'user32.dll' : 'libm.so.6'
);

// 使用自定义后端
const lib2 = Library.load('/path/to/lib.so', myCustomBackend);
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `path` | `string` | 共享库的文件路径。Windows: `.dll`、Linux: `.so`、macOS: `.dylib` |
| `backend` | `LibraryLike \| { new (path: string): LibraryLike }` | 可选。自定义 FFI 后端实现 |

`backend` 参数支持两种形式：

- **对象实例** — 直接传入实现了 `LibraryLike` 接口的对象
- **构造函数** — 传入一个类，调用 `new Backend(path)` 构造实例

不传 `backend` 时，SenRi 使用内置语言/运行时自动检测（KossJS → Bun → Deno → Node.js）。

### 返回值

`Library` 实例。

### 各语言/运行时实现（使用内置后端时）

| 运行时 | 实现 |
|--------|------|
| KossJS | `_senri_ffi.open(path)` |
| Bun | `Bun.FFI.dlopen(path, {})` |
| Deno | `Deno.dlopen(path, {})` |
| Node.js | `koffi.load(path)` |

### 错误处理

加载失败时抛出 `FFIError`:

```ts
try {
  const lib = Library.load('/path/to/nonexistent.so');
} catch (e) {
  console.error(e.message); // "Failed to load library..."
}
```

### 使用自定义后端

```ts
import { Library, types, LibraryLike } from '@tt23xrstudio/senri_ffi';

const myBackend: LibraryLike = {
  open(path) { return /* ... */ },
  bind(handle, name, retType, argTypes) { return (...args) => /* ... */ },
  close(handle) { /* ... */ },
  alloc(size) { return { __ptr: 0n, __buf: new ArrayBuffer(size), __size: size }; },
  free(ptr) { ptr.__buf = null; },
  addressOf(buffer) { return 0n; },
  registerCallback(func, retType, argTypes) { return { __ptr: 0n, __cb: {} }; },
  unregisterCallback(ptr) { /* ... */ },
  getErrno() { return 0; },
  getStrerror(errno) { return ''; },
};

const lib = Library.load('/path/to/lib.so', myBackend);
```

详见 [自定义后端](/zh/api/custom-backend)。

---

**下一步**:
- [func() — 同步函数绑定](/zh/api/func)
- [funcAsync() — 异步函数绑定](/zh/api/funcAsync)
- [close() — 同步关闭库](/zh/api/close)
- [closeAsync() — 异步关闭库](/zh/api/closeAsync)
- [自定义后端 — 注入自定义 FFI 实现](/zh/api/custom-backend)
