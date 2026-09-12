# koss: 协议模块参考

本文档介绍 KossJS 的 `koss:` 协议模块系统，包括模块解析规则、加载机制和内部模块保护。

---

## 概述

KossJS 使用 `koss:` 协议作为内置模块的统一命名空间。所有内置模块都以 `koss:` 为前缀，通过模块加载器（`KossModuleLoader`）解析和加载。

### 协议格式

```
koss:{namespace}/{module_name}
```

**示例：**

| 完整路径 | 说明 |
|----------|------|
| `koss:node/fs` | Node.js 文件系统模块 |
| `koss:bun` | Bun 兼容层 |
| `koss:deno` | Deno 兼容层 |
| `koss:io` | Koss 原生 I/O 模块 |
| `koss:crypto` | Koss 原生加密模块 |
| `koss:internal/fs` | 内部文件系统模块 |

---

## 模块解析规则

### 解析流程

```
import 'koss:node/fs'
     │
     ▼
┌─────────────────────────────────────────────────────┐
│ 1. 检测 koss: 协议前缀                               │
│    is_koss_specifier("koss:node/fs") → true          │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ 2. 剥离 koss: 前缀                                   │
│    strip_koss_prefix("koss:node/fs") → "node/fs"     │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ 3. 查找内置模块注册表                                 │
│    find_builtin("node/fs") → KossBuiltinModule       │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ 4. 检查 Builtin Flag                                  │
│    "node/fs" → flag=KOSS_BUILTIN_NODE                │
│    resolve_builtin_specifier("koss:node/fs", flags)  │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ 5. 加载模块源码                                       │
│    Source from embedded_stdlib.rs                     │
└─────────────────────────────────────────────────────┘
```

### Rust 实现

```rust
// builtins.rs

/// 检测是否为 koss: 协议
pub fn is_koss_specifier(specifier: &str) -> bool {
    specifier.starts_with("koss:")
}

/// 剥离 koss: 前缀
pub fn strip_koss_prefix(specifier: &str) -> &str {
    specifier.strip_prefix("koss:").unwrap_or(specifier)
}

/// 查找内置模块定义
pub fn find_builtin(name: &str) -> Option<&'static KossBuiltinModule> {
    // 在注册表中查找
    static BUILTIN_MODULES: &[KossBuiltinModule] = &[
        KossBuiltinModule { name: "node/fs", flag: KOSS_BUILTIN_NODE, source_path: "...", is_internal: false },
        KossBuiltinModule { name: "bun", flag: KOSS_BUILTIN_BUN, source_path: "...", is_internal: false },
        // ...
    ];
    BUILTIN_MODULES.iter().find(|m| m.name == name)
}
```

---

## 注册表结构

### KossBuiltinModule

```rust
pub struct KossBuiltinModule {
    pub name: &'static str,        // 模块名称（去掉 koss: 前缀后）
    pub flag: u32,                 // 对应的 Builtin 标志位
    pub source_path: &'static str, // 源码路径
    pub is_internal: bool,         // 是否为内部模块
}
```

### 模块注册表（部分）

| name | flag | source_path | is_internal |
|------|------|-------------|-------------|
| `node/fs` | `KOSS_BUILTIN_NODE` | `node_shim/fs.js` | `false` |
| `node/path` | `KOSS_BUILTIN_NODE` | `node_shim/path.js` | `false` |
| `node/http` | `KOSS_BUILTIN_NODE` | `node_shim/http.js` | `false` |
| `node/events` | `KOSS_BUILTIN_NODE` | `node_shim/events.js` | `false` |
| `node/buffer` | `KOSS_BUILTIN_NODE` | `node_shim/buffer.js` | `false` |
| `node/crypto` | `KOSS_BUILTIN_NODE` | `node_shim/crypto.js` | `false` |
| `node/net` | `KOSS_BUILTIN_NODE` | `node_shim/net.js` | `false` |
| `node/stream` | `KOSS_BUILTIN_NODE` | `node_shim/stream.js` | `false` |
| `node/os` | `KOSS_BUILTIN_NODE` | `node_shim/os.js` | `false` |
| `node/url` | `KOSS_BUILTIN_NODE` | `node_shim/url.js` | `false` |
| `node/assert` | `KOSS_BUILTIN_NODE` | `node_shim/assert.js` | `false` |
| `node/util` | `KOSS_BUILTIN_NODE` | `node_shim/util.js` | `false` |
| `node/querystring` | `KOSS_BUILTIN_NODE` | `node_shim/querystring.js` | `false` |
| `node/timers` | `KOSS_BUILTIN_NODE` | `node_shim/timers.js` | `false` |
| `node/string_decoder` | `KOSS_BUILTIN_NODE` | `node_shim/string_decoder.js` | `false` |
| `node/zlib` | `KOSS_BUILTIN_NODE` | `node_shim/zlib.js` | `false` |
| `node/dns` | `KOSS_BUILTIN_NODE` | `node_shim/dns.js` | `false` |
| `node/dgram` | `KOSS_BUILTIN_NODE` | `node_shim/dgram.js` | `false` |
| `node/tls` | `KOSS_BUILTIN_NODE` | `node_shim/tls.js` | `false` |
| `node/https` | `KOSS_BUILTIN_NODE` | `node_shim/https.js` | `false` |
| `node/constants` | `KOSS_BUILTIN_NODE` | `node_shim/constants.js` | `false` |
| `node/process` | `KOSS_BUILTIN_NODE` | `node_shim/process.js` | `false` |
| `node/perf_hooks` | `KOSS_BUILTIN_NODE` | `node_shim/perf_hooks.js` | `false` |
| `node/trace_events` | `KOSS_BUILTIN_NODE` | `node_shim/trace_events.js` | `false` |
| `node/diagnostics_channel` | `KOSS_BUILTIN_NODE` | `node_shim/diagnostics_channel.js` | `false` |
| `bun` | `KOSS_BUILTIN_BUN` | `bun_shim.js` | `false` |
| `deno` | `KOSS_BUILTIN_DENO` | `deno_shim.js` | `false` |
| `assert` | `KOSS_BUILTIN_KOSS` | `koss_shim/assert.js` | `false` |
| `buffer` | `KOSS_BUILTIN_KOSS` | `koss_shim/buffer.js` | `false` |
| `constants` | `KOSS_BUILTIN_KOSS` | `koss_shim/constants.js` | `false` |
| `crypto` | `KOSS_BUILTIN_KOSS` | `koss_shim/crypto.js` | `false` |
| `data` | `KOSS_BUILTIN_KOSS` | `koss_shim/data.js` | `false` |
| `diagnostics_channel` | `KOSS_BUILTIN_KOSS` | `koss_shim/diagnostics_channel.js` | `false` |
| `events` | `KOSS_BUILTIN_KOSS` | `koss_shim/events.js` | `false` |
| `ffi` | `KOSS_BUILTIN_KOSS` | `koss_shim/ffi.js` | `false` |
| `http` | `KOSS_BUILTIN_KOSS` | `koss_shim/http.js` | `false` |
| `io` | `KOSS_BUILTIN_KOSS` | `koss_shim/io.js` | `false` |
| `net` | `KOSS_BUILTIN_KOSS` | `koss_shim/net.js` | `false` |
| `os` | `KOSS_BUILTIN_KOSS` | `koss_shim/os.js` | `false` |
| `path` | `KOSS_BUILTIN_KOSS` | `koss_shim/path.js` | `false` |
| `process` | `KOSS_BUILTIN_KOSS` | `koss_shim/process.js` | `false` |
| `stream` | `KOSS_BUILTIN_KOSS` | `koss_shim/stream.js` | `false` |
| `string_decoder` | `KOSS_BUILTIN_KOSS` | `koss_shim/string_decoder.js` | `false` |
| `system` | `KOSS_BUILTIN_KOSS` | `koss_shim/system.js` | `false` |
| `timers` | `KOSS_BUILTIN_KOSS` | `koss_shim/timers.js` | `false` |
| `trace_events` | `KOSS_BUILTIN_KOSS` | `koss_shim/trace_events.js` | `false` |
| `url` | `KOSS_BUILTIN_KOSS` | `koss_shim/url.js` | `false` |
| `util` | `KOSS_BUILTIN_KOSS` | `koss_shim/util.js` | `false` |
| `querystring` | `KOSS_BUILTIN_KOSS` | `koss_shim/querystring.js` | `false` |
| `zlib` | `KOSS_BUILTIN_KOSS` | `koss_shim/zlib.js` | `false` |
| `internal/fs` | `KOSS_BUILTIN_NONE` | `internal/fs.js` | `true` |
| `internal/net` | `KOSS_BUILTIN_NONE` | `internal/net.js` | `true` |
| `internal/crypto` | `KOSS_BUILTIN_NONE` | `internal/crypto.js` | `true` |
| `internal/stream` | `KOSS_BUILTIN_NONE` | `internal/stream.js` | `true` |

---

## 模块查找优先级

```
import specifier
     │
     ├─ koss: 协议? ────── yes → 内置模块注册表
     │                           ├─ 存在且是内部模块? → 拒绝访问
     │                           ├─ 存在且 flag 未启用? → BuiltinDisabledError
     │                           └─ 存在且 flag 已启用? → 加载源码
     │
     ├─ node: 前缀? ────── yes → 内置模块注册表
     │                           └─ 查找 node_shim/*.js
     │
     └─ 裸名? ──────────── yes → 多路径查找
                                ├─ 直接路径: path.js
                                ├─ node_shim 路径: node_shim/path.js
                                ├─ 目录索引: path/index.js
                                └─ 内部模块: _http_client.js
```

---

## 加载器实现

### KossModuleLoader

模块加载器实现 Boa 引擎的 `ModuleLoader` trait，处理所有 `koss:` 协议模块的加载。

```rust
// module_loader.rs

impl ModuleLoader for KossModuleLoader {
    fn load(
        &self,
        referrer: &Module,
        specifier: &str,
        finish: &dyn Fn(Result<Module, JsError>, &mut Context),
        context: &mut Context,
    ) {
        if specifier.starts_with("koss:") {
            // 通过 builtins.rs 解析并加载模块
            let result = resolve_builtin_specifier(specifier, self.flags);
            // ...
        } else if specifier.starts_with("node:") {
            // 通过 resolver.rs 解析模块
            // ...
        } else {
            // 裸名模块回退到 resolver.rs
            // ...
        }
    }
}
```

### CJS → ESM 包装

所有 `koss:` 协议模块在加载时自动经过 CJS→ESM 包装：

```rust
fn wrap_cjs_for_esm(source: &str) -> String {
    if has_esm_exports(source) {
        return source.to_string();  // 已是 ESM，直接返回
    }
    
    // CJS 模块自动添加 ESM 包装
    let mut wrapped = String::new();
    wrapped.push_str("var module = { exports: {} };\n");
    wrapped.push_str("var exports = module.exports;\n");
    wrapped.push_str(source);
    wrapped.push_str("\nexport default module.exports;\n");
    wrapped.push_str("globalThis.__koss_esm_result = module.exports;\n");
    wrapped
}
```

---

## 内部模块保护

### 访问控制

`koss:internal/*` 模块被标记为 `is_internal: true`，用户代码无法直接访问：

```javascript
// ❌ 失败 — 用户代码直接访问内部模块
import fs from 'koss:internal/fs';
// → KossBuiltinError: Cannot import 'koss:internal/fs'
//   This is an internal module and not accessible to user code.
```

```javascript
// ✅ 正确 — 通过 L3 兼容层间接访问
import fs from 'koss:node/fs';  // L3 内部会使用 koss:internal/fs
```

### 实现原理

```rust
// builtins.rs
if module.is_internal {
    return Err(internal_module_error(name));
}
```

---

## ESM vs CJS 导入支持

所有 `koss:` 协议模块同时支持两种导入语法：

### CommonJS (require)

```javascript
const fs = require('koss:node/fs');
const io = require('koss:io');
const crypto = require('koss:crypto');
```

### ES Module (import)

```javascript
import fs from 'koss:node/fs';
import { read, write } from 'koss:io';
import { hash, randomBytes } from 'koss:crypto';
```

### 混合使用

```javascript
import fs from 'koss:node/path';  // ESM
const io = require('koss:io');    // CJS（同一环境，兼容使用）

const joinedPath = path.join('/tmp', 'test.txt');
io.writeText(joinedPath, 'Hello');
```

---

## 错误处理

### BuiltinDisabledError

模块对应的 Builtin 标志未启用时：

```
KossBuiltinError: Cannot resolve module 'koss:bun'
  - Builtin flag KOSS_BUILTIN_BUN is not enabled.
  - Current builtins: 0x1 (KOSS_BUILTIN_NODE)
  - To enable: pass builtins=KOSS_BUILTIN_BUN when creating instance.
```

### InternalModuleError

直接访问内部模块时：

```
KossBuiltinError: Cannot import 'koss:internal/fs'
  - This is an internal module and not accessible to user code.
  - If you are a developer, ensure the import originates from /js_shims/ directory.
```

### ModuleNotFoundError

模块名称不存在时：

```
KossBuiltinError: Cannot resolve module 'koss:unknown_xyz'
  - no such builtin module: unknown_xyz
   - Available modules: node/fs, node/path, bun, deno, io, crypto, assert, buffer, events, http, ...
```

---

## 相关文档

- [内置模块系统指南](/zh/guide/builtin-modules)
- [ESM Import 支持指南](/zh/guide/esm-import)
- [Node.js 兼容层参考](/zh/reference/node-compat-layer)
- [Bun 兼容层参考](/zh/reference/bun-compat-layer)
- [Koss 原生模块参考](/zh/reference/koss-native-modules)
