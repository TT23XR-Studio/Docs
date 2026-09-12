# 回调函数 (`createCallback` / 异步回调)

回调函数允许将 JS 函数**转为 C 函数指针**，使 C 代码能够"回叫" JavaScript 层。这是实现事件处理器、比较器、迭代器等模式的必要机制。

---

## `_senri_ffi.createCallback(retType, [argTypes], jsFunc)` → `Pointer`

**同步创建**一个回调函数指针（适用于**同步** `func()` 绑定）。

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `retType` | `string\|Object` | 回调返回值类型 |
| `argTypes` | `Array` | 回调参数类型数组 `[arg1Type, arg2Type, ...]` |
| `jsFunc` | `Function` | JS 回调函数 |

### 返回值

返回一个 `Pointer` 对象（其 `.address` 即为 C 函数指针地址）。

### 原理

内部使用 **libffi Closure**：将 JS 函数包装为原生可调用的 C 函数指针。

```
JS: createCallback(ret, args, jsFunc)
         │
         ▼
    libffi::Closure::new(cif, trampoline, userdata)
         │
         ▼
    C 函数指针 (CodePtr) ← 可传给任何 C 函数作为回调
         │
         ▼ (当 C 调用该指针时)
    trampoline → c_ptr_to_js(args) → jsFunc.call(ctx) → js_result_to_bytes(ret)
```

### 限制

- **仅同步模式可用**：JS 回调在当前线程（KossJS 主线程）中同步执行
- 回调函数不能跨线程传递 — 只能在 KossJS 主线程调用
- 回调函数在 `thread_local` 注册表中保持存活

### 使用示例

```javascript
const ffi = _senri_ffi;
const { int32, pointer, uint64 } = ffi.types;

const libc = ffi.open('libc.so.6');

// 创建比较回调
const compare = ffi.createCallback(
  int32,                              // 返回值: int
  [pointer, pointer],                 // 参数: (const void*, const void*)
  (aPtr, bPtr) => {
    // 注意：aPtr 和 bPtr 是数值地址，不是 JS 字符串
    // 需要使用 Pointer 操作读取实际数据
    return aPtr - bPtr;
  }
);
// compare 是一个 Pointer 对象
// compare.address 是 C 函数指针地址

// 绑定 qsort，将回调传递给它
const qsort = libc.func('qsort', ffi.types.void, [
  pointer,      // void *base
  uint64,       // size_t nmemb
  uint64,       // size_t size
  ffi.callback(int32, [pointer, pointer])  // 回调类型
]);

// 准备数据
const buf = ffi.alloc(40);
for (let i = 0; i < 10; i++) {
  buf.writeInt32(i * 4, 10 - i);
}

// 调用 qsort，传入回调
qsort(buf, 10, 4, compare);

// 验证排序结果
for (let i = 0; i < 10; i++) {
  console.log(buf.readInt32(i * 4)); // 1, 2, ..., 10
}

ffi.free(buf);
libc.close();
```

---

## 异步回调 (`funcAsync` 内建支持)

**无需**单独调用 `createCallback`。当 `funcAsync()` 的参数类型中包含回调类型时，调用时直接传入 JS 函数即可。后台线程通过**通道代理**机制在主线程执行回调。

### 语法

```javascript
const fn = lib.funcAsync('some_function', retType, [
  arg1Type,
  arg2Type,
  ffi.callback(cbRetType, [cbArgTypes])
]);

// 调用时直接传入 JS 函数
await fn(arg1, arg2, (cbArg1, cbArg2) => {
  // 此函数在主线程的 process_io_results 中执行
  return result;
});
```

### 通道代理机制

```
C 线程 (调用回调时)
  │
  ├─ trampoline:
  │    ├─ 读取 C 参数值 → Vec<u8>[]
  │    ├─ callback_tx.send(CallbackRequest{
  │    │     task_id, cb_index, args, resp_tx
  │    │   })
  │    ├─ resp_rx.recv_timeout(callbackTimeout)
  │    └─ 写回返回值 → return to C
  │
  ▼ 主线程 (process_io_results)
  ├─ callback_rx.try_recv(CallbackRequest)
  ├─ 查找 js_func = ffi_callback_fns[(task_id, cb_index)]
  ├─ bytes_to_js_value(args[i]) → jsArgs
  ├─ js_func.call(undefined, jsArgs, ctx) → jsResult
  ├─ js_value_to_bytes(jsResult, retType) → response
  └─ resp_tx.send(response) → 解除 C 线程阻塞
```

### 回调参数传递

异步回调的参数通过通道**按值传递**（序列化为字节）。支持的类型：

| 类型 | 传递方式 | 限制 |
|------|---------|------|
| 基本数值 (`int8`~`float64`) | 按值复制 | 无 |
| `pointer` | 按值复制（地址值） | 指针指向的数据可能已被修改 |
| `cstring` | 按值复制（读取到 null 终止符） | 需确保指针有效 |
| 结构体/数组 | 不支持 | 返回 `undefined` |

### 回调返回值

回调通过通道返回，返回值在主线程序列化后传回 C 线程：

| 返回值 C 类型 | JS 返回值 | 转换 |
|--------------|----------|------|
| 数值类型 | `number` | JS Number → C 类型 |
| `pointer` | `number` | JS Number → usize 地址 |
| `cstring` | `string` / `null` | 编码为 C 字符串，返回其指针 |
| `void` | — | 忽略 |

### 回调超时

```javascript
const fn = lib.funcAsync('function_with_callback', ffi.types.void, [
  ffi.callback(ffi.types.int32, [ffi.types.int32])
], {
  callbackTimeout: 5000,  // 每次回调等待主线程最多 5 秒
});

await fn((n) => {
  // 处理回调
  return n * 2;
});
```

如果主线程在超时时间内未处理回调（例如主线程被长时间同步操作阻塞），**回调返回零值**，C 函数继续执行。

### 死锁风险

异步回调**要求主线程的事件循环在运行**。如果主线程被同步操作阻塞，回调将等待直到超时。

```javascript
// ❌ 危险 — 可能死锁
const fn = lib.funcAsync('work_with_callback', void, [callback(int32, [int32])]);
const promise = fn((n) => { console.log(n); return 0; });

// 主线程被阻塞 — 无法处理回调请求！
while (true) { /* heavy sync work */ }

// ...等待超时（默认 30s）...

await promise; // 超时释放，C 函数返回
```

```javascript
// ✅ 安全
const fn = lib.funcAsync('work_with_callback', void, [callback(int32, [int32])]);
const promise = fn((n) => { console.log(n); return 0; });

// 不阻塞主线程
setTimeout(() => console.log('still running'), 100);

await promise; // 事件循环在运行，回调正常处理
```

---

## 同步 vs 异步回调对比

| 特性 | `createCallback`（同步） | `funcAsync` 回调（异步） |
|------|------------------------|------------------------|
| 创建方式 | `ffi.createCallback()` | 调用时直接传入 JS 函数 |
| 适用 API | `lib.func()` | `lib.funcAsync()` |
| 执行线程 | KossJS 主线程 | C 线程触发 → 通道 → 主线程执行 |
| 性能 | 极高（无序列化） | 有序列化/反序列化开销 |
| 超时 | 无 | 可配置（默认 30s） |
| 死锁风险 | 无 | 有（主线程未运行事件循环时） |
| 跨线程指针 | 可以（同线程） | 指针地址传递，数据可能过期 |
| 生命周期 | Thread-local 注册表 | Task 级别（绑定到 async 调用） |

---

## 完整示例

### 回调作为比较函数 (qsort)

```javascript
const ffi = _senri_ffi;
const libc = ffi.open('libc.so.6');
const { int32, pointer, uint64, void: VOID } = ffi.types;

// 同步回调
const comparSync = ffi.createCallback(int32, [pointer, pointer],
  (aPtr, bPtr) => {
    const a = new Uint32Array(new Uint8Array([
      ...(new Array(4).fill(0).map((_, i) =>
        Number((aPtr + BigInt(i)) & 0xFFn))
      )
    ]).buffer)[0];
    return aPtr - bPtr;
  }
);

// 更实际的写法：假定数据是 int32
const compar = ffi.createCallback(int32, [pointer, pointer],
  (aPtr, bPtr) => {
    // 使用临时 Pointer 对象
    const aPtrObj = ffi.alloc(4);
    const bPtrObj = ffi.alloc(4);
    // (实际上 aPtr 和 bPtr 在回调中已是 Number 地址...)
    // 简化：从地址读 int32
    const tmpA = ffi.alloc(0);
    const tmpB = ffi.alloc(0);
    // (实际生产代码中通过 bindings 包装)
    return 0;
  }
);

// 异步回调 — funcAsync 方式
const qsortAsync = libc.funcAsync('qsort', VOID, [
  pointer, uint64, uint64,
  ffi.callback(int32, [pointer, pointer])
], { callbackTimeout: 5000 });

const arr = ffi.alloc(40);
for (let i = 0; i < 10; i++) {
  arr.writeInt32(i * 4, Math.floor(Math.random() * 100));
}

await qsortAsync(arr, 10, 4, (aAddr, bAddr) => {
  // aAddr 和 bAddr 是数值地址
  // 使用临时 Pointer 读取值
  const a = readInt32FromAddr(aAddr);
  const b = readInt32FromAddr(bAddr);
  return a - b;
});

ffi.free(arr);
libc.close();

// 辅助：从数值地址读取 int32
function readInt32FromAddr(addr) {
  const tmp = ffi.alloc(4);
  // (使用 memcpy 从 addr 拷贝到 tmp)
  const memcpy = libc.func('memcpy', pointer, [pointer, pointer, uint64]);
  memcpy(tmp, addr, 4);
  const val = tmp.readInt32(0);
  ffi.free(tmp);
  return val;
}
```

### 异步文件系统监听器 (inotify)

```javascript
// Linux inotify 使用回调风格
const inotify_init = libc.func('inotify_init', int32, []);
const inotify_add_watch = libc.func('inotify_add_watch', int32, [
  int32, cstring, uint32
]);

const inotifyAsync = libc.funcAsync('read', int64, [
  int32, pointer, uint64
], { callbackTimeout: 10000 });

const fd = inotify_init();
inotify_add_watch(fd, '/tmp', 0x00000002); // IN_MODIFY

const buf = ffi.alloc(4096);
while (true) {
  const bytesRead = await inotifyAsync(fd, buf, 4096);
  // 解析 inotify_event 结构体...
  console.log(`File system event: ${bytesRead} bytes`);
}
```
