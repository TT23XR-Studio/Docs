# func — 同步函数绑定（JavaScript）

`lib.func(name, retType, argTypes, options?)` 绑定一个 C 函数，返回可调用的 JavaScript 函数。结果会被缓存，对同一签名重复调用返回相同的函数对象。

## 语法

```ts
const fn = lib.func(symbolName, returnType, [argTypes], options?);
const result = fn(...args);
```

### 参数

| 参数 | 类型 | 必须 | 说明 |
|------|------|------|------|
| `symbolName` | `string` | 是 | C 函数名称 |
| `returnType` | 类型描述符 | 是 | 返回值类型 |
| `argTypes` | 类型描述符数组 | 是 | 参数类型列表 |
| `options` | `object?` | 否 | 可选配置（调用约定等） |

### 返回值

返回一个 JavaScript 函数。调用该函数时：

1. JS 参数按类型转换为 C 字节表示
2. 通过语言/运行时底层 FFI 调用原生 C 函数
3. 返回值按类型转换为 JS 值

## 缓存机制

内部使用 `Map<string, Function>` 缓存已绑定的函数。类型描述符先通过 `normalizeType()` 标准化为 `NormalizedType`，再用 `serializeType()` 生成稳定的字符串键：

```
缓存键示例: add_int|p:int32|p:int32,p:int32
```

这解决了旧版 `JSON.stringify` 对象属性顺序不稳定的问题。

```ts
// 对相同签名，第二次调用直接返回缓存
const fn1 = lib.func('abs', types.int32, [types.int32]);
const fn2 = lib.func('abs', types.int32, [types.int32]);
console.log(fn1 === fn2); // true

// 不同签名有不同缓存
const fn3 = lib.func('abs', types.float64, [types.float64]);
console.log(fn1 === fn3); // false
```

## 类型标准化

传入的类型描述符会经过 `normalizeType()` 标准化：

```ts
// 用户传入
types.int32                              // → 'int32' 字符串
pointer(types.uint8)                     // → { __senri_type: 'pointer', ... }
array(types.float64, 10)                 // → { __senri_type: 'array', ... }
struct({ x: types.int32, y: types.int32 })  // → struct class

// 标准化后 → NormalizedType
{ kind: 'primitive', name: 'int32' }
{ kind: 'pointer', of: { kind: 'primitive', name: 'uint8' } }
{ kind: 'array', of: { ... }, length: 10 }
{ kind: 'struct', fields: { ... }, size: 8, align: 4 }
```

标准化后的 `NormalizedType` 被传给各语言/运行时适配器，由适配器内部的 `mapType()` 映射为语言/运行时原生类型。

## 使用示例

### 基本类型

```ts
import { Library, types } from '@tt23xrstudio/senri_ffi';

const lib = Library.load('libm.so.6');

const abs = lib.func('abs', types.int32, [types.int32]);
console.log(abs(-42)); // 42

const sqrt = lib.func('sqrt', types.float64, [types.float64]);
console.log(sqrt(25.0)); // 5.0
```

### 指针和字符串

```ts
const libc = Library.load('libc.so.6');

const strlen = libc.func('strlen', types.int32, [types.cstring]);
console.log(strlen('hello')); // 5

const memset = libc.func('memset', types.pointer, [
  types.pointer, types.int32, types.uint32
]);
const buf = alloc(64);
memset(buf, 0, 64);
```

### 调用约定选项（KossJS / Bun）

```ts
const MessageBoxW = lib.func('MessageBoxW', types.int32, [
  types.pointer, types.pointer, types.pointer, types.uint32
], {
  callingConvention: 'stdcall',
});
```

## 错误处理

| 场景 | 错误 |
|------|------|
| 库已关闭 | `FFIError: Library is closed` |
| 符号未找到 | `FFIError: Failed to bind function "xxx"` |
| 适配器未初始化 | `FFIError: Adapter not initialized` |
| 参数数量不匹配 | 语言/运行时错误（各语言/运行时行为不同） |

---

**相关文档**:
- [funcAsync() — 异步函数绑定](/zh/api/funcAsync)
- [Library.load()](/zh/api/library)
- [close() — 同步关闭库](/zh/api/close)
