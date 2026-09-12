# Bun 兼容层参考

本文档详细列出 KossJS 的 Bun 兼容层（`koss:bun`）所有 API。

> **版本锚定**：基于 Bun **v1.1.x** 实现  
> **Builtin 标志**：`KOSS_BUILTIN_BUN`（`1 << 1`）  
> **文件位置**：`src/js_shims/bun_shim.js`（509 行）  
> **底层依赖**：委托 `koss:io`、`koss:crypto`、`koss:system`、`koss:zlib`、`koss:stream`、`koss:buffer` 实现

---

## 模块导入

```javascript
// ES Module (import)
import Bun from 'koss:bun';
import { version, write, file, serve } from 'koss:bun';

// CommonJS (require)
const Bun = require('koss:bun');
```

---

## API 列表

### Bun.version

**类型：** `string`  
**值：** `'1.1.42'`

返回 Bun 兼容层的版本号。

```javascript
console.log(Bun.version);  // '1.1.42'
```

---

### Bun.build

**类型：** `function`  
**状态：** ❌ 不支持（抛出错误）

`Bun.build` 需要打包器，KossJS 中调用会抛出错误：

```javascript
try {
    Bun.build({ entrypoints: ['/app.js'] });
} catch (e) {
    console.log(e.message);  // Bun.build is not implemented in KossJS (no bundler)
}
```

> 注意：旧版文档将其描述为字符串常量 `'koss-bun-compat'`，该行为已在 v0.1.0-dev.10 修正为抛错函数。

---

### Bun.env

**类型：** `object`

返回环境变量对象（底层使用 `koss:system.env()`）。

```javascript
const PATH = Bun.env.PATH;
const HOME = Bun.env.HOME;
```

---

### Bun.argv

**类型：** `string[]`

返回命令行参数列表（当前简化实现，返回空数组）。

```javascript
console.log(Bun.argv);  // []（当前为空数组）
```

---

### Bun.write(path, data)

**类型：** `function`  
**参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| `path` | `string` | 文件路径 |
| `data` | `string \| Uint8Array` | 要写入的数据 |

向文件写入数据（同步）。

```javascript
Bun.write('/tmp/hello.txt', 'Hello Bun!');
Bun.write('/tmp/data.bin', new Uint8Array([1, 2, 3]));
```

> 注意：不支持文件描述符写入，仅支持文件路径。

---

### Bun.file(path)

**类型：** `function`  
**参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| `path` | `string` | 文件路径 |

返回 File 对象，支持链式调用。

**返回值：**

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `.size()` | `number` | 文件大小（同步） |
| `.text()` | `string` | 读取为 UTF-8 文本（同步） |
| `.json()` | `any` | 解析为 JSON（同步） |
| `.arrayBuffer()` | `ArrayBuffer` | 读取为 ArrayBuffer（同步） |
| `.exists()` | `boolean` | 文件是否存在（同步） |
| `.stream()` | `Readable` | 读取为 `koss:stream` Readable 流（v0.1.0-dev.10 实现） |

```javascript
const file = Bun.file('/tmp/hello.txt');
console.log(file.size());      // 文件大小
console.log(file.text());      // 文件内容
console.log(file.json());      // JSON 解析
console.log(file.exists());    // 是否存在
```

---

### Bun.serve(options)

**类型：** `function`  
**参数：**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `options.port` | `number` | `3000` | 监听端口 |
| `options.hostname` | `string` | `'0.0.0.0'` | 监听主机 |

启动服务器（同步）。底层调用 `koss:io.serve({ port, hostname })` 且**未传入 handler**，因此实际创建的是 **TCP 监听器**而非 HTTP 服务器（handler 接线尚未实现，与 `Deno.serve` 不同）。

**返回值：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `.port` | `number` | 监听端口 |
| `.hostname` | `string` | 监听主机 |
| `.stop()` | `function` | 停止服务器 |
| `.reload(options)` | `function` | 重新加载（no-op） |
| `.ref()` | `function` | 引用计数增加 |
| `.unref()` | `function` | 引用计数减少 |

```javascript
const server = Bun.serve({ port: 3000, hostname: '0.0.0.0' });
console.log(`Server running on ${server.hostname}:${server.port}`);
server.stop();
```

---

### Bun.sleep(ms)

**类型：** `function`  
**参数：**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `ms` | `number` | — | 延迟毫秒数 |

返回 Promise，在指定毫秒后 resolve。

```javascript
await Bun.sleep(1000);  // 延迟 1 秒
console.log('1 second later');
```

---

### Bun.inspect(value)

**类型：** `function`  
**参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| `value` | `any` | 要检查的值 |

返回 JSON 格式的字符串表示。

```javascript
console.log(Bun.inspect({ a: 1, b: [2, 3] }));
// 输出：{
//   "a": 1,
//   "b": [
//     2,
//     3
//   ]
// }
```

---

### Bun.peek(iterable)

**类型：** `function`  
**参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| `iterable` | `Iterable` | 可迭代对象 |

返回可迭代对象的第一个元素，但不消耗它。如果为空则返回 `undefined`。

```javascript
const first = Bun.peek([1, 2, 3]);  // 1
const empty = Bun.peek([]);          // undefined
```

---

### Bun.which(cmd)

**类型：** `function`  
**参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| `cmd` | `string` | 命令名称 |

按 `PATH` 环境变量搜索可执行文件，返回第一个匹配的完整路径；找不到返回 `null`（v0.1.0-dev.10 由"直接返回输入"升级为真实 PATH 搜索）。Windows 下自动尝试 `.exe`/`.cmd`/`.bat`/`.com` 扩展名。

```javascript
const node = Bun.which('node');  // 例如 '/usr/local/bin/node' 或 null
```

---

### Bun.randomUUIDv7()

**类型：** `function`

生成 UUID v4 字符串。

```javascript
const uuid = Bun.randomUUIDv7();
// 例如：'550e8400-e29b-41d4-a716-446655440000'
```

---

### Bun.resolve(path)

**类型：** `function`  
**参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| `path` | `string` | 文件路径 |

当前为 no-op，**原样返回输入**，不进行路径解析（与 Bun 原版的相对路径解析行为不同）。

```javascript
const resolved = Bun.resolve('/tmp/../hello.txt');
console.log(resolved);  // '/tmp/../hello.txt'（原样返回）
```

---

### Bun.hash(algorithm, data)

**类型：** `function`  
**参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| `algorithm` | `string` | 哈希算法（`'sha256'` 等） |
| `data` | `string` | 要哈希的数据 |

计算数据的哈希值。

```javascript
const hash = Bun.hash('sha256', 'hello');
```

---

### Bun.CryptoHasher

**类型：** `class`（v0.1.0-dev.10 新增）

流式哈希器，支持 `update()` / `digest(encoding)`（`hex`/`base64`）。

```javascript
const hasher = new Bun.CryptoHasher('sha256');
hasher.update('hello ');
hasher.update('world');
const hex = hasher.digest('hex');
```

---

### Bun.Glob

**类型：** `class`（v0.1.0-dev.10 新增）

文件通配匹配，支持 `*`、`**`、`?`、`[...]` 模式。

| 方法 | 说明 |
|------|------|
| `.match(path)` | 判断路径是否匹配模式 |
| `.scan(options)` | 从 `options.cwd`（默认 `.`）递归扫描匹配文件 |

```javascript
const glob = new Bun.Glob('**/*.js');
glob.match('src/main.js');       // true
glob.scan({ cwd: './src' });     // 匹配的文件路径数组
```

---

### Bun.Cookie / Bun.CookieMap

**类型：** `class`（v0.1.0-dev.10 新增）

`Bun.Cookie(name, value, options)` 表示单个 Cookie，`toString()` 输出 Set-Cookie 格式；`Bun.CookieMap(initial)` 解析 Cookie 头。

`CookieMap` 方法：`get`/`set`/`delete`/`has`/`entries`/`size`/`[Symbol.iterator]`/`toString`。

```javascript
const map = new Bun.CookieMap('session=abc; theme=dark');
map.get('session');   // 'abc'
map.toString();       // 'session=abc; theme=dark'
```

---

### Bun.gzipSync / gunzipSync / deflateSync / inflateSync

**类型：** `function`（v0.1.0-dev.10 新增）

同步压缩/解压，底层委托 `koss:zlib`。

```javascript
const compressed = Bun.gzipSync(new Uint8Array([1, 2, 3]));
const restored = Bun.gunzipSync(compressed);
```

---

### Bun.nanoseconds()

**类型：** `function`（v0.1.0-dev.10 新增）

返回当前时间（纳秒），基于单调时钟 `__koss_performance_now`。

---

### Bun.deepEquals(a, b) / Bun.deepMatch(a, b)

**类型：** `function`（v0.1.0-dev.10 新增）

深度相等比较（支持 `Uint8Array` 字节级比较）；`deepMatch` 仅要求 `b` 中的键在 `a` 中匹配。

---

### Bun.escapeHTML(input) / Bun.stringWidth(str)

**类型：** `function`（v0.1.0-dev.10 新增）

`escapeHTML` 转义 `&<>"'`；`stringWidth` 计算字符串显示宽度（CJK 宽字符计 2）。

---

### Bun.fileURLToPath(url) / Bun.pathToFileURL(path)

**类型：** `function`（v0.1.0-dev.10 新增）

`file:` URL 与文件路径互转（Windows 下处理盘符与反斜杠）。

```javascript
const p = Bun.fileURLToPath(new URL('file:///tmp/a.txt'));  // '/tmp/a.txt'
const u = Bun.pathToFileURL('/tmp/a.txt');                   // URL('file:///tmp/a.txt')
```

---

### Bun.concatArrayBuffers(buffers) / Bun.allocUnsafe(size)

**类型：** `function`（v0.1.0-dev.10 新增）

`concatArrayBuffers` 拼接多个 ArrayBuffer；`allocUnsafe` 分配指定字节数的 ArrayBuffer。

---

### Buffer BigInt 读写（v0.1.0-dev.10 新增）

Bun shim 使用的 `koss:buffer` 新增 BigInt 读写方法：`readBigInt64LE`/`readBigInt64BE`/`readBigUInt64LE`/`readBigUInt64BE`/`writeBigInt64LE`/`writeBigInt64BE`/`writeBigUInt64LE`/`writeBigUInt64BE`。

```javascript
const buf = Buffer.from([0, 0, 0, 0, 0, 0, 0, 1]);
buf.readBigUInt64LE();  // 1n
```

---

### Bun.malloc(size)

**类型：** `function`  
**状态：** ❌ 不支持（抛出错误）

```javascript
try {
    Bun.malloc(1024);
} catch (e) {
    console.log(e.message);  // Bun malloc is not implemented in KossJS
}
```

---

### Bun.gc()

**类型：** `function`  
**状态：** ❌ 不支持（抛出错误）

```javascript
try {
    Bun.gc();
} catch (e) {
    console.log(e.message);  // Bun.gc is not implemented in KossJS
}
```

---

### Bun.readable(path)

**类型：** `function`  
**状态：** ❌ 不支持（抛出错误）

```javascript
try {
    Bun.readable('/tmp/file.txt');
} catch (e) {
    console.log(e.message);  // ReadableStream is not supported
}
```

---

## 未实现 API

以下 API 抛出明确的 `NotImplementedError`：

| API | 错误消息 |
|-----|----------|
| `Bun.sql()` | `Bun.sql is not implemented in KossJS (requires SQLite)` |
| `Bun.spawn()` | `Bun.spawn is not implemented in KossJS (requires child_process)` |
| `Bun.build()` | `Bun.build is not implemented in KossJS (no bundler)` |
| `Bun.malloc(size)` | `Bun malloc is not implemented in KossJS` |
| `Bun.gc()` | `Bun.gc is not implemented in KossJS` |
| `Bun.readable(path)` | `ReadableStream is not supported in KossJS` |

---

## 使用示例

### 完整示例

```javascript
import { version, write, file, serve, sleep } from 'koss:bun';

// 版本信息
console.log(`Bun v${version}`);

// 写入文件
Bun.write('/tmp/bun-test.txt', 'Hello from Bun!');

// 读取文件
const content = Bun.file('/tmp/bun-test.txt').text();
console.log(content);

// 延迟
await Bun.sleep(500);

// 启动服务器
const server = Bun.serve({ port: 3000 });
console.log(`Listening on port ${server.port}`);
```

### 混合使用

```javascript
const io = require('koss:io');
const Bun = require('koss:bun');

// Bun 文件操作
Bun.write('/tmp/data.json', JSON.stringify({ hello: 'bun' }));

// Koss 原生文件操作
const data = io.readText('/tmp/data.json');
console.log(data);
```

---

## 相关文档

- [内置模块系统指南](/zh/guide/builtin-modules)
- [ESM Import 支持指南](/zh/guide/esm-import)
- [Node.js 兼容层参考](/zh/reference/node-compat-layer)
- [Deno 兼容层参考](/zh/reference/deno-compat-layer)
- [Koss 原生模块参考](/zh/reference/koss-native-modules)
