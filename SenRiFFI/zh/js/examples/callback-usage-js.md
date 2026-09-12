# 回调用法示例（JavaScript）

本页展示如何使用 SenRi FFI 创建 C 回调函数。

---

## 1. 基本回调创建

```ts
import { callback, types } from '@tt23xrstudio/senri_ffi';

// 创建回调：int32 (int32, int32)
const add = callback(
  types.int32,
  [types.int32, types.int32],
  (a, b) => a + b
);

// add 是一个 Pointer 实例
console.log(add.address); // 回调函数的地址
```

---

## 2. 传递给 C 函数 — qsort 排序

```ts
import { Library, callback, types, alloc, pointer } from '@tt23xrstudio/senri_ffi';

const libc = Library.load(
  process.platform === 'win32' ? 'msvcrt.dll' : 'libc.so.6'
);

// qsort 比较回调：int compare(const void*, const void*)
const compare = callback(
  types.int32,
  [pointer(types.int32), pointer(types.int32)],
  (a, b) => {
    const va = a.readInt32(0);
    const vb = b.readInt32(0);
    return va - vb;
  }
);

// 准备未排序的数组
const arr = alloc(20); // 5 个 int32
arr.writeInt32(0, 42);
arr.writeInt32(4, 7);
arr.writeInt32(8, 99);
arr.writeInt32(12, 1);
arr.writeInt32(16, 33);

// 绑定 qsort
const qsort = libc.func('qsort', types.void, [
  types.pointer, // void* base
  types.uint64,  // size_t count
  types.uint64,  // size_t size
  types.pointer, // 比较函数指针
]);

// 调用 qsort（传入回调地址）
qsort(arr.address, 5, 4, compare.address);

// 验证排序结果
console.log(arr.readInt32(0));  // 1
console.log(arr.readInt32(4));  // 7
console.log(arr.readInt32(8));  // 33
console.log(arr.readInt32(12)); // 42
console.log(arr.readInt32(16)); // 99

libc.close();
```

---

## 3. 事件/通知回调

```ts
import { callback, types, Library } from '@tt23xrstudio/senri_ffi';

// 模拟注册一个事件库
const lib = Library.load('my_event_lib.so');

// 回调: void onEvent(int32 eventType, const char* message)
const eventHandler = callback(
  types.void,
  [types.int32, types.cstring],
  (eventType, message) => {
    console.log(`[事件 ${eventType}]: ${message}`);
  }
);

// 注册回调到 C 库
const register = lib.func('register_callback', types.void, [types.pointer]);
register(eventHandler.address);

// 保持引用防止 GC
globalThis.__eventHandler = eventHandler;

// 稍后取消注册...
// const unregister = lib.func('unregister_callback', types.void, []);
// unregister();

lib.close();
```

---

## 4. 回调链

```ts
import { callback, types, alloc } from '@tt23xrstudio/senri_ffi';

// 创建多个回调
const cb1 = callback(
  types.int32,
  [types.int32],
  (x) => { console.log('cb1:', x); return x + 1; }
);

const cb2 = callback(
  types.int32,
  [types.int32],
  (x) => { console.log('cb2:', x); return x * 2; }
);

// 在内存中构建回调指针数组
const callbackArray = alloc(16); // 两个指针
callbackArray.writePointer(0, cb1);
callbackArray.writePointer(8, cb2);

// callbackArray 可以传给接受函数指针数组的 C 函数
```

---

## 5. 保持回调存活 — GC 注意事项

```ts
import { callback, types } from '@tt23xrstudio/senri_ffi';

// SenRi FFI 使用 FinalizationRegistry 自动释放回调
// 如果你的回调需要长期存活，必须保持 JavaScript 引用

// 方式一：全局变量
globalThis._persistentCb = callback(
  types.int32,
  [types.int32, types.int32],
  (a, b) => a * b
);

// 方式二：模块级变量
let _timerCallback: any = null;

function startTimer(intervalMs: number) {
  _timerCallback = callback(
    types.void,
    [types.pointer],
    (data) => {
      console.log('Timer tick');
    }
  );
  // 注册到 C 定时器库...
}

function stopTimer() {
  _timerCallback = null; // 允许 GC 回收
}
```

---

## 6. 错误处理

```ts
import { callback, types, FFIError } from '@tt23xrstudio/senri_ffi';

try {
  // 正确的回调创建
  const cb = callback(
    types.int32,
    [types.int32, types.int32],
    (a, b) => a + b
  );
  console.log('回调创建成功');
} catch (e) {
  if (e instanceof FFIError) {
    console.error('创建回调失败:', e.message);
  }
}

try {
  // 错误：传入非函数
  // @ts-expect-error
  callback(types.void, [], 'not a function');
} catch (e) {
  if (e instanceof FFIError) {
    console.error(e.message); // "callback requires a function"
  }
}

// 适配器未初始化的情况（在模块加载前手动调用 callback）
// 正常情况下不会发生，因为 index.ts 会自动初始化
```
