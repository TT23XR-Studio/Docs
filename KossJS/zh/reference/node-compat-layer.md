# Node.js 兼容层参考

本文档详细列出 KossJS 的 Node.js 兼容层（`koss:node/*`）所有模块及其导出的 API。

> **版本锚定**：基于 Node.js **v20.x LTS** 实现  
> **Builtin 标志**：`KOSS_BUILTIN_NODE`（`1 << 0`）  
> **架构**：所有模块底层委托 `koss:*` 标准库实现（参见 [Koss 原生模块参考](/zh/reference/koss-native-modules)）

---

## 模块总览

| 模块 | 导入路径 | 实现 | 行数 |
|------|----------|------|------|
| assert | `koss:node/assert` | 委托 `koss:assert` | 10 |
| buffer | `koss:node/buffer` | 委托 `koss:buffer` | 19 |
| console | `koss:node/console` | 返回全局 `console` 对象 | 9 |
| constants | `koss:node/constants` | 委托 `koss:constants` | 10 |
| crypto | `koss:node/crypto` | 内联 JS polyfill | 257 |
| dgram | `koss:node/dgram` | 内联 JS polyfill（真实 UDP，`__koss_udp_*`） | 201 |
| diagnostics_channel | `koss:node/diagnostics_channel` | 委托 `koss:diagnostics_channel` | 10 |
| dns | `koss:node/dns` | 内联 JS polyfill | 160 |
| events | `koss:node/events` | 委托 `koss:events` | 16 |
| fs | `koss:node/fs` | 委托 `koss:io` + fd 级原生层 | 581 |
| http | `koss:node/http` | 委托 `koss:http` | 10 |
| https | `koss:node/https` | 显式抛 `_unsupported` | 38 |
| net | `koss:node/net` | 委托 `koss:net` | 10 |
| os | `koss:node/os` | 委托 `koss:os` | 10 |
| path | `koss:node/path` | 委托 `koss:path` | 10 |
| perf_hooks | `koss:node/perf_hooks` | 内联 JS shim（单调时钟） | 227 |
| process | `koss:node/process` | 委托 `koss:process` | 10 |
| querystring | `koss:node/querystring` | 委托 `koss:querystring` | 10 |
| stream | `koss:node/stream` | 委托 `koss:stream` | 10 |
| stream/consumers | `koss:node/stream/consumers` | 内联 JS polyfill | 90 |
| stream/promises | `koss:node/stream/promises` | 内联 JS polyfill | 52 |
| string_decoder | `koss:node/string_decoder` | 委托 `koss:string_decoder` | 10 |
| timers | `koss:node/timers` | 委托 `koss:timers` | 10 |
| timers/promises | `koss:node/timers/promises` | 内联 JS polyfill | 123 |
| tls | `koss:node/tls` | 显式抛 `_unsupported` | 43 |
| trace_events | `koss:node/trace_events` | 委托 `koss:trace_events` | 10 |
| url | `koss:node/url` | 委托 `koss:url` | 10 |
| util | `koss:node/util` | 委托 `koss:util` | 10 |
| zlib | `koss:node/zlib` | 委托 `koss:zlib` | 10 |

---

## 模块 API 列表

### koss:node/fs — 文件系统

**导入：** `require('koss:node/fs')` 或 `import fs from 'koss:node/fs'`

| API | 类型 | 说明 |
|-----|------|------|
| `readFileSync(path, options)` | `function` | 同步读取文件 |
| `writeFileSync(path, data, options)` | `function` | 同步写入文件 |
| `appendFileSync(path, data, options)` | `function` | 同步追加文件 |
| `existsSync(path)` | `function` | 检查文件是否存在 |
| `statSync(path, options)` | `function` | 获取文件状态 |
| `lstatSync(path, options)` | `function` | 获取符号链接状态 |
| `mkdirSync(path, options)` | `function` | 创建目录 |
| `rmdirSync(path, options)` | `function` | 删除目录 |
| `unlinkSync(path)` | `function` | 删除文件 |
| `readdirSync(path, options)` | `function` | 读取目录列表 |
| `renameSync(oldPath, newPath)` | `function` | 重命名文件/目录 |
| `realpathSync(path, options)` | `function` | 解析真实路径 |
| `copyFileSync(src, dst, mode)` | `function` | 复制文件 |
| `chmodSync(path, mode)` | `function` | 修改文件权限 |
| `accessSync(path, mode)` | `function` | 检查文件访问权限 |
| `mkdtempSync(prefix, options)` | `function` | 创建临时目录 |
| `truncateSync(path, len)` | `function` | 截断文件 |
| `fstatSync(fd)` | `function` | 获取文件描述符状态 |
| `readFile(path, options, callback)` | `function` | 异步读取文件 |
| `writeFile(path, data, options, callback)` | `function` | 异步写入文件 |
| `appendFile(path, data, options, callback)` | `function` | 异步追加文件 |
| `exists(path, callback)` | `function` | 异步检查文件存在 |
| `stat(path, options, callback)` | `function` | 异步获取文件状态 |
| `lstat(path, options, callback)` | `function` | 异步获取符号链接状态 |
| `mkdir(path, options, callback)` | `function` | 异步创建目录 |
| `rmdir(path, options, callback)` | `function` | 异步删除目录 |
| `unlink(path, callback)` | `function` | 异步删除文件 |
| `readdir(path, options, callback)` | `function` | 异步读取目录列表 |
| `rename(oldPath, newPath, callback)` | `function` | 异步重命名 |
| `realpath(path, options, callback)` | `function` | 异步解析真实路径 |
| `copyFile(src, dst, mode, callback)` | `function` | 异步复制文件 |
| `access(path, mode, callback)` | `function` | 异步检查访问权限 |
| `chmod(path, mode, callback)` | `function` | 异步修改权限 |
| `promises` | `object` | Promise API（readFile/writeFile 等） |
| `constants` | `object` | 文件系统常量 |
| `watch(filename, options, listener)` | `function` | 文件监控 |
| `watchFile(filename, options, listener)` | `function` | 文件监控（轮询） |
| `unwatchFile(filename, listener)` | `function` | 取消文件监控 |
| `createReadStream(path, options)` | `function` | 创建可读流（基于 fd 级读写） |
| `createWriteStream(path, options)` | `function` | 创建可写流（基于 fd 级读写） |
| `openSync(path, flags, mode)` | `function` | 打开文件返回文件描述符（fd） |
| `closeSync(fd)` | `function` | 关闭文件描述符 |
| `readSync(fd, buffer, offset, length, position)` | `function` | 从 fd 读取数据 |
| `writeSync(fd, buffer, offset, length, position)` | `function` | 向 fd 写入数据 |
| `fsyncSync(fd)` | `function` | 同步 fd 到磁盘 |
| `ftruncateSync(fd, len)` | `function` | 截断 fd 指向的文件 |
| `open(path, flags, mode, callback)` | `function` | 异步打开文件 |
| `close(fd, callback)` | `function` | 异步关闭 fd |
| `Stats` | `class` | 文件状态类（isFile/isDirectory 等） |
| `Dirent` | `class` | 目录项类（withFileTypes 时返回） |

> **fd 级 API 说明：** `openSync` 等底层使用 `__koss_fd_open/read/write/close/sync/truncate/fstat` 原生函数（v0.1.0-dev.10 新增），按 fd 维护 per-instance 打开文件表。`fs.promises` 另含 `open`、`close`、`mkdtemp`。

---

### koss:node/path — 路径处理

**导入：** `require('koss:node/path')`

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
| `win32` | `object` | Windows 风格路径操作对象 |
| `posix` | `object` | POSIX 风格路径操作对象 |

---

### koss:node/buffer — Buffer 类

**导入：** `require('koss:node/buffer')`

| API | 类型 | 说明 |
|-----|------|------|
| `Buffer` | `class` | Node.js Buffer 类 |
| `Buffer.from(value, encoding)` | `function` | 创建 Buffer |
| `Buffer.alloc(size, fill, encoding)` | `function` | 分配 Buffer |
| `Buffer.allocUnsafe(size)` | `function` | 未初始化分配 |
| `Buffer.byteLength(string, encoding)` | `function` | 获取字节长度 |
| `Buffer.concat(list, totalLength)` | `function` | 拼接 Buffer 列表 |
| `Buffer.compare(buf1, buf2)` | `function` | 比较 Buffer |
| `Buffer.isBuffer(obj)` | `function` | 判断是否为 Buffer |
| `Buffer.isEncoding(encoding)` | `function` | 判断是否支持编码 |
| `Buffer.poolSize` | `number` | Buffer 池大小 |
| `Blob` | `class` | Web Blob 实现 |
| `File` | `class` | Web File 实现 |
| `INSPECT_MAX_BYTES` | `number` | 最大检查字节数 |
| `resolveObjectURL(url)` | `function` | 解析对象 URL |
| `atob(data)` | `function` | Base64 解码 |
| `btoa(data)` | `function` | Base64 编码 |
| `kMaxLength` | `number` | Buffer 最大长度 |
| `kStringMaxLength` | `number` | 字符串最大长度 |

---

### koss:node/events — 事件发射器

**导入：** `require('koss:node/events')`

| API | 类型 | 说明 |
|-----|------|------|
| `EventEmitter` | `class` | 事件发射器基类 |
| `EventEmitter.defaultMaxListeners` | `number` | 默认最大监听器数 |
| `EventEmitter.listenerCount(emitter, event)` | `function` | 监听器计数 |
| `EventEmitter.getEventListeners(emitter, event)` | `function` | 获取监听器列表 |
| `EventEmitter.once(emitter, event, options)` | `function` | 一次性监听（Promise 版本） |
| `once(emitter, name)` | `function` | 事件转 Promise |
| `on(emitter, event)` | `function` | 事件异步迭代器 |
| `getEventListeners(emitterOrTarget, event)` | `function` | 获取监听器列表 |

---

### koss:node/net — TCP 网络

**导入：** `require('koss:node/net')`

| API | 类型 | 说明 |
|-----|------|------|
| `Socket` | `class` | TCP Socket 类 |
| `Server` | `class` | TCP 服务器类 |
| `connect(options, connectListener)` | `function` | 创建 TCP 连接 |
| `createConnection(options, connectListener)` | `function` | 创建连接 |
| `createServer(options, connectionListener)` | `function` | 创建 TCP 服务器 |
| `isIP(input)` | `function` | 判断是否为 IP 地址 |
| `isIPv4(input)` | `function` | 判断是否为 IPv4 |
| `isIPv6(input)` | `function` | 判断是否为 IPv6 |

---

### koss:node/http — HTTP

**导入：** `require('koss:node/http')`

| API | 类型 | 说明 |
|-----|------|------|
| `createServer(options, requestListener)` | `function` | 创建 HTTP 服务器 |
| `request(options, callback)` | `function` | HTTP 客户端请求 |
| `get(url, options, callback)` | `function` | HTTP GET 请求 |
| `Server` | `class` | HTTP 服务器类 |
| `IncomingMessage` | `class` | HTTP 请求消息类 |
| `ServerResponse` | `class` | HTTP 响应消息类 |
| `STATUS_CODES` | `object` | HTTP 状态码映射 |
| `globalAgent` | `object` | 全局 HTTP Agent |
| `ClientRequest` | `class` | 客户端请求类 |
| `Agent` | `class` | HTTP Agent 类 |

> 服务端与客户端均已实现：`request`/`get`/`ClientRequest`/`Agent` 提供完整 HTTP 客户端能力。

---

### koss:node/https — HTTPS

**导入：** `require('koss:node/https')`

| API | 类型 | 说明 |
|-----|------|------|
| `createServer(options, requestListener)` | `function` | 创建 HTTPS 服务器 |
| `request(options, callback)` | `function` | HTTPS 客户端请求 |
| `get(url, options, callback)` | `function` | HTTPS GET 请求 |
| `Server` | `class` | HTTPS 服务器类 |
| `TLSSocket` | `class` | TLS Socket 类 |
| `globalAgent` | `object` | 全局 HTTPS Agent |

> 注意：KossJS 未实现真实 TLS。`https` 模块所有入口（`createServer`/`request`/`get`/`Server`/`TLSSocket`）均显式抛出 `_unsupported` 错误，**不会静默降级为明文 HTTP**（v0.1.0-dev.10 行为）。

---

### koss:node/crypto — 加密

**导入：** `require('koss:node/crypto')`

| API | 类型 | 说明 |
|-----|------|------|
| `randomBytes(size, callback)` | `function` | 生成随机字节 |
| `randomUUID(options)` | `function` | 生成 UUID v4 |
| `createHash(algorithm)` | `function` | 创建哈希对象（sha1/sha256/sha384/sha512/md5） |
| `createHmac(algorithm, key)` | `function` | 创建 HMAC 对象 |
| `randomFill(buffer, offset, size, callback)` | `function` | 随机填充 Buffer |
| `randomFillSync(buffer, offset, size)` | `function` | 同步随机填充 |
| `timingSafeEqual(a, b)` | `function` | 安全比较 |
| `getHashes()` | `function` | 获取支持的哈希算法 |
| `getCiphers()` | `function` | 获取支持的加密算法（aes-\*-gcm） |
| `getCurves()` | `function` | 获取支持的曲线（ed25519） |
| `createCipheriv(algorithm, key, iv)` | `function` | AES-GCM 流式加密（update/final/getAuthTag/setAAD） |
| `createDecipheriv(algorithm, key, iv)` | `function` | AES-GCM 流式解密（update/final/setAuthTag/setAAD） |
| `generateKeyPairSync(type, options)` | `function` | 生成密钥对（仅 ed25519） |
| `sign(algorithm, data, key)` | `function` | ed25519 签名 |
| `verify(algorithm, data, key, signature)` | `function` | ed25519 验签 |
| `pbkdf2(password, salt, iterations, keylen, digest, callback)` | `function` | PBKDF2 异步派生 |
| `pbkdf2Sync(password, salt, iterations, keylen, digest)` | `function` | PBKDF2 同步派生 |
| `webcrypto` | `object` | 全局 `crypto` 引用 |
| `subtle` | `object` | 全局 `crypto.subtle` 引用 |

**支持的哈希算法：** `sha1`, `sha256`, `sha384`, `sha512`, `md5`

**支持的加密算法（AES-GCM，v0.1.0-dev.10 新增）：** `aes-128-gcm`, `aes-192-gcm`, `aes-256-gcm`（IV 需 12 字节）

> `createHash`/`createHmac` 返回普通对象（含 `update`/`digest` 方法），`Hash`/`Hmac` 类本身不导出。

---

### koss:node/stream — 流

**导入：** `require('koss:node/stream')`

| API | 类型 | 说明 |
|-----|------|------|
| `Readable` | `class` | 可读流 |
| `Writable` | `class` | 可写流 |
| `Duplex` | `class` | 双工流 |
| `Transform` | `class` | 转换流 |
| `PassThrough` | `class` | 直通流 |
| `pipeline(...streams, callback)` | `function` | 流管道传输 |
| `compose(...streams)` | `function` | 组合流 |
| `finished(stream, options, callback)` | `function` | 流完成事件 |
| `addAbortSignal(signal, stream)` | `function` | 添加中止信号 |
| `isDisturbed(stream)` | `function` | 判断流是否被消费 |
| `isDestroyed(stream)` | `function` | 判断流是否已销毁 |
| `Stream` | `class` | 流基类（`EventEmitter`） |

---

### koss:node/stream/promises — 流 Promise 接口

**导入：** `require('koss:node/stream/promises')`

| API | 类型 | 说明 |
|-----|------|------|
| `pipeline(...streams)` | `function` | Promise 版管道传输 |
| `finished(stream, options)` | `function` | Promise 版流完成 |
| `rejectWithError(promise, err)` | `function` | 统一错误拒绝 |

---

### koss:node/stream/consumers — 流消费工具

**导入：** `require('koss:node/stream/consumers')`

| API | 类型 | 说明 |
|-----|------|------|
| `json(stream)` | `function` | 收集流并解析 JSON |
| `text(stream)` | `function` | 收集流为字符串 |
| `buffer(stream)` | `function` | 收集流为 Buffer |
| `arrayBuffer(stream)` | `function` | 收集流为 ArrayBuffer |
| `blob(stream, mimeType)` | `function` | 收集流为 Blob |

---

### koss:node/os — 操作系统

**导入：** `require('koss:node/os')`

| API | 类型 | 说明 |
|-----|------|------|
| `arch()` | `function` | CPU 架构 |
| `platform()` | `function` | 操作系统平台 |
| `type()` | `function` | 操作系统类型 |
| `release()` | `function` | 操作系统版本 |
| `hostname()` | `function` | 主机名 |
| `homedir()` | `function` | 用户目录 |
| `tmpdir()` | `function` | 临时目录 |
| `EOL` | `string` | 换行符 |
| `endianness()` | `function` | 字节序 |
| `cpus()` | `function` | CPU 信息 |
| `freemem()` | `function` | 可用内存 |
| `totalmem()` | `function` | 总内存 |
| `loadavg()` | `function` | 负载平均值 |
| `uptime()` | `function` | 系统运行时间 |
| `userInfo(options)` | `function` | 用户信息 |
| `networkInterfaces()` | `function` | 网络接口信息 |
| `availableParallelism()` | `function` | 可用并行度 |
| `version()` | `function` | 进程版本号 |
| `machine()` | `function` | CPU 架构标识 |
| `devNull` | `string` | 空设备路径（win32: `nul`） |
| `constants` | `object` | 系统常量（signals/errno 表） |

---

### koss:node/url — URL 解析

**导入：** `require('koss:node/url')`

| API | 类型 | 说明 |
|-----|------|------|
| `URL` | `class` | Web URL 类 |
| `URLSearchParams` | `class` | URL 查询参数类 |
| `parse(urlStr, parseQueryString, slashesDenoteHost)` | `function` | URL 解析 |
| `format(urlObj, options)` | `function` | URL 格式化 |
| `resolve(from, to)` | `function` | URL 解析 |
| `resolveObject(from, to)` | `function` | URL 解析（返回对象） |
| `pathToFileURL(path)` | `function` | 路径转文件 URL |
| `fileURLToPath(url)` | `function` | 文件 URL 转路径 |
| `domainToASCII(domain)` | `function` | 域名转 ASCII |
| `domainToUnicode(domain)` | `function` | 域名转 Unicode |

---

### koss:node/assert — 断言

**导入：** `require('koss:node/assert')`

| API | 类型 | 说明 |
|-----|------|------|
| `assert(value, message)` | `function` | 断言 |
| `strict(value, message)` | `function` | 严格断言 |
| `ok(value, message)` | `function` | 断言为真 |
| `equal(actual, expected, message)` | `function` | 等于断言 |
| `notEqual(actual, expected, message)` | `function` | 不等断言 |
| `deepEqual(actual, expected, message)` | `function` | 深度相等断言 |
| `notDeepEqual(actual, expected, message)` | `function` | 深度不等断言 |
| `strictEqual(actual, expected, message)` | `function` | 严格相等断言 |
| `notStrictEqual(actual, expected, message)` | `function` | 严格不等断言 |
| `throws(fn, error, message)` | `function` | 断言抛出异常 |
| `doesNotThrow(fn, message)` | `function` | 断言不抛出异常 |
| `ifError(value)` | `function` | 断言无错误 |
| `rejects(asyncFn, error, message)` | `function` | 断言 Promise 拒绝 |
| `doesNotReject(asyncFn, message)` | `function` | 断言 Promise 不拒绝 |
| `AssertionError` | `class` | 断言错误类 |
| `CallTracker` | `class` | 调用跟踪器 |
| `strict` | `object` | 严格断言命名空间 |

---

### koss:node/zlib — 压缩

**导入：** `require('koss:node/zlib')`

| API | 类型 | 说明 |
|-----|------|------|
| `gzipSync(data, options)` | `function` | 同步 gzip 压缩 |
| `gunzipSync(data, options)` | `function` | 同步 gzip 解压 |
| `deflateSync(data, options)` | `function` | 同步 deflate 压缩 |
| `inflateSync(data, options)` | `function` | 同步 deflate 解压 |
| `gzip(data, options, callback)` | `function` | 异步 gzip 压缩 |
| `gunzip(data, options, callback)` | `function` | 异步 gzip 解压 |
| `deflate(data, options, callback)` | `function` | 异步 deflate 压缩 |
| `inflate(data, options, callback)` | `function` | 异步 deflate 解压 |
| `consts` / `constants` | `object` | zlib 常量 |

> 注意：异步函数实际为同步实现。

---

### koss:node/util — 工具函数

**导入：** `require('koss:node/util')`

| API | 类型 | 说明 |
|-----|------|------|
| `format(format, ...args)` | `function` | 字符串格式化 |
| `inspect(obj, options)` | `function` | 对象检查 |
| `deprecate(fn, msg, code)` | `function` | 弃用警告 |
| `promisify(fn)` | `function` | 回调转 Promise |
| `callbackify(fn)` | `function` | Promise 转回调 |
| `inherits(ctor, superCtor)` | `function` | 原型继承 |
| `debuglog(section, callback)` | `function` | 调试日志 |
| `types.isDate(value)` | `function` | 判断是否为 Date |
| `types.isRegExp(value)` | `function` | 判断是否为 RegExp |
| `types.isArrayBuffer(value)` | `function` | 判断是否为 ArrayBuffer |
| `types.isSet(value)` | `function` | 判断是否为 Set |
| `types.isMap(value)` | `function` | 判断是否为 Map |
| `getSystemErrorName(err)` | `function` | 获取系统错误名 |
| `stripVTControlCharacters(str)` | `function` | 移除 VT 控制字符 |
| `TextEncoder` | `class` | 文本编码器 |
| `TextDecoder` | `class` | 文本解码器 |
| `toUSVString(str)` | `function` | 转换为 USV 字符串 |

---

### koss:node/querystring — 查询字符串

**导入：** `require('koss:node/querystring')`

| API | 类型 | 说明 |
|-----|------|------|
| `stringify(obj, sep, eq, options)` | `function` | 对象转查询字符串 |
| `parse(str, sep, eq, options)` | `function` | 查询字符串转对象 |
| `escape(str)` | `function` | URL 编码 |
| `unescape(str)` | `function` | URL 解码 |

---

### koss:node/timers — 定时器

**导入：** `require('koss:node/timers')`

| API | 类型 | 说明 |
|-----|------|------|
| `setTimeout(callback, delay, ...args)` | `function` | 设置超时 |
| `clearTimeout(id)` | `function` | 清除超时 |
| `setInterval(callback, delay, ...args)` | `function` | 设置间隔 |
| `clearInterval(id)` | `function` | 清除间隔 |
| `setImmediate(callback, ...args)` | `function` | 设置立即执行 |
| `clearImmediate(id)` | `function` | 清除立即执行 |
| `active(timer)` | `function` | 激活定时器 |
| `unenroll(timer)` | `function` | 取消注册 |
| `enroll(timer, delay)` | `function` | 注册定时器 |
| `clearAllTimers()` | `function` | 清除全部定时器 |
| `Timeout` | `class` | 定时器句柄（ref/unref/hasRef/refresh） |
| `promises` | `object` | Promise 版本（setTimeout/setImmediate/setInterval 异步迭代器） |

---

### koss:node/timers/promises — 定时器 Promise 接口

**导入：** `require('koss:node/timers/promises')`

| API | 类型 | 说明 |
|-----|------|------|
| `setTimeout(delay, value, options)` | `function` | Promise 版 setTimeout（支持 AbortSignal） |
| `setImmediate(value, options)` | `function` | Promise 版 setImmediate |
| `setInterval(delay, value, options)` | `function` | 异步迭代器版 setInterval |
| `scheduler.wait(delay, options)` | `function` | 等待指定时长 |
| `scheduler.yield()` | `function` | 让出事件循环 |
| `scheduler.signal(signal)` | `function` | 等待信号中止 |

---

### koss:node/console — 控制台

**导入：** `require('koss:node/console')`

| API | 类型 | 说明 |
|-----|------|------|
| `console` | `object` | 全局 `console` 对象（log/info/warn/error/debug/table 等） |

> 与 Node 一致，`console` 既是全局对象也是模块导出，本模块直接返回 `globalThis.console`。

---

### koss:node/string_decoder — 字符串解码器

**导入：** `require('koss:node/string_decoder')`

| API | 类型 | 说明 |
|-----|------|------|
| `StringDecoder` | `class` | 字符串解码器 |

---

### koss:node/dns — DNS 解析

**导入：** `require('koss:node/dns')`

| API | 类型 | 说明 |
|-----|------|------|
| `lookup(hostname, options, callback)` | `function` | DNS 查找（支持 `family: 4/6` 过滤与 `all: true`） |
| `resolve(hostname, rrtype, callback)` | `function` | DNS 解析（A/AAAA 记录过滤） |
| `resolve4(hostname, options, callback)` | `function` | IPv4 解析 |
| `resolve6(hostname, options, callback)` | `function` | IPv6 解析 |
| `lookupService(address, port, callback)` | `function` | 反向 DNS 查找（`__koss_dns_lookup_service`，getnameinfo） |
| `isIP(input)` | `function` | 判断是否为 IP 地址（返回 4/6/0） |
| `isIPv4(input)` | `function` | 判断是否为 IPv4 |
| `isIPv6(input)` | `function` | 判断是否为 IPv6 |
| `promises.lookup(hostname, options)` | `function` | Promise DNS 查找 |
| `promises.resolve(hostname, rrtype)` | `function` | Promise DNS 解析 |
| `promises.resolve4(hostname, options)` | `function` | Promise IPv4 解析 |
| `promises.resolve6(hostname, options)` | `function` | Promise IPv6 解析 |
| `promises.lookupService(address, port)` | `function` | Promise 反向 DNS 查找 |

---

### koss:node/dgram — UDP 数据报

**导入：** `require('koss:node/dgram')`

| API | 类型 | 说明 |
|-----|------|------|
| `createSocket(type, callback)` | `function` | 创建 UDP Socket（`udp4`/`udp6`） |
| `Socket` | `class` | UDP Socket 类 |

> 基于 `__koss_udp_create/bind/send/recv/close/address` 原生函数实现**真实 UDP 收发**（Windows 下走 WinSock2），非 TCP 桥接（v0.1.0-dev.10 新增）。Socket 支持 `bind`/`send`/`close`/`address` 与 `message` 事件；`setBroadcast`/`setTTL`/`addMembership` 等为无操作兼容。

---

### koss:node/tls — TLS/SSL

**导入：** `require('koss:node/tls')`

| API | 类型 | 说明 |
|-----|------|------|
| `connect(options, connectListener)` | `function` | TLS 连接（抛错） |
| `createServer(options, connectionListener)` | `function` | TLS 服务器（抛错） |
| `TLSSocket` | `class` | TLS Socket 类（抛错） |
| `createSecureContext(options)` | `function` | 创建安全上下文（抛错） |
| `checkServerIdentity(hostname, cert)` | `function` | 检查服务器身份（抛错） |
| `rootCertificates` | `string[]` | 根证书列表（空数组） |

> 注意：KossJS 未实现真实 TLS 握手与证书验证。为避免调用方误以为连接已加密（安全隐患），**所有 TLS 操作显式抛 `_unsupported` 错误**（v0.1.0-dev.10 行为），不再静默返回 stub。

---

### koss:node/process — 进程

**导入：** `require('koss:node/process')`

| API | 类型 | 说明 |
|-----|------|------|
| `process` | `object` | 全局 process 对象的引用 |

> 实际 `process` 对象由 Rust 运行时注入，该模块仅作为 `require('process')` 的兼容入口。

---

### koss:node/constants — 常量

**导入：** `require('koss:node/constants')`

| API | 类型 | 说明 |
|-----|------|------|
| `constants.fs` | `object` | 文件系统常量 |
| `constants.os` | `object` | 操作系统常量（信号、错误码等） |

---

### koss:node/trace_events — 追踪事件

**导入：** `require('koss:node/trace_events')`

| API | 类型 | 说明 |
|-----|------|------|
| `createTracing(options)` | `function` | 创建追踪 |
| `getEnabledCategories()` | `function` | 获取已启用类别 |
| `Tracing` | `class` | 追踪类 |

---

### koss:node/perf_hooks — 性能钩子

**导入：** `require('koss:node/perf_hooks')`

| API | 类型 | 说明 |
|-----|------|------|
| `performance.now()` | `function` | 当前时间（单调时钟，毫秒） |
| `performance.timeOrigin` | `number` | 性能时间原点 |
| `performance.mark(name)` | `function` | 标记时间点 |
| `performance.measure(name, startMark, endMark)` | `function` | 测量耗时 |
| `performance.getEntries()` | `function` | 获取所有性能条目 |
| `performance.getEntriesByType(type)` | `function` | 按类型获取条目 |
| `performance.getEntriesByName(name)` | `function` | 按名称获取条目 |
| `performance.clearMarks(name)` | `function` | 清除标记 |
| `performance.clearMeasures(name)` | `function` | 清除测量 |
| `performance.eventLoopUtilization()` | `function` | 事件循环利用率 |
| `performance.nodeTiming` | `object` | Node 阶段计时对象 |
| `performance.timing` | `object` | 计时对象 |
| `PerformanceObserver` | `class` | 性能观察者 |
| `PerformanceMark` | `class` | 性能标记 |
| `PerformanceMeasure` | `class` | 性能测量 |
| `PerformanceEntry` | `class` | 性能条目 |
| `createHistogram(options)` | `function` | 创建真实直方图（对数分桶） |
| `Histogram` | `class` | 直方图类（record/reset/min/max/mean/stddev/percentile/percentiles） |
| `timerify(fn, options)` | `function` | 包装为计时函数 |
| `monitorEventLoopDelay(options)` | `function` | 监控事件循环延迟（真实采样直方图） |
| `constants` | `object` | 性能常量（`NODE_PERFORMANCE_*`） |

> `performance.now()` 使用单调时钟（`__koss_performance_now`），不受系统时间调整影响；`monitorEventLoopDelay` 基于间隔采样返回真实 `Histogram`（v0.1.0-dev.10 由 stub 升级为真实实现）。

---

### koss:node/diagnostics_channel — 诊断通道

**导入：** `require('koss:node/diagnostics_channel')`

| API | 类型 | 说明 |
|-----|------|------|
| `channel(name)` | `function` | 获取/创建通道 |
| `subscribe(channel, listener)` | `function` | 订阅通道 |
| `unsubscribe(channel, listener)` | `function` | 取消订阅 |
| `publish(channel, data)` | `function` | 发布消息 |
| `hasSubscribers(channel)` | `function` | 检查是否有订阅者 |
| `Channel` | `class` | 通道类 |

---

## 使用示例

### require 风格

```javascript
const fs = require('koss:node/fs');
const path = require('koss:node/path');
const http = require('koss:node/http');

// 文件操作
const filePath = path.join('/tmp', 'test.txt');
fs.writeFileSync(filePath, 'Hello Node.js!');
const content = fs.readFileSync(filePath, 'utf8');

// HTTP 服务器
const server = http.createServer((req, res) => {
    res.end('Hello World');
});
server.listen(3000);
```

### import 风格

```javascript
import { readFileSync, writeFileSync } from 'koss:node/fs';
import { join, resolve } from 'koss:node/path';
import { createHash, randomBytes } from 'koss:node/crypto';

const hash = createHash('sha256').update('hello').digest('hex');
const bytes = randomBytes(16);
```

### async 风格

```javascript
const fs = require('koss:node/fs');

// 回调风格
fs.readFile('/tmp/test.txt', 'utf8', (err, data) => {
    if (err) throw err;
    console.log(data);
});

// Promise 风格
fs.promises.readFile('/tmp/test.txt', 'utf8')
    .then(data => console.log(data));
```

---

## 已知限制

| 模块 | 限制 |
|------|------|
| **https/tls** | 未实现真实 TLS，显式抛 `_unsupported` 错误 |
| **zlib** | 异步函数实际为同步实现 |
| **dgram** | 多播/广播选项为 no-op 兼容（收发为真实 UDP） |
| **dns** | `resolve` 的 MX/TXT/NS/CNAME 等记录类型返回原解析结果（未按类型过滤） |

---

## 相关文档

- [内置模块系统指南](/zh/guide/builtin-modules)
- [ESM Import 支持指南](/zh/guide/esm-import)
- [Bun 兼容层参考](/zh/reference/bun-compat-layer)
- [Deno 兼容层参考](/zh/reference/deno-compat-layer)
- [Koss 原生模块参考](/zh/reference/koss-native-modules)
