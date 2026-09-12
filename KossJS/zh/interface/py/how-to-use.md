# KossJS Python 接口封装使用文档

> [!TIP]
> 本文档介绍 KossJS 的 Python 接口封装 ***kossjs_interface.py***。

## 0. 安装说明

### 0.1 系统要求

1. Python 3.11 及以上版本
2. KossJS 动态库文件：
   - Windows 平台：***kossjs.dll***
   - macOS 平台：***libkossjs.dylib***
   - Linux 平台：***libkossjs.so***

### 0.2 安装步骤

1. 将动态库文件放置在项目目录中
2. 将 ***kossjs_interface.py*** 复制到项目目录

---

## 1. 模块概述

- **核心类**：***KossJS***
- **依赖**：***ctypes***、***json***、***pathlib*** 等标准库
- **功能**：
  - 创建 JS 实例（支持模块加载、能力位控制、Builtin 标志、稳定模式）
  - 执行 JavaScript 代码
  - 全局变量注入
  - 注册原生函数 / 类 / 模块加载器
  - Fetch API 调用
  - 沙箱安全（审核掩码、审核回调、调试模式、JS 层审核回调）

---

## 2. ***KossJS*** 类

### 2.1 初始化

```python
koss = KossJS(
    lib_path: str | None = None,
    with_modules: bool = False,
    root_dir: str | None = None,
    capabilities: int | None = None,
    builtins: int | None = None,
    stable: bool = True
)
```

- **参数**:
  - ***lib_path***: 动态库路径。若为 ***None***，根据操作系统自动选择默认路径
  - ***with_modules***: 是否启用模块加载（默认 ***False***）
  - ***root_dir***: 模块解析的根目录（默认当前目录）
  - ***capabilities***: 能力位掩码（默认 ***None*** = `KOSS_CAP_SANDBOX`，纯计算沙箱）。参见 [安全与沙箱指南](/zh/security-sandbox/security-sandbox)
  - ***builtins***: Builtin 标志位掩码（默认 ***None*** = `KOSS_BUILTIN_ALL`）。v0.1.0-dev.10 起可用
  - ***stable***: 稳定模式（默认 ***True***）。***True*** 时禁用 FFI；***False*** 启用 FFI

> [!NOTE]
> 参数顺序为 `(lib_path, with_modules, root_dir, capabilities, builtins, stable)`，`builtins` 在第 5 位、`stable` 在第 6 位。早期文档将 `stable` 记为第 5 位会导致位置传参错位。

**能力常量**（28 个细粒度操作）：

```python
# 文件系统（6 个）
KossJS.FS_READ         = 1 << 0
KossJS.FS_WRITE        = 1 << 1
KossJS.FS_DELETE       = 1 << 2
KossJS.FS_MKDIR        = 1 << 3
KossJS.FS_RENAME       = 1 << 4
KossJS.FS_CHMOD        = 1 << 5

# 网络（5 个）
KossJS.NET_TCP_CLIENT  = 1 << 6
KossJS.NET_TCP_SERVER  = 1 << 7
KossJS.NET_UDP         = 1 << 8
KossJS.NET_DNS         = 1 << 9
KossJS.NET_FETCH       = 1 << 10

# 加密（4 个）
KossJS.CRYPTO_HASH     = 1 << 11
KossJS.CRYPTO_HMAC     = 1 << 12
KossJS.CRYPTO_RANDOM   = 1 << 13
KossJS.CRYPTO_PBKDF2   = 1 << 14

# 内置 FFI（5 个）
KossJS.FFI_OPEN        = 1 << 15
KossJS.FFI_CALL        = 1 << 16
KossJS.FFI_ALLOC       = 1 << 17
KossJS.FFI_CALLBACK    = 1 << 18
KossJS.FFI_STRUCT      = 1 << 19

# 其他模块（8 个）
KossJS.NATIVE_ADDON    = 1 << 20
KossJS.WASM            = 1 << 21
KossJS.SHARED_MEMORY   = 1 << 22
KossJS.HIGHRES_TIME    = 1 << 23
KossJS.SYSINFO         = 1 << 24
KossJS.MODULE_LOAD     = 1 << 25
KossJS.DYNAMIC_CODE    = 1 << 26
KossJS.DEBUG_CAP       = 1 << 27

# 组合常量
KossJS.KOSS_CAP_SANDBOX    = 0
KossJS.KOSS_CAP_ALL_FS     = KossJS.FS_READ | KossJS.FS_WRITE | KossJS.FS_DELETE | KossJS.FS_MKDIR | KossJS.FS_RENAME | KossJS.FS_CHMOD
KossJS.KOSS_CAP_ALL_NET    = KossJS.NET_TCP_CLIENT | KossJS.NET_TCP_SERVER | KossJS.NET_UDP | KossJS.NET_DNS | KossJS.NET_FETCH
KossJS.KOSS_CAP_ALL_CRYPTO = KossJS.CRYPTO_HASH | KossJS.CRYPTO_HMAC | KossJS.CRYPTO_RANDOM | KossJS.CRYPTO_PBKDF2
KossJS.KOSS_CAP_ALL_FFI    = KossJS.FFI_OPEN | KossJS.FFI_CALL | KossJS.FFI_ALLOC | KossJS.FFI_CALLBACK | KossJS.FFI_STRUCT
KossJS.KOSS_CAP_ALL        = 0xFFFFFFFF

# 兼容别名
KossJS.KOSS_CAP_FS              = KossJS.KOSS_CAP_ALL_FS
KossJS.KOSS_CAP_NET             = KossJS.KOSS_CAP_ALL_NET
KossJS.KOSS_CAP_CRYPTO          = KossJS.KOSS_CAP_ALL_CRYPTO
KossJS.KOSS_CAP_EXTERNAL_LOADER = KossJS.MODULE_LOAD
```

**Builtin 标志常量**：

```python
KossJS.KOSS_BUILTIN_NONE  = 0           # 无内置模块
KossJS.KOSS_BUILTIN_NODE  = 1 << 0      # Node.js 兼容层
KossJS.KOSS_BUILTIN_BUN   = 1 << 1      # Bun 兼容层
KossJS.KOSS_BUILTIN_DENO  = 1 << 2      # Deno 兼容层
KossJS.KOSS_BUILTIN_KOSS  = 1 << 3      # Koss 原生模块
KossJS.KOSS_BUILTIN_ALL   = 0xFFFFFFFF  # 全部启用
```

### 2.2 实例属性

#### ***is_stable -> bool***

查询实例是否处于稳定模式。

```python
koss = KossJS()
print(koss.is_stable)  # True

koss_dev = KossJS(stable=False)
print(koss_dev.is_stable)  # False
```

#### ***get_capabilities() -> int***

查询当前实例的能力位掩码。

```python
koss = KossJS(capabilities=KossJS.KOSS_CAP_ALL_FS | KossJS.KOSS_CAP_ALL_NET)
caps = koss.get_capabilities()
print(f"Capabilities: {caps:#010x}")
```

#### ***get_builtins() -> int***

查询当前实例的 Builtin 标志位掩码。

```python
builtins = koss.get_builtins()
```

#### ***is_builtin_enabled(flag: int) -> bool***

检查指定 Builtin 标志位是否启用。

```python
if koss.is_builtin_enabled(KossJS.KOSS_BUILTIN_NODE):
    print("Node.js 兼容层已启用")
```

### 2.3 执行代码

#### ***eval(code: str) -> Any***

执行 JavaScript 代码并返回结果。JSON 对象/数组自动解析。

```python
result = koss.eval("1 + 2")
print(result)  # 输出: 3
```

#### ***run_async(code: str, timeout_ms: int = 30000) -> str***

执行异步代码并驱动事件循环直到 Promise 完成。适合 `await`/`fetch`。

```python
result = koss.run_async("""
(async () => {
    const r = await fetch("https://api.github.com/users/github");
    const d = await r.json();
    return d.login;
})();
""", timeout_ms=30000)
```

#### ***tick() -> bool***

运行事件循环单次迭代。返回 True 表示仍有未完成的异步操作。

```python
koss.eval("fetch('https://example.com/api').then(r => r.json())")
while koss.tick():
    pass  # 手动驱动事件循环
```

#### ***run_file(path: str) -> str***

执行 JavaScript 文件。

```python
result = koss.run_file("./script.js")
```

#### ***run_module(path: str) -> str***

以 ES Module 方式执行 JavaScript 文件。

```python
result = koss.run_module("./module.mjs")
```

#### ***run_string(code: str) -> str***

执行 JavaScript 代码字符串（与 ***eval*** 相同）。

```python
result = koss.run_string("console.log('Hello')")
```

#### ***run_module_string(code: str) -> str***

以 ES Module 方式执行代码字符串。

```python
result = koss.run_module_string('''
import { add } from "./math.mjs";
add(1, 2);
''')
```

### 2.4 全局变量

#### ***set_global(name: str, value: Any) -> None***

设置全局变量。支持的类型：
- ***str*** → 全局字符串
- ***int/float*** → 全局数字
- ***bool*** → 全局布尔值
- ***None*** → 全局 null
- ***"__undefined__"*** → 全局 undefined
- ***list/dict*** → 自动序列化为 JSON 对象/数组

```python
koss.set_global("myVar", "Hello")
koss.set_global("count", 100)
koss.set_global("isReady", True)
koss.set_global("emptyVal", None)
koss.set_global("notSet", "__undefined__")
koss.set_global("config", {"debug": True, "port": 8080})
```

### 2.5 原生函数 / 类 / 模块加载器注册

#### ***register_function(name: str, func: Callable[..., Any]) -> None***

将 Python 函数注册为 JavaScript 可调用。

```python
def add(a, b):
    return str(int(a) + int(b))

koss.register_function("add", add)
result = koss.eval("add(10, 20)")
print(result)  # 输出: 30
```

#### ***register_class(class_name: str, methods: dict[str, Callable]) -> None***

注册支持 `new` 关键字的 JavaScript 类。

```python
def greet(name="World"):
    return f"Hello, {name}!"

koss.register_class("Greeter", {"greet": greet})
result = koss.eval("new Greeter().greet('KossJS')")
print(result)  # 输出: Hello, KossJS!
```

#### ***register_module_loader() -> None***

注册自定义模块加载器，处理无法由内置解析器解析的模块路径。

### 2.6 沙箱安全

#### ***set_audit_mask(mask: int) -> None***

设置审核掩码，控制哪些 API 需要经过审核回调。

```python
koss.set_audit_mask(KossJS.FS_READ | KossJS.NET_FETCH)
```

#### ***get_audit_mask() -> int***

获取当前审核掩码。

```python
mask = koss.get_audit_mask()
```

#### ***check_sandbox(callback: Callable | None) -> None***

注册或清除审核回调。回调签名：(target: str, args: list[str], pwd: str | None) -> bool

```python
def my_audit(target: str, args: list[str], pwd: str | None) -> bool:
    if target == "fs.readFile":
        return args[0].startswith("/tmp/sandbox/")
    return True

koss.check_sandbox(my_audit)  # 注册
koss.check_sandbox(None)      # 清除
```

> [!NOTE]
> v0.1.0-dev.10 起，若审核掩码 ≠ 0 但未注册审核回调，操作会直接抛出 `KossConfigError`，而不是静默放行或报通用错误。

#### ***enable_audit_debug(enable: bool) -> None***

启用/禁用审核调试模式。

```python
koss.enable_audit_debug(True)   # 开启
koss.enable_audit_debug(False)  # 关闭
```

### 2.7 JS 层审核回调

#### ***clear_js_audit() -> str***

清除 JS 层审核回调（由 JS 侧 `KossJS.set_audit_callback` 注册）。清除后，掩码覆盖的操作由宿主审核回调单独决策。

```python
# JS 侧注册审核回调（拒绝所有 fs 操作）
koss.eval("KossJS.set_audit_callback(function(t, a, p) { return false; })")

# 宿主清除 JS 层审核回调
koss.clear_js_audit()
```

> [!NOTE]
> Worker 线程池相关方法（`create_worker_pool`、`worker_execute` 等）自 **v0.1.0-dev.10** 起已从 Python 接口移除。

### 2.8 资源管理

#### ***destroy() -> None***

销毁 JS 实例并释放内存。

```python
koss.destroy()
```

##### 上下文管理器支持

```python
with KossJS() as koss:
    result = koss.eval("1 + 1")
    print(result)
# 自动销毁
```

### 2.9 其他方法

#### ***version() -> str***

获取 KossJS 版本。

```python
print(koss.version())  # 输出: 0.1.0-dev.10
```

---

## 3. 异常处理

### JsError

当 JavaScript 代码执行抛出错误时，会引发 ***JsError*** 异常。

```python
from kossjs_interface import KossJS, JsError

try:
    koss.eval("throw new Error('test error')")
except JsError as e:
    print(f"JS Error: {e}")
```

---

## 4. 使用示例

### 4.1 基本用法

```python
from kossjs_interface import KossJS

with KossJS() as koss:
    # 基本计算
    result = koss.eval("1 + 2 * 3")
    print(result)  # 输出: 7

    # 箭头函数
    code = "(a, b) => a + b"
    koss.set_global("add", koss.eval(code))
    result = koss.eval("add(5, 3)")
    print(result)  # 输出: 8

    # 对象操作
    code = """
    const person = { name: "John", age: 30 };
    person.name;
    """
    result = koss.eval(code)
    print(result)  # 输出: John
```

### 4.2 使用沙箱能力位

```python
from kossjs_interface import KossJS

# 纯计算沙箱
with KossJS(capabilities=KossJS.KOSS_CAP_SANDBOX) as koss:
    result = koss.eval("1 + 1")
    print(result)  # 正常工作

# 只允许网络 + 加密
with KossJS(capabilities=KossJS.KOSS_CAP_ALL_NET | KossJS.KOSS_CAP_ALL_CRYPTO) as koss:
    result = koss.run_async('''
    (async () => {
        const r = await fetch("https://api.github.com/users/github");
        const d = await r.json();
        return d.login;
    })();
    ''')
```

### 4.3 使用审核回调

```python
from kossjs_interface import KossJS, JsError

def my_audit(target: str, args: list[str], pwd: str | None) -> bool:
    if target == "fs.readFile":
        return args[0].startswith("/tmp/sandbox/")
    return True

koss = KossJS(capabilities=KossJS.KOSS_CAP_ALL_FS)
koss.set_audit_mask(KossJS.FS_READ)
koss.check_sandbox(my_audit)

try:
    koss.eval("require('fs').readFileSync('/etc/passwd')")
except JsError as e:
    print(f"Blocked: {e}")  # KossSecurityError
```

### 4.4 使用 Node.js 模块

```python
from kossjs_interface import KossJS

with KossJS() as koss:
    # 使用路径模块
    code = '''
    const path = require("path");
    path.join("/home", "user", "file.txt");
    '''
    result = koss.eval(code)
    print(result)  # 输出: /home/user/file.txt
```

### 4.5 注册原生函数

```python
from kossjs_interface import KossJS

def python_add(a, b):
    return str(int(a) + int(b))

with KossJS() as koss:
    koss.register_function("python_add", python_add)
    result = koss.eval("python_add(10, 20)")
    print(result)  # 输出: 30
```

---

## 5. 内存管理

### 回调函数引用管理

每次调用 ***register_function*** 时，若提供了回调函数，会通过 ***ctypes.CFUNCTYPE*** 创建一个 C 可调用对象。

Python 接口通过以下方式管理这些引用：
- 回调对象被保存在 ***self._callbacks*** 列表中
- 这些引用会随着 ***KossJS*** 实例一起被 Python 垃圾回收器自动清理
- 无需手动干预或调用额外的清理方法

---

## 6. 注意事项

1. **库路径**：若自动猜测失败，需显式传入正确路径。
2. **返回值**：所有执行方法返回字符串结果，调用方需自行解析。
3. **异常处理**：JavaScript 错误会引发 ***JsError*** 异常。
4. **多线程环境**：不同线程使用不同的 ***KossJS*** 实例是安全的。
5. **模块加载**：需要 ***with_modules=True*** 才能使用 ***require()***。
6. **Async/Await**：异步代码需要使用 ***run_async()*** 执行。
7. **稳定模式**：生产环境使用默认 ***stable=True***，开发/调试使用 ***stable=False***。
8. **Builtin 标志**：默认 `builtins=None` = `KOSS_BUILTIN_ALL`（全部内置模块可见）；需要限制时传入 `KOSS_BUILTIN_*` 组合。

---

## 7. 常见问题

**Q: 为什么我的代码返回 "undefined"?**
A: JavaScript 函数默认返回 undefined。如果需要返回值，确保有 return 语句。

**Q: 如何处理异步 fetch?**
A: 使用 `run_async()` 方法执行异步代码，它会驱动事件循环直到 Promise 完成。

**Q: 需要并发执行多个脚本怎么办？**
A: 创建多个 ***KossJS*** 实例，每个管理一组脚本。它们独立运行。或配合 ***threading*** 模块执行。

**Q: 为什么 require() 不工作？**
A: 确保创建实例时设置 ***with_modules=True***。

**Q: 如何启用 FFI 功能？**
A: 创建实例时设置 ***stable=False***。

**Q: 如何限制实例的权限？**
A: 使用 ***capabilities*** 参数设置能力位掩码。

---

如有问题，请提交 issue。
