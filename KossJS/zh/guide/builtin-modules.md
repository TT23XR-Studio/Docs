# 内置模块系统指南

本指南介绍 KossJS 的内置模块系统，包括 Builtin Flags 架构、三层模块体系、以及与 Capability 沙箱的区别。

---

## 概述

KossJS 采用 **Builtin Flags** 机制控制内置模块的加载，与 **Capability**（沙箱能力）完全解耦：

- **Capability**：控制底层 Rust 绑定的访问权限（如文件读写、网络请求）
- **Builtin**：控制上层 JS 兼容模块的可见性（如 Node/Bun/Deno 模块）

这种设计允许用户精确控制运行时环境，同时保持沙箱安全性。

---

## 架构设计

### 三层模块架构

```
┌─────────────────────────────────────────────────────────────┐
│  L3: 用户态兼容层 (Builtin Flags 控制)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ node:fs  │ │   bun    │ │   deno   │ │ koss:io  │       │
│  │ node:http│ │  :crypto │ │  :read   │ │ koss:crypto│     │
│  │ node:path│ │  :serve  │ │  :write  │ │ koss:system│     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│       ↓              ↓              ↓              ↓         │
├─────────────────────────────────────────────────────────────┤
│  L2: 内部系统层 (koss:internal/*) - 始终可用                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │internal/ │ │internal/ │ │internal/ │ │internal/ │       │
│  │   fs     │ │   net    │ │  crypto  │ │  stream  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│       ↓              ↓              ↓              ↓         │
├─────────────────────────────────────────────────────────────┤
│  L1: Rust 核心绑定层 (Capability 控制)                       │
│  __koss_fs_*, __koss_net_*, __koss_hash_*, _senri_ffi      │
└─────────────────────────────────────────────────────────────┘
```

### 各层职责

| 层级 | 说明 | 控制机制 | 用户可访问 |
|------|------|----------|------------|
| **L1** | Rust 原生绑定 | Capability 位 | 否（通过 L2/L3 间接访问） |
| **L2** | 内部 JS 桥接层 | 无（始终可用） | 不推荐（内部模块） |
| **L3** | 用户态兼容层 | Builtin Flags | 是 |

---

## KossBuiltin 枚举

### C ABI 定义

```c
// kossjs.h
typedef enum {
    KOSS_BUILTIN_NONE  = 0,           // 无内置模块
    KOSS_BUILTIN_NODE  = 1 << 0,      // Node.js 兼容层
    KOSS_BUILTIN_BUN   = 1 << 1,      // Bun 兼容层
    KOSS_BUILTIN_DENO  = 1 << 2,      // Deno 兼容层
    KOSS_BUILTIN_KOSS  = 1 << 3,      // Koss 原生模块
    KOSS_BUILTIN_ALL   = 0xFFFFFFFF,  // 全部启用
} KossBuiltin;
```

### Python 常量

```python
# kossjs_interface.py
class KossJS:
    KOSS_BUILTIN_NONE = 0
    KOSS_BUILTIN_NODE = 1 << 0  # 1
    KOSS_BUILTIN_BUN  = 1 << 1  # 2
    KOSS_BUILTIN_DENO = 1 << 2  # 4
    KOSS_BUILTIN_KOSS = 1 << 3  # 8
    KOSS_BUILTIN_ALL  = 0xFFFFFFFF
```

### TypeScript 常量

```typescript
// kossjs_interface.ts
// TypeScript 封装未导出独立枚举，使用 KossJS 类的静态常量：
static readonly KOSS_BUILTIN_NONE = 0;
static readonly KOSS_BUILTIN_NODE = 1 << 0;
static readonly KOSS_BUILTIN_BUN  = 1 << 1;
static readonly KOSS_BUILTIN_DENO = 1 << 2;
static readonly KOSS_BUILTIN_KOSS = 1 << 3;
static readonly KOSS_BUILTIN_ALL  = 0xFFFFFFFF;
```

---

## 标志位详解

### KOSS_BUILTIN_NODE (1 << 0)

控制 `koss:node/*` 命名空间下的 29 个 Node.js 兼容模块：

```javascript
// 启用后可用
import fs from 'koss:node/fs';
import path from 'koss:node/path';
import http from 'koss:node/http';
import { setTimeout as delay } from 'koss:node/timers/promises';

// 或使用 require
const fs = require('koss:node/fs');
```

**包含模块：**
- 文件系统：fs
- 网络：net, http, https, dns, dgram, tls
- 加密：crypto
- 数据：buffer, stream, stream/promises, stream/consumers, events, path, url, querystring
- 系统：os, process, util, assert, constants
- 其他：timers, timers/promises, string_decoder, perf_hooks, trace_events, diagnostics_channel, console

### KOSS_BUILTIN_BUN (1 << 1)

控制 `koss:bun` 模块：

```javascript
// 启用后可用
import { version, write, file, serve } from 'koss:bun';

// Bun 风格 API
Bun.write('/tmp/test.txt', 'Hello');
const content = await Bun.file('/tmp/test.txt').text();
```

### KOSS_BUILTIN_DENO (1 << 2)

控制 `koss:deno` 模块：

```javascript
// 启用后可用
import { readTextFile, writeTextFile, serve } from 'koss:deno';

// Deno 风格 API
const text = await Deno.readTextFile('/tmp/test.txt');
await Deno.writeTextFile('/tmp/output.txt', 'Hello');
```

### KOSS_BUILTIN_KOSS (1 << 3)

控制 23 个 Koss 原生模块：

| 模块 | 说明 |
|------|------|
| `koss:io` | 统一 I/O（文件+网络+流） |
| `koss:crypto` | 加密与安全（哈希/HMAC/AES-GCM/Ed25519） |
| `koss:system` | 系统信息（架构/平台/内存） |
| `koss:data` | 数据编码（Hex/Base64） |
| `koss:ffi` | 外部函数接口 |
| `koss:buffer` | Buffer 与二进制数据 |
| `koss:assert` | 断言库 |
| `koss:constants` | 系统常量 |
| `koss:querystring` | 查询字符串 |
| `koss:zlib` | 压缩/解压 |
| ... | 共 23 个 koss 标准库模块（详见 [Koss 原生模块参考](/zh/reference/koss-native-modules)） |

```javascript
// 启用后可用
import { read, write, stat } from 'koss:io';
import { hash, randomBytes } from 'koss:crypto';
import { arch, platform } from 'koss:system';
```

### KOSS_BUILTIN_ALL (0xFFFFFFFF)

启用所有内置模块，等效于：

```c
KOSS_BUILTIN_NODE | KOSS_BUILTIN_BUN | KOSS_BUILTIN_DENO | KOSS_BUILTIN_KOSS
```

---

## Capability 与 Builtin 的区别

### 概念对比

| 维度 | Capability | Builtin |
|------|------------|---------|
| **层级** | L1（Rust 绑定） | L3（JS 模块） |
| **控制对象** | 底层操作权限 | 上层模块可见性 |
| **默认值** | `KOSS_CAP_SANDBOX`（v0.1.0-dev.10 起） | `KOSS_BUILTIN_ALL` |
| **交互方式** | 运行时检查 | 模块加载时检查 |
| **错误类型** | `KossCapabilityError` | `KossBuiltinError` |

### 交互示例

```python
from kossjs_interface import KossJS

# 场景1：Builtin 启用，Capability 禁用
koss = KossJS(
    builtins=KossJS.KOSS_BUILTIN_NODE,  # Node 模块可见
    capabilities=KossJS.KOSS_CAP_SANDBOX,  # 无任何能力
    stable=True
)

# 模块可以加载，但调用时会失败
koss.eval("""
    const fs = require('koss:node/fs');
    // ↓ 这里会抛出 KossCapabilityError
    fs.readFileSync('/tmp/test.txt');
""")
```

```python
# 场景2：Builtin 禁用，Capability 启用
koss = KossJS(
    builtins=KossJS.KOSS_BUILTIN_NONE,  # 无内置模块
    capabilities=KossJS.KOSS_CAP_ALL_FS,  # 文件系统能力
    stable=True
)

# 模块加载失败，但底层绑定可用
koss.eval("""
    // ↓ 这里会抛出 KossBuiltinError
    const fs = require('koss:node/fs');
""")
```

### 组合策略

| 场景 | Capability | Builtin | 说明 |
|------|------------|---------|------|
| 完整环境 | `ALL` | `ALL` | 所有功能可用 |
| 仅 Node.js | `ALL_FS + ALL_NET` | `NODE` | 只加载 Node 兼容层 |
| 仅 Bun | `ALL_FS + ALL_NET` | `BUN` | 只加载 Bun 兼容层 |
| 仅加密 | `ALL_CRYPTO` | `KOSS` | 只加载 koss:crypto |
| 沙箱模式 | `SANDBOX` | `NONE` | 无内置模块，无能力 |
| 生产模式 | `ALL` | `ALL` + `stable=true` | 禁用 FFI |

---

## 使用示例

### C 语言

```c
#include "kossjs.h"

int main() {
    // 仅启用 Node.js 兼容层
    KossInstance* inst = koss_create_with_builtins(
        KOSS_CAP_ALL,
        KOSS_BUILTIN_NODE,
        true  // stable
    );
    
    // 检查 Builtin 状态
    bool node_enabled = koss_is_builtin_enabled(inst, KOSS_BUILTIN_NODE);
    bool bun_enabled = koss_is_builtin_enabled(inst, KOSS_BUILTIN_BUN);
    
    printf("Node: %s, Bun: %s\n", 
           node_enabled ? "enabled" : "disabled",
           bun_enabled ? "enabled" : "disabled");
    
    // 获取完整 Builtin 掩码
    uint32_t builtins = koss_get_builtins(inst);
    printf("Builtins: 0x%08X\n", builtins);
    
    koss_destroy(inst);
    return 0;
}
```

### Python

```python
from kossjs_interface import KossJS

# 创建仅启用 Koss 原生模块的实例
koss = KossJS(
    capabilities=KossJS.KOSS_CAP_ALL,
    builtins=KossJS.KOSS_BUILTIN_KOSS,
    stable=True
)

# 检查状态
print(f"Builtins: {koss.get_builtins():#010x}")
print(f"Node enabled: {koss.is_builtin_enabled(KossJS.KOSS_BUILTIN_NODE)}")
print(f"Koss enabled: {koss.is_builtin_enabled(KossJS.KOSS_BUILTIN_KOSS)}")

# 使用 Koss 原生模块
result = koss.eval("""
    var io = require('koss:io');
    io.writeText('/tmp/test.txt', 'Hello KossJS!');
    io.readText('/tmp/test.txt');
""")
print(result)  # Hello KossJS!

# Node 模块不可用
try:
    koss.eval("require('koss:node/fs')")
except Exception as e:
    print(f"Error: {e}")  # Builtin flag KOSS_BUILTIN_NODE is not enabled

koss.destroy()
```

### TypeScript

```typescript
import { KossJS } from './kossjs_interface';

// 组合多个 Builtin 标志（位置参数：libPath?, stable?, caps?, builtins?）
const koss = new KossJS(
    undefined,
    true,
    KossJS.KOSS_CAP_ALL,
    KossJS.KOSS_BUILTIN_NODE | KossJS.KOSS_BUILTIN_KOSS
);

// 检查状态
console.log(`Builtins: ${koss.getBuiltins().toString(16)}`);
console.log(`Bun enabled: ${koss.isBuiltinEnabled(KossJS.KOSS_BUILTIN_BUN)}`);

// Node 和 Koss 模块可用
koss.eval(`
    import fs from 'koss:node/fs';
    import { hash } from 'koss:crypto';
    console.log(hash('sha256', 'hello'));
`);

koss.destroy();
```

---

## 错误处理

### BuiltinDisabledError

当尝试导入未启用的 Builtin 模块时：

```
KossBuiltinError: Cannot resolve module 'koss:bun'
- Builtin flag KOSS_BUILTIN_BUN is not enabled.
- Current builtins: 0x1 (KOSS_BUILTIN_NODE)
- To enable: pass builtins=KOSS_BUILTIN_BUN when creating instance.
```

### InternalModuleError

当用户代码直接导入内部模块时：

```
KossBuiltinError: Cannot import 'koss:internal/fs'
- This is an internal module and not accessible to user code.
- If you are a developer, ensure the import originates from /js_shims/ directory.
```

---

## 最佳实践

1. **最小权限原则**：只启用需要的 Builtin 标志
2. **生产环境使用 `stable=true`**：自动剥离 FFI 能力
3. **组合使用 Capability 和 Builtin**：实现精细的权限控制
4. **避免直接访问 `koss:internal/*`**：使用 L3 兼容层 API

---

## 相关文档

- [ESM Import 支持指南](/zh/guide/esm-import)
- [Koss 原生模块参考](/zh/reference/koss-native-modules)
- [Node.js 兼容层参考](/zh/reference/node-compat-layer)
- [Bun 兼容层参考](/zh/reference/bun-compat-layer)
- [Deno 兼容层参考](/zh/reference/deno-compat-layer)
