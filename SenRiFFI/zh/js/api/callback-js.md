# callback（JavaScript）

`callback()` 函数将 JavaScript 函数封装为 C 函数指针，可以传递给 C 库作为回调。

## 导入

```ts
import { callback, types } from '@tt23xrstudio/senri_ffi';
```

## 签名

```ts
function callback(
  retType: any,       // 返回值类型
  argTypes: any[],    // 参数类型列表
  jsFn: Function,     // JavaScript 回调函数
  options?: any       // 可选配置（语言/运行时特定）
): Pointer
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `retType` | 类型描述符 | 回调的返回值类型 |
| `argTypes` | 类型描述符数组 | 回调的参数类型列表 |
| `jsFn` | `Function` | JavaScript 函数 |
| `options` | `object?` | 可选配置（语言/运行时特定） |

### 返回值

返回 `Pointer` 实例，其 `address` 属性指向 C 回调的函数指针。

## 自动垃圾回收

SenRi FFI 使用 `FinalizationRegistry` 自动管理回调生命周期：

```ts
const cb = callback(
  types.int32,
  [types.int32, types.int32],
  (a, b) => a + b
);

// 当 cb 被垃圾回收时，FinalizationRegistry 自动调用 adapter.unregisterCallback()
// 无需手动释放
```

**各语言/运行时实现**:

| 语言/运行时 | 回调创建 | 回调释放 |
|--------|---------|---------|
| KossJS | `_senri_ffi.createCallback(retType, argTypes, fn)` | `unregisterCallback()` via FinalizationRegistry |
| Bun | `Bun.FFI.callback({ returns, arguments }, fn)` | `unregisterCallback()` via FinalizationRegistry |
| Deno | `new Deno.UnsafeCallback(...)` | `unregisterCallback()` via FinalizationRegistry |
| Node.js | `koffi.callback(retType, argTypes, fn)` | `unregisterCallback()` via FinalizationRegistry |

## 示例

### qsort 排序

```ts
import { Library, callback, types, alloc, pointer } from '@tt23xrstudio/senri_ffi';

const libc = Library.load(
  process.platform === 'win32' ? 'msvcrt.dll' : 'libc.so.6'
);

// 定义比较回调
const compare = callback(
  types.int32,
  [pointer(types.int32), pointer(types.int32)],
  (a, b) => {
    const va = a.readInt32(0);
    const vb = b.readInt32(0);
    return va - vb;
  }
);

// 准备数据
const arr = alloc(16);
arr.writeInt32(0, 3);
arr.writeInt32(4, 1);
arr.writeInt32(8, 4);
arr.writeInt32(12, 2);

// 调用 qsort
const qsort = libc.func('qsort', types.void, [
  types.pointer, types.uint64, types.uint64, types.pointer
]);

qsort(arr.address, 4, 4, compare.address);

// 读取排序结果
console.log(arr.readInt32(0));  // 1
console.log(arr.readInt32(4));  // 2
console.log(arr.readInt32(8));  // 3
console.log(arr.readInt32(12)); // 4

libc.close();
```

### 事件回调

```ts
import { callback, types, Library } from '@tt23xrstudio/senri_ffi';

const lib = Library.load('my_event_lib.so');

// 创建事件处理回调
const handler = callback(
  types.void,
  [types.int32, types.cstring],
  (eventId, message) => {
    console.log(`事件 ${eventId}: ${message}`);
  }
);

// 注册回调到 C 库
const register = lib.func('register_handler', types.void, [types.pointer]);
register(handler.address);

// 保持引用防止 GC
globalThis._myHandler = handler;
```

## 注意事项

### 保持引用

由于 `FinalizationRegistry` 会在回调对象被垃圾回收时自动释放底层 C 回调，**如果你的回调需要长期存活，务必保持对其的引用**：

```ts
// 正确：保持引用
globalThis._persistentCallback = callback(
  types.void, [types.int32],
  (x) => console.log(x)
);

// 错误：回调可能随时被 GC
someLib.registerCallback(
  callback(types.void, [types.int32], (x) => console.log(x)).address
);
```

### 错误处理

| 场景 | 错误类型 | 消息 |
|------|---------|------|
| 适配器未初始化 | `FFIError` | `'Adapter not initialized'` |
| `jsFn` 不是函数 | `FFIError` | `'callback requires a function'` |

### 回调中的异常

JavaScript 回调函数中抛出的异常由各语言/运行时处理，行为可能不同。建议在回调中自行捕获异常。
