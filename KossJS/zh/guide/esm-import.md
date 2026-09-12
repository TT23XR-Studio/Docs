# ESM Import 支持指南

本指南介绍 KossJS 的 ES Module (ESM) 导入支持，包括 CJS→ESM 自动包装、koss: 协议导入、以及混合导入模式。

---

## 概述

KossJS 支持标准的 ES Module `import` 语法，可以导入以下类型的模块：

1. **koss: 协议模块**：`koss:node/fs`、`koss:bun`、`koss:io` 等
2. **node: 前缀模块**：`node:fs`、`node:path` 等
3. **裸名模块**：`fs`、`path`、`crypto` 等
4. **内部模块**：`koss:internal/fs`（仅限内部使用）

---

## CJS → ESM 自动包装

### 机制说明

KossJS 内置的模块加载器会自动检测并包装 CJS 模块，使其兼容 ESM 导入语法。

**包装逻辑（`wrap_cjs_for_esm()` 函数）：**

```javascript
// 原始 CJS 模块源码
const path = require('path');
module.exports = { join, resolve, extname };

// 自动包装后
var module = { exports: {} };
var exports = module.exports;

const path = require('path');
module.exports = { join, resolve, extname };

export default module.exports;
globalThis.__koss_esm_result = module.exports;
```

### 检测规则

```rust
// 检测是否包含 ESM export 声明
fn has_esm_exports(source: &str) -> bool {
    for line in source.lines() {
        let trimmed = line.trim_start();
        if trimmed.starts_with("export ") 
            || trimmed.starts_with("export{")
            || trimmed.starts_with("export\n") {
            return true;
        }
    }
    false
}
```

- **已有 ESM 声明**：不包装，直接使用
- **无 ESM 声明**：自动添加 CJS→ESM 包装器

### 包装器输出

包装后的模块会将导出结果存储到全局变量：

```javascript
globalThis.__koss_esm_result = module.exports;
```

这允许在同步执行环境中获取异步模块的导出结果。

---

## 导入语法

### 1. koss: 协议导入

#### Node.js 兼容层

```javascript
// 默认导入
import fs from 'koss:node/fs';
import path from 'koss:node/path';
import events from 'koss:node/events';

// 命名导入（需要模块支持）
import { readFileSync, writeFileSync } from 'koss:node/fs';
import { join, resolve } from 'koss:node/path';
```

#### Bun 兼容层

```javascript
// 默认导入
import Bun from 'koss:bun';

// 命名导入
import { version, write, file, serve } from 'koss:bun';

// Bun 命名空间风格
const { version: bunVersion } = await import('koss:bun');
```

#### Deno 兼容层

```javascript
// 默认导入
import Deno from 'koss:deno';

// 命名导入
import { readTextFile, writeTextFile, serve } from 'koss:deno';
```

#### Koss 原生模块

```javascript
// I/O 模块
import io from 'koss:io';
import { read, write, stat, list } from 'koss:io';

// 加密模块
import crypto from 'koss:crypto';
import { hash, randomBytes, hmac } from 'koss:crypto';

// 系统模块
import system from 'koss:system';
import { arch, platform, memory } from 'koss:system';

// 数据模块
import data from 'koss:data';
import { toHex, fromHex, toBase64 } from 'koss:data';
```

### 2. node: 前缀导入

```javascript
import fs from 'node:fs';
import path from 'node:path';
import events from 'node:events';
import crypto from 'node:crypto';
import http from 'node:http';
```

### 3. 裸名导入

```javascript
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import events from 'events';
```

---

## 导入解析规则

### 模块查找优先级

```
1. koss: 协议模块
   ├── koss:node/* → node_shim/*.js
   ├── koss:bun    → bun_shim.js
   ├── koss:deno   → deno_shim.js
   ├── koss:*      → koss_shim/*.js
   └── koss:internal/* → internal/*.js

2. node: 前缀模块
   └── node:* → node_shim/*.js

3. 裸名模块
   ├── 直接匹配：path.js
   ├── node_shim 匹配：node_shim/path.js
   ├── 目录索引：path/index.js
   └── 内部模块：_http_client.js
```

### 路径解析示例

| 导入语句 | 解析路径 |
|----------|----------|
| `import fs from 'koss:node/fs'` | `node_shim/fs.js` |
| `import path from 'koss:node/path'` | `node_shim/path.js` |
| `import Bun from 'koss:bun'` | `bun_shim.js` |
| `import io from 'koss:io'` | `koss_shim/io.js` |
| `import fs from 'node:fs'` | `node_shim/fs.js` |
| `import fs from 'fs'` | `node_shim/fs.js` |
| `import path from 'path'` | `node_shim/path.js` |

---

## 使用示例

### 基础文件操作

```javascript
// 使用 Node.js 风格
import { readFileSync, writeFileSync } from 'koss:node/fs';
import { join } from 'koss:node/path';

const filePath = join('/tmp', 'test.txt');
writeFileSync(filePath, 'Hello KossJS!');
const content = readFileSync(filePath, 'utf8');
console.log(content);  // Hello KossJS!
```

### 混合使用多个模块

```javascript
import { readFileSync, writeFileSync } from 'koss:node/fs';
import { join, extname } from 'koss:node/path';
import { hash } from 'koss:crypto';
import { arch, platform } from 'koss:system';

// 文件操作
const filePath = join('/tmp', 'data.txt');
writeFileSync(filePath, 'Hello World');

// 计算哈希
const content = readFileSync(filePath, 'utf8');
const sha256 = hash('sha256', content);
console.log(`SHA256: ${sha256}`);

// 系统信息
console.log(`Platform: ${platform()}, Arch: ${arch()}`);
console.log(`Extension: ${extname(filePath)}`);
```

### Bun 风格代码

```javascript
import { version, write, file } from 'koss:bun';

console.log(`Bun version: ${version}`);

// 写入文件
await write('/tmp/bun-test.txt', 'Hello from Bun!');

// 读取文件
const content = await file('/tmp/bun-test.txt').text();
console.log(content);
```

### Deno 风格代码

```javascript
import { readTextFile, writeTextFile, serve } from 'koss:deno';

// 读写文件
await writeTextFile('/tmp/deno-test.txt', 'Hello from Deno!');
const content = await readTextFile('/tmp/deno-test.txt');
console.log(content);

// 启动 HTTP 服务器
const server = serve((req) => new Response('Hello Deno!'), { port: 8000 });
console.log(`Server running on port ${server.port}`);
```

### Koss 原生模块

```javascript
import { read, write, stat } from 'koss:io';
import { hash, randomBytes } from 'koss:crypto';

// 文件操作
const bytes = read('/tmp/data.bin');
write('/tmp/copy.bin', bytes);

// 文件信息
const info = stat('/tmp/data.bin');
console.log(`Size: ${info.size}, IsFile: ${info.isFile}`);

// 加密操作
const sha256 = hash('sha256', 'Hello KossJS');
const random = randomBytes(32);
console.log(`Random bytes: ${random.length}`);
```

---

## 高级用法

### 动态导入

```javascript
// 动态导入模块
const fsModule = await import('koss:node/fs');
const { readFileSync } = fsModule;

// 条件导入
let io;
if (needsNativeIO) {
    io = await import('koss:io');
} else {
    io = await import('koss:node/fs');
}
```

### 导入重命名

```javascript
import { readFileSync as readFS } from 'koss:node/fs';
import { read as readNative } from 'koss:io';

// 使用别名
const content1 = readFS('/tmp/test.txt', 'utf8');
const content2 = readNative('/tmp/test.txt');
```

### 模块命名空间

```javascript
import * as fs from 'koss:node/fs';
import * as path from 'koss:node/path';

console.log(Object.keys(fs));  // ['readFileSync', 'writeFileSync', ...]
console.log(Object.keys(path));  // ['join', 'resolve', ...]
```

---

## 测试覆盖

### ESM Import 测试

| 测试类 | 测试数量 | 覆盖内容 |
|--------|----------|----------|
| `TestESMImportKossNode` | 19 | Node.js 兼容层全部模块 |
| `TestESMImportKossBun` | 2 | Bun 兼容层（启用/禁用） |
| `TestESMImportKossDeno` | 1 | Deno 兼容层 |
| `TestESMImportKossIo` | 1 | koss:io 模块 |
| `TestESMImportKossCrypto` | 1 | koss:crypto 模块 |
| `TestESMImportKossSystem` | 1 | koss:system 模块 |
| `TestESMImportKossData` | 1 | koss:data 模块 |
| `TestESMImportKossInternal` | 4 | 内部模块 |
| `TestESMImportNodePrefix` | 5 | node: 前缀导入 |
| `TestESMImportFailure` | 2 | 错误处理 |
| `TestESMImportMixed` | 2 | 混合导入 |
| **总计** | **39** | |

### 测试示例

```python
def test_import_koss_node_fs(self):
    """测试导入 koss:node/fs 模块"""
    koss = KossJS(builtins=KossJS.KOSS_BUILTIN_ALL)
    keys = esm_import(koss, "import fs from 'koss:node/fs';\n")
    assert "readFileSync" in keys
    assert "writeFileSync" in keys
    koss.destroy()

def test_import_disabled_builtin(self):
    """测试导入未启用的模块"""
    koss = KossJS(builtins=KossJS.KOSS_BUILTIN_NONE)
    with pytest.raises(Exception):
        koss.run_module_string("import fs from 'koss:node/fs';\n")
    koss.destroy()
```

---

## 已知限制

1. **CJS 包装器使用简单启发式检测**：可能误判已包含 ESM 声明的模块
2. **`globalThis.__koss_esm_result` 全局污染**：多次导入可能覆盖前一次结果
3. **不支持循环依赖**：ESM 循环导入可能导致未定义行为
4. **动态导入需要异步环境**：`await import()` 需要顶层 await 支持

---

## 相关文档

- [内置模块系统指南](/zh/guide/builtin-modules)
- [koss: 协议模块参考](/zh/reference/koss-protocol)
- [Node.js 兼容层参考](/zh/reference/node-compat-layer)
