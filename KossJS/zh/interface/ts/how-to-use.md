# KossJS TypeScript 接口封装使用文档

> [!TIP]
> 本文档介绍 KossJS 的 TypeScript 接口封装 ***kossjs_interface.ts***。

## 0. 安装说明

### 0.1 系统要求

1. Node.js 18 及以上版本
2. KossJS 动态库文件：
   - Windows 平台：***kossjs.dll***
   - macOS 平台：***libkossjs.dylib***
   - Linux 平台：***libkossjs.so***
3. koffi（Node.js FFI 库）

### 0.2 安装步骤

1. 将动态库文件放置在项目目录中
2. 将 ***kossjs_interface.ts*** 复制到项目目录
3. 安装 koffi：

```bash
npm install koffi
```

---

## 1. 模块概述

- **核心类**：***KossJS***
- **依赖**：***koffi***（Node.js FFI 库）
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

```typescript
const koss = new KossJS(
    libPath?: string,   // 动态库路径，默认自动检测
    stable?: boolean,   // 稳定模式，默认 true
    caps?: number,      // 能力位掩码，默认 KOSS_CAP_SANDBOX
    builtins?: number   // Builtin 标志位掩码，默认 KOSS_BUILTIN_ALL
);
```

**示例**：

```typescript
import { KossJS } from './kossjs_interface';

// 默认创建（stable=true，纯计算沙箱，全部内置模块）
const koss = new KossJS();

// 完全启用（全部能力位 + 全部内置模块）
const full = new KossJS(undefined, true, KossJS.KOSS_CAP_ALL, KossJS.KOSS_BUILTIN_ALL);

// 开发模式（stable=false 启用 FFI）
const dev = new KossJS(undefined, false, KossJS.KOSS_CAP_ALL);

// 沙箱 + 仅 Node.js 兼容层
const nodeOnly = new KossJS(undefined, true, KossJS.KOSS_CAP_SANDBOX, KossJS.KOSS_BUILTIN_NODE);
```

> [!NOTE]
> 构造函数为位置参数 `(libPath?, stable?, caps?, builtins?)`。早期文档中的 `withModules`/`rootDir` 参数不存在；TypeScript 封装始终启用模块加载，模块解析根目录固定为当前工作目录 `.`。

### 2.2 实例属性

#### ***isStable(): boolean***

查询实例是否处于稳定模式。

```typescript
const koss = new KossJS();
console.log(koss.isStable());  // true
```

#### ***getCapabilities(): number***

查询当前实例的能力位掩码。

```typescript
const koss = new KossJS();
const caps = koss.getCapabilities();
console.log('Capabilities: 0x' + caps.toString(16));
```

#### ***getBuiltins(): number***

查询当前实例的 Builtin 标志位掩码。

```typescript
const builtins = koss.getBuiltins();
console.log(builtins.toString(16));
```

#### ***isBuiltinEnabled(flag: number): boolean***

检查指定 Builtin 标志位是否启用。

```typescript
if (koss.isBuiltinEnabled(KossJS.KOSS_BUILTIN_NODE)) {
    console.log('Node.js 兼容层已启用');
}
```

### 2.3 执行代码

#### ***eval(code: string): any***

执行 JavaScript 代码并返回结果。

```typescript
const result = koss.eval("1 + 2");
console.log(result);  // 输出: 3
```

#### ***runAsync(code: string, timeoutMs?: number): string***

执行异步代码并驱动事件循环直到 Promise 完成。

```typescript
const result = koss.runAsync(
    (async () => {
        const r = await fetch("https://api.github.com/users/github");
        const d = await r.json();
        return d.login;
    })()
, 30000);
```

#### ***tick(): boolean***

运行事件循环单次迭代。

#### ***runFile(path: string): string***

执行 JavaScript 文件。

#### ***runModule(path: string): string***

以 ES Module 方式执行 JavaScript 文件。

#### ***runString(code: string): string***

执行 JavaScript 代码字符串。

#### ***runModuleString(code: string): string***

以 ES Module 方式执行代码字符串。

### 2.4 全局变量

#### ***setGlobal(name: string, value: any): void***

设置全局变量。

```typescript
koss.setGlobal("myVar", "Hello");
koss.setGlobal("count", 100);
koss.setGlobal("isReady", true);
koss.setGlobal("config", { debug: true, port: 8080 });
```

> 底层按值类型分发到 `setGlobalString` / `setGlobalNumber` / `setGlobalBool` / `setGlobalNull` / `setGlobalUndefined` / `setGlobalJson`。

### 2.5 原生函数 / 类 / 模块加载器注册

#### ***registerFunction(name: string, func: Function): void***

注册可从 JS 调用的原生函数。

```typescript
koss.registerFunction("add", (a: string, b: string) => {
    return String(Number(a) + Number(b));
});
const result = koss.eval("add(10, 20)");
console.log(result);  // 输出: 30
```

#### ***registerClass(className: string, methods: Record<string, Function>): void***

注册支持 `new` 关键字的 JS 类。

#### ***registerModuleLoader(loaderFunc: Function): void***

注册自定义模块加载器，处理无法由内置解析器解析的模块路径。

### 2.6 沙箱安全

#### ***setAuditMask(mask: number): void***

设置审核掩码。

```typescript
koss.setAuditMask(KossJS.FS_READ | KossJS.NET_FETCH);
```

#### ***getAuditMask(): number***

获取当前审核掩码。

#### ***checkSandbox(callback: Function | null): void***

注册或清除审核回调。

```typescript
koss.checkSandbox((target: string, args: string[], pwd: string | null) => {
    if (target === 'fs.readFile') {
        return args[0].startsWith('/tmp/sandbox/');
    }
    return true;
});

// 清除回调
koss.checkSandbox(null);
```

#### ***enableAuditDebug(enable: boolean): void***

启用/禁用审核调试模式。

```typescript
koss.enableAuditDebug(true);   // 开启
koss.enableAuditDebug(false);  // 关闭
```

### 2.7 JS 层审核回调

#### ***clearJsAudit(): string***

清除 JS 层审核回调（由 JS 侧 `KossJS.set_audit_callback` 注册）。清除后，掩码覆盖的操作由宿主审核回调单独决策。

```typescript
// JS 侧注册审核回调（拒绝所有 fs 操作）
koss.eval(`KossJS.set_audit_callback(function(t, a, p) { return false; })`);

// 宿主清除 JS 层审核回调
koss.clearJsAudit();
```

> [!NOTE]
> Worker 线程池相关方法（`createWorkerPool`、`workerExecute` 等）自 **v0.1.0-dev.10** 起已从 TypeScript 接口移除。

### 2.8 资源管理

#### ***destroy(): void***

销毁 JS 实例并释放内存。

```typescript
koss.destroy();
```

### 2.9 其他方法

#### ***version(): string***

获取 KossJS 版本。

```typescript
console.log(koss.version());  // 输出: 0.1.0-dev.10
```

#### ***fetch(url: string): string***

执行 HTTP 请求（对应 C ABI `koss_fetch`）。

```typescript
const body = koss.fetch("https://example.com");
console.log(body);
```

#### ***getBinding(name: string): any***

获取内部 Rust 绑定模块信息（调试用，对应 `koss_get_binding`）。

```typescript
const info = koss.getBinding("fs");
console.log(info);
```

---

## 3. 使用示例

### 3.1 基本用法

```typescript
import { KossJS } from './kossjs_interface';

const koss = new KossJS();

// 基本计算
const result = koss.eval("1 + 2 * 3");
console.log(result);  // 输出: 7

// 对象操作
const name = koss.eval(`
    const person = { name: "John", age: 30 };
    person.name;
`);
console.log(name);  // 输出: John

koss.destroy();
```

### 3.2 使用沙箱能力位

```typescript
import { KossJS } from './kossjs_interface';

// 沙箱模式（无系统能力）
const sandbox = new KossJS(undefined, true, KossJS.KOSS_CAP_SANDBOX);
const result = sandbox.eval("1 + 1");
console.log(result);  // 正常工作
sandbox.destroy();
```

### 3.3 使用审核回调

```typescript
import { KossJS, JsError } from './kossjs_interface';

const koss = new KossJS(undefined, true, KossJS.KOSS_CAP_ALL_FS);
koss.setAuditMask(KossJS.FS_READ);

koss.checkSandbox((target: string, args: string[]) => {
    if (target === 'fs.readFile') {
        return args[0].startsWith('/tmp/sandbox/');
    }
    return true;
});

try {
    koss.eval("require('fs').readFileSync('/etc/passwd')");
} catch (e) {
    if (e instanceof JsError) {
        console.log('Blocked: ' + e.message);
    }
}

koss.destroy();
```

---

## 4. 能力常量参考

```typescript
// 文件系统（6 个）
KossJS.FS_READ         = 1 << 0;
KossJS.FS_WRITE        = 1 << 1;
KossJS.FS_DELETE       = 1 << 2;
KossJS.FS_MKDIR        = 1 << 3;
KossJS.FS_RENAME       = 1 << 4;
KossJS.FS_CHMOD        = 1 << 5;

// 网络（5 个）
KossJS.NET_TCP_CLIENT  = 1 << 6;
KossJS.NET_TCP_SERVER  = 1 << 7;
KossJS.NET_UDP         = 1 << 8;
KossJS.NET_DNS         = 1 << 9;
KossJS.NET_FETCH       = 1 << 10;

// 加密（4 个）
KossJS.CRYPTO_HASH     = 1 << 11;
KossJS.CRYPTO_HMAC     = 1 << 12;
KossJS.CRYPTO_RANDOM   = 1 << 13;
KossJS.CRYPTO_PBKDF2   = 1 << 14;

// 内置 FFI（5 个）
KossJS.FFI_OPEN        = 1 << 15;
KossJS.FFI_CALL        = 1 << 16;
KossJS.FFI_ALLOC       = 1 << 17;
KossJS.FFI_CALLBACK    = 1 << 18;
KossJS.FFI_STRUCT      = 1 << 19;

// 其他模块（8 个）
KossJS.NATIVE_ADDON    = 1 << 20;
KossJS.WASM            = 1 << 21;
KossJS.SHARED_MEMORY   = 1 << 22;
KossJS.HIGHRES_TIME    = 1 << 23;
KossJS.SYSINFO         = 1 << 24;
KossJS.MODULE_LOAD     = 1 << 25;
KossJS.DYNAMIC_CODE    = 1 << 26;
KossJS.DEBUG_CAP       = 1 << 27;

// 组合常量
KossJS.KOSS_CAP_SANDBOX    = 0;
KossJS.KOSS_CAP_ALL_FS     = KossJS.FS_READ | KossJS.FS_WRITE | KossJS.FS_DELETE | KossJS.FS_MKDIR | KossJS.FS_RENAME | KossJS.FS_CHMOD;
KossJS.KOSS_CAP_ALL_NET    = KossJS.NET_TCP_CLIENT | KossJS.NET_TCP_SERVER | KossJS.NET_UDP | KossJS.NET_DNS | KossJS.NET_FETCH;
KossJS.KOSS_CAP_ALL_CRYPTO = KossJS.CRYPTO_HASH | KossJS.CRYPTO_HMAC | KossJS.CRYPTO_RANDOM | KossJS.CRYPTO_PBKDF2;
KossJS.KOSS_CAP_ALL_FFI    = KossJS.FFI_OPEN | KossJS.FFI_CALL | KossJS.FFI_ALLOC | KossJS.FFI_CALLBACK | KossJS.FFI_STRUCT;
KossJS.KOSS_CAP_ALL        = 0xFFFFFFFF;

// 兼容别名
KossJS.KOSS_CAP_FS              = KossJS.KOSS_CAP_ALL_FS;
KossJS.KOSS_CAP_NET             = KossJS.KOSS_CAP_ALL_NET;
KossJS.KOSS_CAP_CRYPTO          = KossJS.KOSS_CAP_ALL_CRYPTO;
KossJS.KOSS_CAP_EXTERNAL_LOADER = KossJS.MODULE_LOAD;
```

## 5. Builtin 标志常量参考

```typescript
KossJS.KOSS_BUILTIN_NONE  = 0;          // 无内置模块
KossJS.KOSS_BUILTIN_NODE  = 1 << 0;     // Node.js 兼容层
KossJS.KOSS_BUILTIN_BUN   = 1 << 1;     // Bun 兼容层
KossJS.KOSS_BUILTIN_DENO  = 1 << 2;     // Deno 兼容层
KossJS.KOSS_BUILTIN_KOSS  = 1 << 3;     // Koss 原生模块
KossJS.KOSS_BUILTIN_ALL   = 0xFFFFFFFF; // 全部启用
```

---

## 6. 注意事项

1. **koffi 依赖**：TypeScript 接口依赖 koffi 库，需要先安装
2. **动态库路径**：若自动检测失败，需显式传入正确路径
3. **异常处理**：JavaScript 错误会抛出 ***JsError*** 异常
4. **稳定模式**：生产环境使用默认 ***stable=true***，开发/调试使用 ***stable=false***
5. **默认能力**：默认构造器为 `KOSS_CAP_SANDBOX`（纯计算沙箱），需要系统能力时显式传 `KOSS_CAP_ALL`
6. **默认 Builtin**：默认构造器为 `KOSS_BUILTIN_ALL`（全部内置模块可见）

---

如有问题，请提交 issue。
