# funcAsync — 异步函数绑定

绑定一个 C 函数为异步调用，返回一个 async 函数。每次调用返回 `Promise`。

## 签名

```ts
// JavaScript/Typescript
const asyncFn = lib.funcAsync(name, returnType, [argTypes]);
const result = await asyncFn(...args);
```

```python
# Python
async_fn = lib.funcAsync(name, retType, argTypes)
result = await async_fn(*args)
```

## 异步实现因语言/运行时而异

| 语言/运行时 | 实现方式 |
|------------|---------|
| JS/TS-KossJS | 真实系统线程 (`std::thread`) + libffi |
| JS/TS-Deno | 原生非阻塞 (`nonblocking: true`) |
| JS/TS-Node.js | 单 Worker (`worker_threads`) |
| JS/TS-Bun | 单 Worker (Bun 的 `worker_threads` polyfill) |
| Py | 通过 `asyncio.to_thread()` 将同步 FFI 调用放到线程池执行 |

## 限制 (JavaScript)

| 限制                            | 影响范围                                      |
| ------------------------------- | --------------------------------------------- |
| callback 参数不支持 Worker 执行 | Node.js / Bun（自动降级为主线程同步）         |
| C 函数必须线程安全              | Node.js / Bun Worker 模式（串行执行降低风险） |
| struct 参数需 `toPointer()`   | 所有语言/运行时（结构体实例转为内存指针传递）      |
| 不支持 `timeoutMs` 参数       | JS 侧无法安全中断 C 函数执行                  |

## 限制 (Python)

| 限制                      | 说明                                               |
| ------------------------- | -------------------------------------------------- |
| C 函数必须线程安全        | `asyncio.to_thread` 在线程池中执行，需保证线程安全 |
| struct 参数需转为指针传递 | 结构体实例需通过 `to_pointer()` 转换为内存指针     |
| GIL 限制                  | CPU 密集型 FFI 调用无法真正并行                    |


---

**详细文档**:
- [funcAsync() (JavaScript)](/zh/js/api/funcAsync-js)
- [funcAsync() (Python)](/zh/py/api/funcAsync-py)
