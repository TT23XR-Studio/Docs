# stable 模式不可用 API 的替代方案

> 当 `stable=True`（默认）时，FFI 功能被禁用。本文档提供这些场景的替代实现方案，附 Python 代码示例。
>
> > [!NOTE]
> > Worker 线程池自 **v0.1.0-dev.10** 起已整体移除（不再是"stable 下禁用"，而是不存在）。需要并行执行任务时，请参考本文档「并行执行替代方案」一节。

---

## 被禁用的功能

| 功能 | 禁用原因 | 涉及 API |
|------|---------|---------|
| FFI | 无法在所有场景下充分测试 | `_senri_ffi.open/func/alloc/callback/struct` |

---

## 一、FFI 替代方案

### 方案 1：宿主侧注册函数（推荐）

在 Python 侧注册原生能力，JS 端直接调用，无需 FFI。

```python
from kossjs_interface import KossJS

def add(a, b):
    return str(int(a) + int(b))

def read_file(path):
    with open(path, 'r') as f:
        return f.read()

koss = KossJS()  # stable=True

koss.register_function("add", add)
koss.register_function("readFile", read_file)

result = koss.eval("add(10, 20)")
print(result)  # 30

content = koss.eval("readFile('/path/to/file.txt')")
print(content)
```

**适用场景**：需要调用 C 库功能时，将对应逻辑移到宿主侧实现。

---

### 方案 2：HTTP/API 调用

用 `fetch` 调用外部服务代替调用本地 C 库。

```python
koss = KossJS()

code = '''
(async () => {
  const response = await fetch("https://api.example.com/data");
  return await response.json();
})();
'''
result = koss.run_async(code, timeout_ms=30000)
print(result)
```

**适用场景**：原本需要 FFI 调用网络相关 C 库（如 libcurl）的场景。

---

### 方案 3：注册类（带状态的原生对象）

用 `register_class` 注册带状态的原生对象，替代 FFI 结构体操作。

```python
from kossjs_interface import KossJS

class Database:
    def __init__(self, path):
        self.path = path

    def connect(self):
        return "connected"

    def query(self, sql):
        return f"result of: {sql}"

koss = KossJS()
koss.register_class("Database", Database)

result = koss.eval("""
  const db = new Database('/tmp/data.db');
  db.connect();
""")
print(result)  # connected
```

**适用场景**：原本需要 FFI 操作结构体、管理状态的场景。

---

## 二、并行执行替代方案

> Worker 线程池已移除，需要并行执行 JS 任务时可采用以下方案。

### 方案 1：多实例隔离（推荐）

创建多个 KossJS 实例，宿主侧管理并发。

```python
import threading
from kossjs_interface import KossJS

def run_task(task_id):
    koss = KossJS()
    result = koss.eval(f"task_{task_id} result: {1 + {task_id}}")
    print(f"Task {task_id}: {result}")
    koss.destroy()

threads = []
for i in range(3):
    t = threading.Thread(target=run_task, args=(i,))
    threads.append(t)
    t.start()

for t in threads:
    t.join()
```

**适用场景**：需要并行执行多个独立 JS 任务。

---

### 方案 2：异步执行

用 `run_async` 处理异步任务，单实例内实现并发。

```python
koss = KossJS()

code = '''
(async () => {
  const results = [];
  for (let i = 0; i < 5; i++) {
    results.push(await Promise.resolve(i * 2));
  }
  return JSON.stringify(results);
})();
'''
result = koss.run_async(code, timeout_ms=10000)
print(result)  # [0, 2, 4, 6, 8]
```

**适用场景**：IO 密集型任务（网络请求、文件读写）。

---

### 方案 3：宿主线程调度

Python 线程池 + 多实例，实现真正的 CPU 并行。

```python
import concurrent.futures
from kossjs_interface import KossJS

def evaluate_code(code):
    koss = KossJS()
    try:
        return koss.eval(code)
    finally:
        koss.destroy()

codes = [
    "Array.from({length: 1000}, (_, i) => i).reduce((a, b) => a + b, 0)",
    "JSON.stringify({name: 'test', values: [1,2,3]})",
    "Date.now().toString()",
]

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
    futures = {executor.submit(evaluate_code, c): c for c in codes}
    for future in concurrent.futures.as_completed(futures):
        code = futures[future]
        result = future.result()
        print(f"Done: {result[:50]}...")
```

**适用场景**：CPU 密集型计算，需要充分利用多核。

---

## 三、开发模式（仅测试用）

> 生产环境不推荐，仅用于开发/测试。

```python
koss_dev = KossJS(stable=False)
print(koss_dev.is_stable)  # False

ffi_code = """
const lib = _senri_ffi.open('libc.so.6');
const puts = lib.func('puts', 'int', ['string']);
puts('Hello from FFI!');
"""
koss_dev.eval(ffi_code)
```

---

## 方案选择指南

| 场景 | 推荐方案 | 说明 |
|------|---------|------|
| 需要调用 C 库功能 | 宿主侧注册函数 | 将逻辑移到 Python 侧实现 |
| 需要网络请求能力 | HTTP/API 调用 | 用 fetch 替代 libcurl 等 |
| 需要操作复杂数据结构 | 注册类 | 用 Python 类替代 FFI 结构体 |
| 需要并行执行任务 | 多实例隔离 | 每个任务一个独立实例 |
| 需要异步 IO | 异步执行 | 单实例内 async/await |
| 需要 CPU 并行 | 宿主线程调度 | 线程池 + 多实例 |
| 仅开发/测试 | stable=False | 生产环境禁用 |
