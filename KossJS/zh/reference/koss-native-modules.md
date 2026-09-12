# Koss 原生模块参考

本文档详细列出 KossJS 的 23 个标准库模块（`koss:*`）及其 API。

> **Builtin 标志**：`KOSS_BUILTIN_KOSS`（`1 << 3`）  
> **设计原则**：同步优先、纯 Uint8Array、零外部依赖

---

## 模块总览

| 模块 | 导入路径 | 说明 |
|------|----------|------|
| koss:assert | `require('koss:assert')` | 断言库 |
| koss:buffer | `require('koss:buffer')` | Buffer 与二进制数据 |
| koss:constants | `require('koss:constants')` | 系统常量 |
| koss:crypto | `require('koss:crypto')` | 加密与安全 |
| koss:data | `require('koss:data')` | 数据编码（Hex/Base64） |
| koss:diagnostics_channel | `require('koss:diagnostics_channel')` | 诊断通道 |
| koss:events | `require('koss:events')` | 事件发射器 |
| koss:ffi | `require('koss:ffi')` | 外部函数接口 |
| koss:http | `require('koss:http')` | HTTP 服务器与客户端 |
| koss:io | `require('koss:io')` | 统一 I/O（文件+网络+流） |
| koss:net | `require('koss:net')` | TCP 网络 |
| koss:os | `require('koss:os')` | 操作系统信息（独立模块，内部委派 `koss:system`，另含 version/machine/availableParallelism/devNull 等） |
| koss:path | `require('koss:path')` | 路径处理 |
| koss:process | `require('koss:process')` | 进程信息与环境 |
| koss:querystring | `require('koss:querystring')` | 查询字符串 |
| koss:stream | `require('koss:stream')` | 流操作 |
| koss:string_decoder | `require('koss:string_decoder')` | 字符串解码器 |
| koss:system | `require('koss:system')` | 系统与进程 |
| koss:timers | `require('koss:timers')` | 定时器 |
| koss:trace_events | `require('koss:trace_events')` | 追踪事件 |
| koss:url | `require('koss:url')` | URL 解析 |
| koss:util | `require('koss:util')` | 工具函数 |
| koss:zlib | `require('koss:zlib')` | 压缩/解压 |

---

## koss:io — 统一 I/O 模块

**导入：** `require('koss:io')` 或 `import io from 'koss:io'`

### 文件操作

所有文件操作均为同步 API。

| 函数 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `read(path)` | `string` | `Uint8Array` | 读取文件为字节数组 |
| `readText(path)` | `string` | `string` | 读取文件为 UTF-8 文本 |
| `write(path, data)` | `string, string\|Uint8Array` | `void` | 写入文件 |
| `writeText(path, text)` | `string, string` | `void` | 写入文本文件 |
| `stat(path)` | `string` | `StatObject` | 获取文件元数据 |
| `lstat(path)` | `string` | `StatObject` | 获取符号链接状态 |
| `realpath(path)` | `string` | `string` | 解析真实路径 |
| `symlink(target, path, type?)` | `string, string, string?` | `void` | 创建符号链接 |
| `readlink(path)` | `string` | `string` | 读取符号链接目标 |
| `append(path, data, isBase64?)` | `string, string, boolean?` | `void` | 追加写入（v0.1.0-dev.10 底层 `__koss_fs_append`） |
| `chmod(path, mode)` | `string, number` | `void` | 修改文件权限 |
| `truncate(path, len?)` | `string, number?` | `void` | 截断文件 |
| `mkdtemp(prefix)` | `string` | `string` | 创建临时目录 |
| `list(path)` | `string` | `string[]` | 列出目录内容 |
| `mkdir(path, options?)` | `string, object?` | `void` | 创建目录 |
| `rm(path, options?)` | `string, object?` | `void` | 删除文件/目录 |
| `cp(src, dst)` | `string, string` | `void` | 复制文件 |
| `mv(src, dst)` | `string, string` | `void` | 移动/重命名 |
| `exists(path)` | `string` | `boolean` | 检查文件是否存在 |
| `watch(path, callback)` | `string, function` | `Watcher` | 文件监控（轮询） |

**StatObject 结构：**

```javascript
{
    size: number,       // 文件大小（字节）
    mtime: number,      // 修改时间（毫秒时间戳）
    ctime: number,      // 创建时间（毫秒时间戳）
    isFile: boolean,    // 是否为文件
    isDir: boolean,     // 是否为目录
    isSymlink: boolean, // 是否为符号链接
}
```

### 网络操作

| 函数 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `connect(host, port)` | `string, number` | `Socket` | 建立 TCP 连接 |
| `serve(options, handler?)` | `object, function?` | `Server` | 启动服务器：无 handler 时创建 TCP 监听器；传入 handler 时接线完整 HTTP 服务器（`Deno.serve` 使用此模式） |
| `fetch(url, options?)` | `string, object?` | `Response` | HTTP 请求 |
| `dns(hostname)` | `string` | `string` | DNS 解析 |

### 流操作

| API | 类型 | 说明 |
|-----|------|------|
| `ReadStream` | `class` | 可读流 |
| `WriteStream` | `class` | 可写流 |
| `createReadStream(path)` | `function` | 创建可读流 |
| `createWriteStream(path)` | `function` | 创建可写流 |
| `pipeline(src, dst)` | `function` | 流管道传输 |

### 使用示例

```javascript
const io = require('koss:io');

io.writeText('/tmp/hello.txt', 'Hello KossJS!');
const text = io.readText('/tmp/hello.txt');
const info = io.stat('/tmp/hello.txt');

io.write('/tmp/data.bin', new Uint8Array([1, 2, 3]));
const bytes = io.read('/tmp/data.bin');

io.mkdir('/tmp/testdir', { recursive: true });
const entries = io.list('/tmp');
```

---

## koss:buffer — Buffer 与二进制模块

**导入：** `require('koss:buffer')` 或 `import { Buffer } from 'koss:buffer'`

| API | 类型 | 说明 |
|-----|------|------|
| `Buffer` | `class` | Node.js 兼容 Buffer 类 |
| `Buffer.from(value, encoding)` | `function` | 创建 Buffer |
| `Buffer.alloc(size, fill, encoding)` | `function` | 分配 Buffer |
| `Buffer.allocUnsafe(size)` | `function` | 未初始化分配 |
| `Buffer.byteLength(string, encoding)` | `function` | 获取字节长度 |
| `Buffer.concat(list, totalLength)` | `function` | 拼接 Buffer 列表 |
| `Buffer.compare(buf1, buf2)` | `function` | 比较 Buffer |
| `Buffer.isBuffer(obj)` | `function` | 判断是否为 Buffer |
| `Buffer.isEncoding(encoding)` | `function` | 判断是否支持编码 |
| `Blob` | `class` | Web Blob 实现 |
| `File` | `class` | Web File 实现 |
| `atob(data)` | `function` | Base64 解码 |
| `btoa(data)` | `function` | Base64 编码 |

---

## koss:crypto — 加密与安全模块

**导入：** `require('koss:crypto')` 或 `import crypto from 'koss:crypto'`

| 函数 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `hash(algorithm, data)` | `string, string` | `string` | 计算哈希 |
| `hashHex(algorithm, data)` | `string, string` | `string` | 计算哈希返回 hex 字符串 |
| `hashBytes(algorithm, data)` | `string, Uint8Array` | `Uint8Array` | 计算哈希返回字节数组 |
| `hmac(algorithm, key, data)` | `string, string, string` | `string` | HMAC 计算 |
| `hmacHex(algorithm, key, data)` | `string, string, string` | `string` | HMAC 计算返回 hex |
| `hmacBytes(algorithm, key, data)` | `string, string, Uint8Array` | `Uint8Array` | HMAC 计算返回字节数组 |
| `randomBytes(n)` | `number` | `Uint8Array` | 生成 n 字节随机数 |
| `uuid()` | — | `string` | 生成 UUID v4 |
| `pbkdf2(password, salt, iterations, keylen)` | `string, string, number, number` | `Uint8Array` | PBKDF2 密钥派生 |
| `sign(privateKey, data)` | `string, string` | `Uint8Array` | Ed25519 签名 |
| `verify(publicKey, data, signature)` | `string, string, Uint8Array` | `boolean` | Ed25519 验证 |
| `ed25519KeyPair()` | — | `{ publicKey, privateKey }` | 生成 Ed25519 密钥对（v0.1.0-dev.10 新增） |
| `encrypt(key, plaintext, options?)` | `Uint8Array, Uint8Array, object?` | `Uint8Array` | AES-GCM 加密（`options.nonce`/`options.aad`） |
| `decrypt(key, data, options?)` | `Uint8Array, Uint8Array, object?` | `Uint8Array` | AES-GCM 解密 |
| `createCipher(algorithm, key, iv)` | `string, Uint8Array, Uint8Array` | `object` | 流式加密对象（update/final/getAuthTag） |
| `createDecipher(algorithm, key, iv)` | `string, Uint8Array, Uint8Array` | `object` | 流式解密对象（update/final/setAuthTag） |
| `timingSafeEqual(a, b)` | `Uint8Array, Uint8Array` | `boolean` | 恒定时间比较 |
| `algorithms` | — | `string[]` | 支持的哈希算法列表 |

---

## koss:system — 系统与进程模块

**导入：** `require('koss:system')` 或 `import system from 'koss:system'`

| 函数 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `arch()` | — | `string` | CPU 架构 |
| `platform()` | — | `string` | 操作系统平台 |
| `hostname()` | — | `string` | 主机名 |
| `cpus()` | — | `object[]` | CPU 信息列表 |
| `memory()` | — | `{total, free, used}` | 内存使用情况 |
| `uptime()` | — | `number` | 进程运行时间（秒） |
| `loadavg()` | — | `[number, number, number]` | 系统负载 |
| `env(key?)` | `string?` | `string \| object` | 环境变量 |
| `pid()` | — | `number` | 当前进程 ID |
| `exit(code?)` | `number?` | 不返回 | 退出进程 |
| `cwd()` | — | `string` | 当前工作目录 |
| `chdir(path)` | `string` | `void` | 切换工作目录 |
| `version()` | — | `string` | 版本字符串 |
| `versions()` | — | `object` | 各组件版本信息 |
| `nextTick(fn)` | `function` | `void` | 下一微任务执行 |

---

## koss:data — 数据与编码模块

**导入：** `require('koss:data')` 或 `import data from 'koss:data'`

全部基于纯 `Uint8Array` 实现。

| 函数 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `encode(text)` | `string` | `Uint8Array` | 文本编码为字节 |
| `decode(bytes)` | `Uint8Array` | `string` | 字节解码为文本 |
| `concat(...buffers)` | `Uint8Array...` | `Uint8Array` | 拼接字节数组 |
| `compare(a, b)` | `Uint8Array, Uint8Array` | `number` | 比较字节数组 |
| `isEqual(a, b)` | `Uint8Array, Uint8Array` | `boolean` | 判断相等 |
| `toHex(bytes)` | `Uint8Array` | `string` | 转十六进制字符串 |
| `fromHex(hex)` | `string` | `Uint8Array` | 十六进制转字节数组 |
| `toBase64(bytes)` | `Uint8Array` | `string` | 转 Base64 |
| `fromBase64(b64)` | `string` | `Uint8Array` | Base64 转字节数组 |

---

## koss:events — 事件发射器模块

**导入：** `require('koss:events')` 或 `import { EventEmitter } from 'koss:events'`

| API | 类型 | 说明 |
|-----|------|------|
| `EventEmitter` | `class` | 事件发射器基类 |
| `EventEmitter.defaultMaxListeners` | `number` | 默认最大监听器数 |
| `once(emitter, event)` | `function` | 一次性监听 |
| `listenerCount(emitter, event)` | `function` | 监听器计数 |

---

## koss:net — TCP 网络模块

**导入：** `require('koss:net')` 或 `import { Socket } from 'koss:net'`

| API | 类型 | 说明 |
|-----|------|------|
| `Socket` | `class` | TCP Socket 类 |
| `Server` | `class` | TCP 服务器类 |
| `connect(options, connectListener)` | `function` | 创建 TCP 连接 |
| `createConnection(options, connectListener)` | `function` | 创建连接 |
| `createServer(options, connectionListener)` | `function` | 创建 TCP 服务器 |
| `isIP(input)` | `function` | 判断是否为 IP |

---

## koss:http — HTTP 模块

**导入：** `require('koss:http')` 或 `import http from 'koss:http'`

| API | 类型 | 说明 |
|-----|------|------|
| `createServer(options, requestListener)` | `function` | 创建 HTTP 服务器 |
| `request(options, callback)` | `function` | HTTP 客户端请求 |
| `get(url, options, callback)` | `function` | HTTP GET 请求 |
| `Server` | `class` | HTTP 服务器类 |
| `IncomingMessage` | `class` | HTTP 请求消息类 |
| `ServerResponse` | `class` | HTTP 响应消息类 |
| `METHODS` | `string[]` | 支持的 HTTP 方法 |
| `STATUS_CODES` | `object` | HTTP 状态码映射 |

---

## koss:path — 路径处理模块

**导入：** `require('koss:path')` 或 `import path from 'koss:path'`

| API | 类型 | 说明 |
|-----|------|------|
| `sep` | `string` | 路径分隔符 |
| `delimiter` | `string` | 路径定界符 |
| `resolve(...paths)` | `function` | 解析为绝对路径 |
| `normalize(path)` | `function` | 规范路径格式 |
| `isAbsolute(path)` | `function` | 判断是否为绝对路径 |
| `join(...paths)` | `function` | 拼接路径片段 |
| `relative(from, to)` | `function` | 计算相对路径 |
| `dirname(path)` | `function` | 获取目录名 |
| `basename(path, ext)` | `function` | 获取文件名 |
| `extname(path)` | `function` | 获取文件扩展名 |
| `format(pathObj)` | `function` | 路径对象转字符串 |
| `parse(path)` | `function` | 路径字符串转对象 |
| `win32` | `object` | Windows 风格路径操作 |
| `posix` | `object` | POSIX 风格路径操作 |

---

## koss:stream — 流操作模块

**导入：** `require('koss:stream')` 或 `import { Readable } from 'koss:stream'`

| API | 类型 | 说明 |
|-----|------|------|
| `Readable` | `class` | 可读流 |
| `Writable` | `class` | 可写流 |
| `Duplex` | `class` | 双工流 |
| `Transform` | `class` | 转换流 |
| `PassThrough` | `class` | 直通流 |
| `pipeline(...streams, callback)` | `function` | 流管道传输 |
| `finished(stream, options, callback)` | `function` | 流完成事件 |

---

## koss:process — 进程模块

**导入：** `require('koss:process')` 或 `import process from 'koss:process'`

| API | 类型 | 说明 |
|-----|------|------|
| `process` | `object` | 全局 process 对象引用 |

---

## koss:timers — 定时器模块

**导入：** `require('koss:timers')` 或 `import { setTimeout } from 'koss:timers'`

| API | 类型 | 说明 |
|-----|------|------|
| `setTimeout(callback, delay, ...args)` | `function` | 设置超时 |
| `clearTimeout(id)` | `function` | 清除超时 |
| `setInterval(callback, delay, ...args)` | `function` | 设置间隔 |
| `clearInterval(id)` | `function` | 清除间隔 |
| `setImmediate(callback, ...args)` | `function` | 设置立即执行 |
| `clearImmediate(id)` | `function` | 清除立即执行 |

---

## koss:url — URL 模块

**导入：** `require('koss:url')` 或 `import { URL } from 'koss:url'`

| API | 类型 | 说明 |
|-----|------|------|
| `URL` | `class` | Web URL 类 |
| `URLSearchParams` | `class` | URL 查询参数类 |
| `parse(urlStr, ...)` | `function` | URL 解析 |
| `format(urlObj, ...)` | `function` | URL 格式化 |
| `resolve(from, to)` | `function` | URL 解析 |
| `fileURLToPath(url)` | `function` | 文件 URL 转路径 |
| `pathToFileURL(path)` | `function` | 路径转文件 URL |

---

## koss:util — 工具函数模块

**导入：** `require('koss:util')` 或 `import { format } from 'koss:util'`

| API | 类型 | 说明 |
|-----|------|------|
| `format(format, ...args)` | `function` | 字符串格式化 |
| `inspect(obj, options)` | `function` | 对象检查 |
| `deprecate(fn, msg)` | `function` | 弃用警告 |
| `promisify(fn)` | `function` | 回调转 Promise |
| `callbackify(fn)` | `function` | Promise 转回调 |
| `inherits(ctor, superCtor)` | `function` | 原型继承 |
| `debuglog(section)` | `function` | 调试日志 |
| `stripVTControlCharacters(str)` | `function` | 移除 VT 控制字符 |
| `AbortController` | `class` | 中止控制器 |
| `AbortSignal` | `class` | 中止信号 |
| `types.*` | `object` | 类型判断函数 |

---

## koss:zlib — 压缩/解压模块

**导入：** `require('koss:zlib')` 或 `import { gzipSync } from 'koss:zlib'`

| API | 类型 | 说明 |
|-----|------|------|
| `gzipSync(data, options)` | `function` | 同步 gzip 压缩 |
| `gunzipSync(data, options)` | `function` | 同步 gzip 解压 |
| `deflateSync(data, options)` | `function` | 同步 deflate 压缩 |
| `inflateSync(data, options)` | `function` | 同步 deflate 解压 |
| `brotliCompressSync(data, options)` | `function` | 同步 brotli 压缩 |
| `brotliDecompressSync(data, options)` | `function` | 同步 brotli 解压 |
| `gzip(data, options, callback)` | `function` | 异步 gzip 压缩 |
| `gunzip(data, options, callback)` | `function` | 异步 gzip 解压 |
| `createGzip(opts)` | `function` | 创建 gzip 转换流 |
| `createGunzip(opts)` | `function` | 创建 gunzip 转换流 |
| `createBrotliCompress(opts)` | `function` | 创建 brotli 压缩流 |
| `createBrotliDecompress(opts)` | `function` | 创建 brotli 解压流 |
| `constants` | `object` | zlib 常量 |
| `crc32(data)` | `function` | 计算 CRC32 校验和 |

---

## koss:ffi — 外部函数接口模块

**导入：** `require('koss:ffi')` 或 `import ffi from 'koss:ffi'`

> **Stable 模式**：`stable=true` 时不可用

| 函数 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `open(path)` | `string` | `NativeLib` | 打开动态库 |
| `malloc(size)` | `number` | `Pointer` | 分配内存 |
| `free(pointer)` | `Pointer` | `void` | 释放内存 |

---

## koss:assert — 断言模块

**导入：** `require('koss:assert')` 或 `import assert from 'koss:assert'`

| API | 类型 | 说明 |
|-----|------|------|
| `assert(value, message)` | `function` | 断言 |
| `ok(value, message)` | `function` | 断言为真 |
| `equal(actual, expected, message)` | `function` | 等于断言 |
| `strictEqual(actual, expected, message)` | `function` | 严格相等断言 |
| `deepEqual(actual, expected, message)` | `function` | 深度相等断言 |
| `throws(fn, error, message)` | `function` | 断言抛出异常 |
| `rejects(asyncFn, error, message)` | `function` | 断言 Promise 拒绝 |
| `AssertionError` | `class` | 断言错误类 |

---

## koss:constants — 常量模块

**导入：** `require('koss:constants')`

| API | 类型 | 说明 |
|-----|------|------|
| `constants.fs` | `object` | 文件系统常量 |
| `constants.os` | `object` | 操作系统常量 |

---

## koss:trace_events — 追踪事件模块

**导入：** `require('koss:trace_events')`

| API | 类型 | 说明 |
|-----|------|------|
| `createTracing(options)` | `function` | 创建追踪 |
| `getEnabledCategories()` | `function` | 获取已启用类别 |
| `Tracing` | `class` | 追踪类 |

---

## koss:diagnostics_channel — 诊断通道模块

**导入：** `require('koss:diagnostics_channel')`

| API | 类型 | 说明 |
|-----|------|------|
| `channel(name)` | `function` | 获取/创建通道 |
| `Channel` | `class` | 通道类 |

---

## koss:string_decoder — 字符串解码器模块

**导入：** `require('koss:string_decoder')`

| API | 类型 | 说明 |
|-----|------|------|
| `StringDecoder` | `class` | 字符串解码器 |

---

## 内部原生层（`__koss_*` 全局函数）

> **说明：** 以下函数由 Rust 运行时注入到每个实例的 `globalThis`，是 `koss:*` 标准库与兼容层 shim 的底层实现。**面向用户的代码无需直接调用**；本表仅供阅读源码、调试与安全审计参考（v0.1.0-dev.10 新增 fd/UDP/DNS/性能族）。

### fd 级文件系统（`__koss_fd_*`，per-instance fd 表）

| 函数 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `__koss_fd_open(path, flags)` | `string, number` | `fd` | 打开文件返回文件描述符（flags 为 O_* 位掩码） |
| `__koss_fd_read(fd, length)` | `number, number` | `{ code, value }` | 从 fd 读取（value 为 base64；EOF 时 code=2） |
| `__koss_fd_write(fd, data, is_base64)` | `number, string, boolean` | `{ code, value }` | 写入 fd，value 为写入字节数 |
| `__koss_fd_close(fd)` | `number` | `{ code }` | 关闭 fd |
| `__koss_fd_sync(fd)` | `number` | `{ code }` | fsync 同步到磁盘 |
| `__koss_fd_truncate(fd, len)` | `number, number` | `{ code }` | 按长度截断 |
| `__koss_fd_fstat(fd)` | `number` | `{ code, value }` | 通过 fd 获取 stat（value 为 JSON 字符串） |

### 路径级文件系统（`__koss_fs_*`）

| 函数 | 说明 |
|------|------|
| `__koss_fs_exists(path)` | 检查存在（需 FS_READ） |
| `__koss_fs_read(path)` | 读取文件（base64） |
| `__koss_fs_write(path, data, is_base64)` | 写入文件 |
| `__koss_fs_append(path, data, is_base64)` | 追加写入（v0.1.0-dev.10 新增） |
| `__koss_fs_stat(path)` / `__koss_fs_mkdir(path, opts)` / `__koss_fs_readdir(path)` / `__koss_fs_unlink(path)` / `__koss_fs_rename(a, b)` / `__koss_fs_copy(a, b)` / `__koss_fs_realpath(path)` | 对应文件操作 |

### UDP（`__koss_udp_*`，v0.1.0-dev.10 新增）

真实 UDP 收发，Windows 下基于 WinSock2。供 `koss:node/dgram` 使用。

| 函数 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `__koss_udp_create(type)` | `string` | `fd` | 创建 UDP socket（`udp4`/`udp6`） |
| `__koss_udp_bind(fd, address, port)` | `number, string, number` | `{ code }` | 绑定地址端口 |
| `__koss_udp_send(fd, data, is_base64, address, port)` | `number, string, boolean, string, number` | `{ code, value }` | 发送数据报 |
| `__koss_udp_recv(fd, max_len)` | `number, number` | `{ code, value, from }` | 接收数据报（from 为 `addr:port`；无数据 code=2） |
| `__koss_udp_close(fd)` | `number` | — | 关闭 socket |
| `__koss_udp_address(fd)` | `number` | `string \| undefined` | 获取本地 `addr:port` |

### DNS（`__koss_dns_*`，v0.1.0-dev.10 新增）

| 函数 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `__koss_dns_lookup(hostname)` | `string` | `string` | 域名解析，返回 IP 地址 JSON 数组字符串 |
| `__koss_dns_lookup_service(addr)` | `string` | `string \| undefined` | 反向解析（getnameinfo），返回主机名 |

### 性能时钟（`__koss_performance_*`，v0.1.0-dev.10 新增）

| 函数 | 说明 |
|------|------|
| `__koss_performance_now()` | 单调递增高精度时钟（毫秒），不受系统时间调整影响 |
| `__koss_performance_timeorigin()` | 性能时间原点（毫秒） |

> 供 `koss:node/perf_hooks` 的 `performance.now()`、`Histogram`、`monitorEventLoopDelay` 与 `Bun.nanoseconds()` 使用。

### C ABI 导出：`koss_register_fetch`

除上述 `__koss_*` 全局函数外，v0.1.0-dev.10 还在 C ABI 层新增 `koss_register_fetch`（`src/runtime.rs`），用于注册自定义 fetch 实现。当前未在 `include/kossjs.h` 声明，也未包装进 Python/TypeScript 接口。

---

## 使用示例

### Koss 原生风格

```javascript
const io = require('koss:io');
const crypto = require('koss:crypto');
const sys = require('koss:system');
const data = require('koss:data');

io.writeText('/tmp/secret.txt', 'Hello World');
const content = io.readText('/tmp/secret.txt');
const hash = crypto.hash('sha256', content);
const hex = data.toHex(hash);
console.log(`SHA256: ${hex}`);
console.log(`${sys.platform()} / ${sys.arch()}`);
```

### ESM 风格

```javascript
import { read, write } from 'koss:io';
import { hash, randomBytes } from 'koss:crypto';
import { arch, platform } from 'koss:system';

const sha256 = hash('sha256', 'data');
const mem = memory();
console.log(platform(), arch());
```

---

## 相关文档

- [内置模块系统指南](/zh/guide/builtin-modules)
- [ESM Import 支持指南](/zh/guide/esm-import)
- [Node.js 兼容层参考](/zh/reference/node-compat-layer)
- [Bun 兼容层参考](/zh/reference/bun-compat-layer)
- [Deno 兼容层参考](/zh/reference/deno-compat-layer)
