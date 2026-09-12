# KossJS 版本变更日志（dev.8 → dev.9）

本文档记录从 0.1.0-dev.8 到 0.1.0-dev.9 的所有变更。

> 测试统计：731 passed, 0 failed (Python) | 140 passed, 0 failed (Rust)

---

## 0.1.0-dev.8 → 0.1.0-dev.9

### 新增功能

#### 1. Builtin Flags 模块系统

新增 `src/builtins.rs` 模块，实现基于标志位的内置模块控制系统，与 Capability（沙箱能力）解耦。

**核心架构：**

```c
// kossjs.h - Builtin Flags 定义
typedef enum {
    KOSS_BUILTIN_NONE  = 0,           // 无内置模块
    KOSS_BUILTIN_NODE  = 1 << 0,      // Node.js 兼容层
    KOSS_BUILTIN_BUN   = 1 << 1,      // Bun 兼容层
    KOSS_BUILTIN_DENO  = 1 << 2,      // Deno 兼容层
    KOSS_BUILTIN_KOSS  = 1 << 3,      // Koss 原生模块
    KOSS_BUILTIN_ALL   = 0xFFFFFFFF,  // 全部启用
} KossBuiltin;
```

**标志位说明：**

| 标志位 | 值 | 控制范围 |
|--------|-----|----------|
| `KOSS_BUILTIN_NODE` | `1 << 0` | `koss:node/*` 模块（24个模块） |
| `KOSS_BUILTIN_BUN` | `1 << 1` | `koss:bun` 模块 |
| `KOSS_BUILTIN_DENO` | `1 << 2` | `koss:deno` 模块 |
| `KOSS_BUILTIN_KOSS` | `1 << 3` | `koss:io/crypto/system/data/ffi/worker` 模块 |
| `KOSS_BUILTIN_ALL` | `0xFFFFFFFF` | 启用所有内置模块 |

**C API 新增：**

| 函数 | 说明 |
|------|------|
| `koss_create_with_builtins(capabilities, builtins, stable)` | 创建带 Builtin 控制的实例 |
| `koss_create_with_modules_and_builtins(root_dir, capabilities, builtins, stable)` | 创建带模块加载和 Builtin 控制的实例 |
| `koss_get_builtins(inst)` | 获取当前实例的 Builtin 标志 |
| `koss_is_builtin_enabled(inst, flag)` | 检查指定 Builtin 标志是否启用 |

**KossInstance 结构体变更：**

```c
typedef struct KossInstance {
    BoaContext *context;
    uint32_t capabilities;
    uint32_t builtins;      // 新增字段
    bool stable;
    // ... 其他字段
} KossInstance;
```

---

#### 2. JS Shim 层（新增 25+ 文件）

##### 2.1 Node.js 兼容层（L3）- `src/js_shims/node_shim/`

新增 24 个 Node.js 兼容模块，基于 `koss:internal/*` 实现：

| 模块 | 文件 | 说明 |
|------|------|------|
| assert | `assert.js` | 断言库 |
| buffer | `buffer.js` | Buffer 类 |
| constants | `constants.js` | 系统常量 |
| crypto | `crypto.js` | 加密模块 |
| dgram | `dgram.js` | UDP 数据报 |
| diagnostics_channel | `diagnostics_channel.js` | 诊断通道 |
| dns | `dns.js` | DNS 解析 |
| events | `events.js` | 事件发射器 |
| fs | `fs.js` | 文件系统 |
| http | `http.js` | HTTP 服务器/客户端 |
| https | `https.js` | HTTPS 模块 |
| net | `net.js` | TCP 网络 |
| os | `os.js` | 操作系统信息 |
| path | `path.js` | 路径处理 |
| perf_hooks | `perf_hooks.js` | 性能钩子 |
| process | `process.js` | 进程信息 |
| querystring | `querystring.js` | 查询字符串 |
| stream | `stream.js` | 流操作 |
| string_decoder | `string_decoder.js` | 字符串解码器 |
| timers | `timers.js` | 定时器 |
| tls | `tls.js` | TLS/SSL |
| trace_events | `trace_events.js` | 追踪事件 |
| url | `url.js` | URL 解析 |
| util | `util.js` | 工具函数 |
| zlib | `zlib.js` | 压缩/解压 |

##### 2.2 Bun 兼容层（L3）- `src/js_shims/bun_shim.js`

基于 Bun v1.1.x API 实现：

| API | 状态 | 说明 |
|-----|------|------|
| `Bun.version` | ✅ 已实现 | 返回 `'1.1.42'` |
| `Bun.write(path, data)` | ✅ 已实现 | 写入文件 |
| `Bun.file(path)` | ✅ 已实现 | 读取文件（返回 File 对象） |
| `Bun.serve(options, handler)` | ✅ 已实现 | HTTP 服务器 |
| `Bun.sleep(ms)` | ✅ 已实现 | 异步延迟 |
| `Bun.inspect(obj)` | ✅ 已实现 | 对象检查 |
| `Bun.peek(promise)` | ✅ 已实现 | Promise 检查 |
| `Bun.which(cmd)` | ✅ 已实现 | 查找可执行文件 |
| `Bun.randomUUID()` | ✅ 已实现 | 生成 UUID |
| `Bun.env` | ✅ 已实现 | 环境变量 |
| `Bun.sql` | ❌ 未实现 | 抛出 NotImplementedError |
| `Bun.spawn()` | ❌ 未实现 | 抛出 NotImplementedError |
| `Bun.build()` | ❌ 未实现 | 抛出 NotImplementedError |

##### 2.3 Deno 兼容层（L3）- `src/js_shims/deno_shim.js`

基于 Deno v2.0.x API 实现：

| API | 状态 | 说明 |
|-----|------|------|
| `Deno.version` | ✅ 已实现 | 版本信息对象 |
| `Deno.readTextFile(path)` | ✅ 已实现 | 读取文本文件 |
| `Deno.writeTextFile(path, data)` | ✅ 已实现 | 写入文本文件 |
| `Deno.readFile(path)` | ✅ 已实现 | 读取文件为 Uint8Array |
| `Deno.writeFile(path, data)` | ✅ 已实现 | 写入文件 |
| `Deno.stat(path)` | ✅ 已实现 | 获取文件状态 |
| `Deno.mkdir(path, options)` | ✅ 已实现 | 创建目录 |
| `Deno.remove(path)` | ✅ 已实现 | 删除文件/目录 |
| `Deno.cwd()` | ✅ 已实现 | 获取当前目录 |
| `Deno.chdir(path)` | ✅ 已实现 | 切换目录 |
| `Deno.exit(code)` | ✅ 已实现 | 退出进程 |
| `Deno.serve(handler, options)` | ✅ 已实现 | HTTP 服务器 |
| `Deno.listen(options)` | ✅ 已实现 | TCP 监听 |
| `Deno.connect(options)` | ✅ 已实现 | TCP 连接 |
| `Deno.resolveDns(host)` | ✅ 已实现 | DNS 解析 |
| `Deno.run()` | ❌ 未实现 | 抛出 NotImplementedError |
| `Deno.spawn()` | ❌ 未实现 | 抛出 NotImplementedError |
| `Deno.permissions` | ❌ 未实现 | 抛出 NotImplementedError |

##### 2.4 Koss 原生模块（L3）- `src/js_shims/koss_shim/`

| 模块 | 文件 | 说明 |
|------|------|------|
| koss:io | `io.js` | 统一 I/O（文件+网络+流） |
| koss:crypto | `crypto.js` | 加密与安全 |
| koss:system | `system.js` | 系统信息 |
| koss:data | `data.js` | 数据编码（Hex/Base64） |
| koss:ffi | `ffi.js` | 外部函数接口 |
| koss:worker | `worker.js` | 工作线程 |

##### 2.5 内部模块（L2）- `src/js_shims/internal/`

| 模块 | 文件 | 说明 |
|------|------|------|
| koss:internal/fs | `fs.js` | 文件系统内部实现 |
| koss:internal/net | `net.js` | 网络内部实现 |
| koss:internal/crypto | `crypto.js` | 加密内部实现 |
| koss:internal/stream | `stream.js` | 流内部实现 |

---

#### 3. ESM Import 支持

##### 3.1 CJS → ESM 自动包装

`module_loader.rs` 新增 `wrap_cjs_for_esm()` 函数，自动将 CJS 模块包装为 ESM 兼容格式：

```javascript
// 原始 CJS 模块
module.exports = { readFileSync, writeFileSync };

// 自动包装后
var module = { exports: {} };
var exports = module.exports;
module.exports = { readFileSync, writeFileSync };
export default module.exports;
globalThis.__koss_esm_result = module.exports;
```

**包装逻辑：**

1. 检测源码是否已包含 ESM export 声明
2. 无 ESM 声明时，自动添加 `var module/exports` 声明
3. 追加 `export default module.exports` 语句
4. 将结果存储到 `globalThis.__koss_esm_result`

##### 3.2 统一模块加载器配置

所有 `koss_create*` 路径现在都配置 `KossModuleLoader`：

```rust
// runtime.rs - koss_create_with_builtins
let loader = Rc::new(KossModuleLoader::new_with_builtins(&root, builtins));
let context = boa_engine::context::ContextBuilder::default()
    .module_loader(loader)
    .build();
```

##### 3.3 koss: 协议 ESM 导入

```javascript
// Node.js 兼容层
import fs from 'koss:node/fs';
import path from 'koss:node/path';

// Bun 兼容层
import { version, write } from 'koss:bun';

// Deno 兼容层
import { readTextFile, serve } from 'koss:deno';

// Koss 原生模块
import { read, write, stat } from 'koss:io';
import { hash, randomBytes } from 'koss:crypto';
```

##### 3.4 node: 前缀 ESM 导入

```javascript
import fs from 'node:fs';
import path from 'node:path';
import events from 'node:events';
```

##### 3.5 裸名 ESM 导入

```javascript
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
```

---

#### 4. 模块路径解析增强

`resolver.rs` 增强 `resolve_nodejs_stdlib` 函数，支持双路径查找：

```rust
// 查找顺序：
// 1. 直接路径：path.js
// 2. node_shim 路径：node_shim/path.js
// 3. 目录索引：path/index.js
// 4. 内部模块：_http_client.js
```

**示例：**

```
node:fs → node_shim/fs.js
fs      → node_shim/fs.js
path    → node_shim/path.js
```

---

#### 5. Rust 单元测试补全

##### 5.1 builtins.rs 测试（26 个）

| 测试组 | 测试数量 | 覆盖内容 |
|--------|----------|----------|
| Flag 常量 | 2 | 枚举值、互斥性 |
| is_koss_specifier | 2 | 协议前缀识别 |
| strip_koss_prefix | 1 | 前缀剥离 |
| find_builtin | 5 | 模块查找（Node/Bun/Deno/Koss/Internal） |
| resolve_builtin_specifier | 8 | 带标志位的模块解析 |
| flag_to_name/flags_to_names | 4 | 标志位名称转换 |
| 错误消息 | 2 | builtin_disabled_error、internal_module_error |
| builtin_module_names | 1 | 模块名称列表 |

##### 5.2 resolver.rs 测试（7 个）

| 测试 | 说明 |
|------|------|
| `test_resolve_node_builtin_from_node_shim` | node:fs 通过 node_shim 解析 |
| `test_resolve_bare_fs_from_node_shim` | 裸名 fs 通过 node_shim 解析 |
| `test_resolve_bare_crypto_from_node_shim` | 裸名 crypto 通过 node_shim 解析 |

---

#### 6. Python 集成测试（新增 103 个）

| 测试文件 | 测试数量 | 覆盖内容 |
|----------|----------|----------|
| `test_esm_import.py` | 39 | ESM import 全部 koss:/* 模块 |
| `test_bun_api.py` | 30 | Bun 兼容层 API |
| `test_deno_api.py` | 34 | Deno 兼容层 API |
| `test_koss_native.py` | 68 | Koss 原生模块 API |
| `test_koss_protocol.py` | 24 | koss: 协议模块 |

---

### 运行时修复

#### 1. Boa 0.21.x 兼容性修复

- 修复 `TextEncoder`/`TextDecoder` 注册失败问题
- 修复 `Object.prototype.toString` 不可写导致的原型方法定义问题

#### 2. 模块加载器修复

- `__koss_load_module` 支持 `koss:node/` 前缀回退
- Stable 模式 FFI/Worker 桩函数仅在原始 caps 包含对应能力时注册

#### 3. 错误消息改善

- `js_error_to_string` 增加 JS `toString` 回退，改善错误可读性

---

### 构建优化

#### 1. Release 构建配置

```toml
# Cargo.toml
[profile.release]
lto = true
codegen-units = 1
strip = true
opt-level = "z"  # 优化体积
```

#### 2. 依赖版本锁定

| 依赖 | 版本 |
|------|------|
| rustc-hash | 2.1.3 |
| rustls | 0.23.41 |
| rand | 0.10.2 |
| libffi | 5.1.1 |
| libffi-sys | 4.2.0 |

---

### 测试统计

| 版本 | Python 测试 | Rust 测试 | 总计 |
|------|-------------|-----------|------|
| dev.8 | 528 passed, 8 skipped | 107 passed | 635 |
| dev.9 | 731 passed, 0 failed | 140 passed, 0 failed | 871 |
| **增量** | **+203** | **+33** | **+236** |

---

### 文件变更统计

| 类别 | 新增 | 修改 | 删除 |
|------|------|------|------|
| Rust 源码 | 2 | 4 | 0 |
| JS Shim | 25+ | 0 | 0 |
| 测试文件 | 5 | 15+ | 0 |
| 文档 | 2 | 0 | 0 |
| **总计** | **~34** | **~19** | **0** |

---

### 已知限制

- Bun 兼容层：`sql`、`spawn`、`build` 未实现
- Deno 兼容层：`run`、`spawn`、`permissions` 未实现
- Koss 原生 FFI/Worker 模块在 `stable=true` 时不可用
- ESM import 的 CJS 包装器使用简单启发式检测，可能误判

---

## 从旧版本升级

### 从 dev.8 升级到 dev.9

#### 1. C API 用户

如果使用旧的 `koss_create()` 或 `koss_create_with_modules()`，无需修改代码，默认 `builtins=KOSS_BUILTIN_ALL`。

如需精确控制内置模块：

```c
// 仅启用 Node.js 兼容层
KossInstance* inst = koss_create_with_builtins(
    KOSS_CAP_ALL,
    KOSS_BUILTIN_NODE,
    true  // stable
);
```

#### 2. Python 用户

```python
from kossjs_interface import KossJS

# 旧代码（仍然有效）
koss = KossJS()

# 新代码（精确控制）
koss = KossJS(
    capabilities=KossJS.KOSS_CAP_ALL,
    builtins=KossJS.KOSS_BUILTIN_NODE | KossJS.KOSS_BUILTIN_KOSS,
    stable=True
)
```

#### 3. TypeScript 用户

```typescript
import { KossJS, KossBuiltin } from './kossjs_interface';

const koss = new KossJS({
    capabilities: 0xFFFFFFFF,
    builtins: KossBuiltin.NODE | KossBuiltin.KOSS,
    stable: true
});
```
