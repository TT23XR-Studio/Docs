# Deno 兼容层参考

本文档详细列出 KossJS 的 Deno 兼容层（`koss:deno`）所有 API。

> **版本锚定**：基于 Deno **v2.0.x** 实现  
> **Builtin 标志**：`KOSS_BUILTIN_DENO`（`1 << 2`）  
> **文件位置**：`src/js_shims/deno_shim.js`（417 行）  
> **底层依赖**：委托 `koss:io`、`koss:crypto`、`koss:system` 实现

---

## 模块导入

```javascript
// ES Module (import)
import Deno from 'koss:deno';
import { readTextFile, writeTextFile, serve } from 'koss:deno';

// CommonJS (require)
const Deno = require('koss:deno');
```

---

## API 列表

### 版本与环境

#### Deno.version

**类型：** `object`

```javascript
{
    deno: '2.0.6',
    v8: '12.9',
    typescript: '5.6'
}
```

返回 Deno 版本信息对象。

```javascript
console.log(Deno.version.deno);       // '2.0.6'
console.log(Deno.version.typescript); // '5.6'
```

---

#### Deno.env

**类型：** `object`

环境变量对象（底层使用 `koss:system.env()`）。

```javascript
const PATH = Deno.env.PATH;
```

---

#### Deno.args

**类型：** `string[]`

命令行参数列表（当前简化实现，返回空数组）。

```javascript
console.log(Deno.args);  // []（当前为空数组）
```

---

#### Deno.Env

**类型：** `object`（v0.1.0-dev.10 新增）

环境变量操作对象，底层使用 `koss:system`。

| 方法 | 说明 |
|------|------|
| `Env.get(key)` | 读取环境变量 |
| `Env.set(key, value)` | 设置环境变量 |
| `Env.delete(key)` | 删除环境变量 |
| `Env.toObject()` | 导出全部环境变量为对象 |

```javascript
Deno.Env.set('FOO', 'bar');
console.log(Deno.Env.get('FOO'));
```

---

#### Deno.pid

**类型：** `number`

当前进程 ID。

```javascript
console.log(Deno.pid);  // 12345
```

---

#### Deno.noColor

**类型：** `boolean`

是否禁用彩色输出。值为 `true`。

```javascript
if (Deno.noColor) {
    console.log('No color mode');
}
```

---

### 文件系统 API

#### Deno.readTextFile(path)

**类型：** `function`  
**参数：** `path: string`  
**返回值：** `string`（同步）

读取文本文件内容（UTF-8）。

```javascript
const text = Deno.readTextFile('/tmp/hello.txt');
console.log(text);
```

---

#### Deno.writeTextFile(path, data)

**类型：** `function`  
**参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| `path` | `string` | 文件路径 |
| `data` | `string \| Uint8Array` | 要写入的数据 |

写入文本文件（同步）。

```javascript
Deno.writeTextFile('/tmp/output.txt', 'Hello Deno!');
```

---

#### Deno.readFile(path)

**类型：** `function`  
**参数：** `path: string`  
**返回值：** `Uint8Array`（同步）

读取文件为字节数组。

```javascript
const bytes = Deno.readFile('/tmp/data.bin');
console.log(bytes.length);
```

---

#### Deno.writeFile(path, data)

**类型：** `function`  
**参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| `path` | `string` | 文件路径 |
| `data` | `string \| Uint8Array` | 要写入的数据 |

写入文件（同步）。

```javascript
Deno.writeFile('/tmp/output.bin', new Uint8Array([1, 2, 3]));
```

---

#### Deno.stat(path)

**类型：** `function`  
**参数：** `path: string`  
**返回值：** `object`（同步）

获取文件状态信息。

```javascript
const info = Deno.stat('/tmp/test.txt');
console.log(info);  // { size, mtime, ctime, isFile, isDir, isSymlink }
```

---

#### Deno.lstat(path)

**类型：** `function`  
**参数：** `path: string`  
**返回值：** `object`（同步）

获取符号链接状态（与 `stat` 相同，不支持符号链接区别）。

```javascript
const info = Deno.lstat('/tmp/link.txt');
```

---

#### Deno.mkdir(path, options)

**类型：** `function`  
**参数：**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `path` | `string` | — | 目录路径 |
| `options.recursive` | `boolean` | `false` | 是否递归创建 |

创建目录。

> **跨平台行为（v0.1.0-dev.10）：** 若目录已存在，静默成功、不抛错（自动容忍 `already exists`、`os error 183`（Windows）、`os error 17`（POSIX）错误），与各平台原生行为一致。

```javascript
Deno.mkdir('/tmp/newdir');
Deno.mkdir('/tmp/a/b/c', { recursive: true });
Deno.mkdir('/tmp/newdir');  // 已存在 → 静默成功
```

---

#### Deno.readTextFileSync(path) / readFileSync(path)

**类型：** `function`（v0.1.0-dev.10 新增）

同步读取文本/二进制文件。

```javascript
const text = Deno.readTextFileSync('/tmp/hello.txt');
const bytes = Deno.readFileSync('/tmp/data.bin');
```

---

#### Deno.writeTextFileSync(path, data) / writeFileSync(path, data)

**类型：** `function`（v0.1.0-dev.10 新增）

同步写入文本/二进制文件。

```javascript
Deno.writeTextFileSync('/tmp/output.txt', 'Hello Deno!');
Deno.writeFileSync('/tmp/output.bin', new Uint8Array([1, 2, 3]));
```

---

#### Deno.mkdirSync(path, options) / removeSync(path, options) / renameSync(old, new)

**类型：** `function`（v0.1.0-dev.10 新增）

同步创建/删除/重命名。`mkdirSync` 与 `Deno.mkdir` 一样对"已存在"静默成功。

---

#### Deno.statSync(path) / lstatSync(path) / realPathSync(path)

**类型：** `function`（v0.1.0-dev.10 新增）

同步状态/链接状态/真实路径。

---

#### Deno.cwdSync() / chdirSync(path) / copyFileSync(from, to) / existsSync(path)

**类型：** `function`（v0.1.0-dev.10 新增）

同步工作目录 / 复制文件（真实实现）/ 判断存在。

```javascript
const exists = Deno.existsSync('/tmp/a.txt');   // true / false
Deno.copyFileSync('/tmp/a.txt', '/tmp/b.txt');
```

---

#### Deno.remove(path)

**类型：** `function`  
**参数：** `path: string`

删除文件或空目录。

```javascript
Deno.remove('/tmp/file.txt');
```

---

#### Deno.rename(oldPath, newPath)

**类型：** `function`  
**参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| `oldPath` | `string` | 源路径 |
| `newPath` | `string` | 目标路径 |

重命名或移动文件/目录。

```javascript
Deno.rename('/tmp/old.txt', '/tmp/new.txt');
```

---

#### Deno.realPath(path)

**类型：** `function`  
**参数：** `path: string`  
**返回值：** `string`（同步）

解析为绝对路径。

```javascript
const real = Deno.realPath('/tmp/../test.txt');
console.log(real);  // '/tmp/test.txt'
```

---

#### Deno.cwd()

**类型：** `function`  
**返回值：** `string`

获取当前工作目录。

```javascript
const current = Deno.cwd();
console.log(current);  // 例如 '/home/user'
```

---

#### Deno.chdir(path)

**类型：** `function`  
**参数：** `path: string`

切换当前工作目录。

```javascript
Deno.chdir('/tmp');
console.log(Deno.cwd());  // '/tmp'
```

---

### 进程 API

#### Deno.exit(code)

**类型：** `function`  
**参数：**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `code` | `number` | `0` | 退出码 |

退出当前进程。

```javascript
Deno.exit(1);  // 以退出码 1 退出
```

---

#### Deno.memoryUsage()

**类型：** `function`  
**返回值：** `object`

返回内存使用信息。

```javascript
const mem = Deno.memoryUsage();
console.log(mem);  // { rss, heapTotal, heapUsed, external }
```

---

#### Deno.open(path, options) / Deno.FsFile

**类型：** `function` / `class`（v0.1.0-dev.10 新增）

打开文件返回 `Promise<FsFile>`。`FsFile` 提供 `rid`/`path` 属性与异步方法：`read`/`write`/`close`/`seek`/`stat`，并支持 `Symbol.asyncDispose`。

```javascript
const file = await Deno.open('/tmp/data.bin', { read: true });
const n = await file.read(buffer);
await file.close();
```

---

#### Deno.readAll(file) / Deno.writeAll(file, data)

**类型：** `function`（v0.1.0-dev.10 新增）

读取 FsFile 全部内容为 `Uint8Array` / 向 FsFile 写入数据。

```javascript
const file = await Deno.open('/tmp/data.bin', { read: true });
const bytes = await Deno.readAll(file);
```

---

#### Deno.kill(pid, signal)

**类型：** `function`（v0.1.0-dev.10 新增）

向进程发送信号（底层委托 `koss:system.kill`）。

```javascript
Deno.kill(12345, Deno.signals.SIGTERM);  // 15
```

---

### 网络 API

#### Deno.serve(handler, options)

**类型：** `function`  
**参数：**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `handler` | `function` | — | 请求处理函数（v0.1.0-dev.10 起接线到完整 `koss:http` 服务端） |
| `options.port` | `number` | `8000` | 监听端口 |
| `options.hostname` | `string` | `'0.0.0.0'` | 监听主机 |

启动 HTTP 服务器。handler 返回 `Response`，由完整 `koss:http` 服务端调用。

**返回值：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `.port` | `number` | 监听端口 |
| `.hostname` | `string` | 监听主机 |
| `.close()` | `function` | 关闭服务器 |
| `.shutdown()` | `function` | 关闭服务器（返回 Promise） |

```javascript
const server = Deno.serve((req) => new Response('Hello'), { port: 8080 });
console.log(`Server running on port ${server.port}`);
server.close();
```

---

#### Deno.listen(options)

**类型：** `function`  
**参数：**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `options.port` | `number` | `8000` | 监听端口 |
| `options.hostname` | `string` | `'0.0.0.0'` | 监听主机 |

创建 TCP 监听器。

```javascript
const listener = Deno.listen({ port: 9000 });
```

---

#### Deno.connect(options)

**类型：** `function`  
**参数：**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `options.hostname` | `string` | `'localhost'` | 目标主机 |
| `options.port` | `number` | 必需 | 目标端口 |

建立 TCP 连接。

```javascript
const conn = Deno.connect({ hostname: 'example.com', port: 80 });
```

---

#### Deno.resolveDns(host)

**类型：** `function`  
**参数：** `host: string`  
**返回值：** `string`

DNS 解析。

```javascript
const ip = Deno.resolveDns('example.com');
console.log(ip);  // '93.184.216.34'
```

---

### 加密 API

#### Deno.crypto

**类型：** `object`

提供 Web Crypto API 风格的操作。

| API | 类型 | 说明 |
|-----|------|------|
| `crypto.getRandomValues(arr)` | `function` | 填充随机值 |
| `crypto.randomUUID()` | `function` | 生成 UUID v4 |
| `crypto.subtle.digest(algorithm, data)` | `async function` | 计算摘要 |
| `crypto.subtle.encrypt(algorithm, key, data)` | `async function` | 加密数据 |
| `crypto.subtle.decrypt(algorithm, key, data)` | `async function` | 解密数据 |
| `crypto.subtle.generateKey(algorithm)` | `async function` | 生成密钥（支持 Ed25519） |
| `crypto.subtle.sign(algorithm, key, data)` | `async function` | 签名数据 |
| `crypto.subtle.verify(algorithm, key, signature, data)` | `async function` | 验证签名 |
 
```javascript
// 随机值
const arr = new Uint8Array(16);
Deno.crypto.getRandomValues(arr);

// UUID
const uuid = Deno.crypto.randomUUID();

// 摘要
const hash = await Deno.crypto.subtle.digest('SHA-256', 'hello');

// 加密
const ct = await Deno.crypto.subtle.encrypt('AES-GCM', key, data);

// 解密
const pt = await Deno.crypto.subtle.decrypt('AES-GCM', key, ct);
```

---

### 定时器 API

| API | 说明 |
|-----|------|
| `Deno.setTimeout(cb, ms)` | 设置超时 |
| `Deno.clearTimeout(id)` | 清除超时 |
| `Deno.setInterval(cb, ms)` | 设置间隔 |
| `Deno.clearInterval(id)` | 清除间隔 |

```javascript
const id = Deno.setTimeout(() => console.log('timeout'), 1000);
Deno.clearTimeout(id);
```

---

---

### 错误类型

#### Deno.errors

**类型：** `object`

提供 Deno 风格错误类型枚举。

| 错误类 | 说明 |
|--------|------|
| `Deno.errors.NotFound` | 未找到 |
| `Deno.errors.PermissionDenied` | 权限拒绝 |
| `Deno.errors.ConnectionRefused` | 连接被拒绝 |
| `Deno.errors.ConnectionReset` | 连接重置 |
| `Deno.errors.ConnectionAborted` | 连接中断 |
| `Deno.errors.AlreadyExists` | 已存在 |
| `Deno.errors.BadResource` | 资源错误 |
| `Deno.errors.BrokenPipe` | 管道断裂 |
| `Deno.errors.InvalidData` | 数据无效 |
| `Deno.errors.TimedOut` | 超时 |
| `Deno.errors.Interrupted` | 中断 |
| `Deno.errors.WriteZero` | 写入为零 |
| `Deno.errors.UnexpectedEof` | 意外 EOF |
| `Deno.errors.Other` | 其他错误 |

```javascript
try {
    Deno.readTextFile('/nonexistent');
} catch (err) {
    if (err instanceof Deno.errors.NotFound) {
        console.log('File not found');
    }
}
```

> 注意：这些是简单的 JS 构造函数，并非真正的 Error 子类。

---

### 信号常量

#### Deno.signals

**类型：** `object`

提供 POSIX 信号常量。

```javascript
console.log(Deno.signals.SIGINT);   // 2
console.log(Deno.signals.SIGTERM);  // 15
console.log(Deno.signals.SIGKILL);  // 9
```

| 常量 | 值 | 说明 |
|------|-----|------|
| `SIGHUP` | 1 | 挂起 |
| `SIGINT` | 2 | 中断 |
| `SIGQUIT` | 3 | 退出 |
| `SIGILL` | 4 | 非法指令 |
| `SIGTRAP` | 5 | 跟踪/断点 |
| `SIGABRT` | 6 | 中止 |
| `SIGBUS` | 7 | 总线错误 |
| `SIGFPE` | 8 | 浮点异常 |
| `SIGKILL` | 9 | 杀死 |
| `SIGUSR1` | 10 | 用户信号1 |
| `SIGSEGV` | 11 | 段错误 |
| `SIGUSR2` | 12 | 用户信号2 |
| `SIGPIPE` | 13 | 管道断裂 |
| `SIGALRM` | 14 | 闹钟 |
| `SIGTERM` | 15 | 终止 |
| `SIGSTKFLT` | 16 | 协处理器栈错误 |
| `SIGCHLD` | 17 | 子进程状态改变 |
| `SIGCONT` | 19 | 继续 |
| `SIGSTOP` | 17 | 停止 |
| `SIGTSTP` | 20 | 终端停止 |
| `SIGTTIN` | 21 | 后台读终端 |
| `SIGTTOU` | 22 | 后台写终端 |
| `SIGURG` | 23 | 紧急数据 |
| `SIGXCPU` | 24 | CPU 超限 |
| `SIGXFSZ` | 25 | 文件大小超限 |
| `SIGVTALRM` | 26 | 虚拟闹钟 |
| `SIGPROF` | 27 | 性能分析 |
| `SIGWINCH` | 28 | 窗口大小变化 |
| `SIGIO` | 29 | I/O 可用 |
| `SIGPWR` | 30 | 电源故障 |
| `SIGSYS` | 31 | 非法系统调用 |

---

## 未实现 API

以下 API 抛出明确的 `NotImplementedError`：

| API | 错误消息 |
|-----|----------|
| `Deno.run()` | `Deno.run is not implemented in KossJS` |
| `Deno.spawn()` | `Deno.spawn is not implemented in KossJS` |
| `Deno.permissions()` | `Deno.permissions is not implemented in KossJS (use Capability bits)` |
| `Deno.symlinkSync()` | `Deno.symlinkSync is not implemented in KossJS` |

---

## 使用示例

### 完整示例

```javascript
import Deno from 'koss:deno';

// 文件操作
Deno.writeTextFile('/tmp/deno-test.txt', 'Hello from Deno!');
const text = Deno.readTextFile('/tmp/deno-test.txt');
console.log(text);

// 文件信息
const info = Deno.stat('/tmp/deno-test.txt');
console.log(`Size: ${info.size}`);

// 当前目录
console.log(`CWD: ${Deno.cwd()}`);

// 环境变量
console.log(`PATH: ${Deno.env.PATH}`);

// 加密
const uuid = Deno.crypto.randomUUID();
console.log(`UUID: ${uuid}`);
```

### 网络服务器

```javascript
import { serve } from 'koss:deno';

const server = serve(() => new Response('Hello Deno!'), {
    port: 8080,
    hostname: '0.0.0.0'
});

console.log(`Server running on ${server.hostname}:${server.port}`);

// 5 秒后关闭
setTimeout(() => {
    server.close();
    console.log('Server closed');
}, 5000);
```

### 混合使用

```javascript
const Deno = require('koss:deno');
const io = require('koss:io');

// Deno 风格
Deno.writeTextFile('/tmp/test.txt', 'Hello');

// Koss 原生风格
const content = io.readText('/tmp/test.txt');
console.log(content);
```

---

## 相关文档

- [内置模块系统指南](/zh/guide/builtin-modules)
- [ESM Import 支持指南](/zh/guide/esm-import)
- [Node.js 兼容层参考](/zh/reference/node-compat-layer)
- [Bun 兼容层参考](/zh/reference/bun-compat-layer)
- [Koss 原生模块参考](/zh/reference/koss-native-modules)
