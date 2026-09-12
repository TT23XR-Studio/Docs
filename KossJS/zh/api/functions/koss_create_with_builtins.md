# koss_create_with_builtins 函数

**功能描述**：创建带有 Builtin 标志控制的 JavaScript 实例，精确控制内置模块的加载和沙箱权限。  
**返回值**：成功返回实例指针，失败返回 NULL。

## 函数签名

```c
KossInstance* koss_create_with_builtins(
    uint32_t capabilities,
    uint32_t builtins,
    bool stable
);

KossInstance* koss_create_with_modules_and_builtins(
    const char* root_dir,
    uint32_t capabilities,
    uint32_t builtins,
    bool stable
);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***capabilities*** | ***uint32_t*** | 能力位掩码（见 KossCapability），控制底层操作权限 |
| ***builtins*** | ***uint32_t*** | Builtin 标志位掩码，控制内置模块可见性 |
| ***stable*** | ***bool*** | 稳定模式。`true` 禁用 FFI；`false` 启用 FFI |
| ***root_dir*** | ***const char**** | 模块根目录路径（仅 `koss_create_with_modules_and_builtins`） |

## Builtin 标志位定义

```c
typedef enum {
    KOSS_BUILTIN_NONE  = 0,           // 无内置模块
    KOSS_BUILTIN_NODE  = 1 << 0,      // Node.js 兼容层
    KOSS_BUILTIN_BUN   = 1 << 1,      // Bun 兼容层
    KOSS_BUILTIN_DENO  = 1 << 2,      // Deno 兼容层
    KOSS_BUILTIN_KOSS  = 1 << 3,      // Koss 原生模块
    KOSS_BUILTIN_ALL   = 0xFFFFFFFF,  // 全部启用
} KossBuiltin;
```

### 标志位说明

| 标志位 | 值 | 控制模块 | 说明 |
|--------|-----|----------|------|
| `KOSS_BUILTIN_NODE` | `1 << 0` | `koss:node/*` | 29 个 Node.js 兼容模块 |
| `KOSS_BUILTIN_BUN` | `1 << 1` | `koss:bun` | Bun v1.1.x 兼容层 |
| `KOSS_BUILTIN_DENO` | `1 << 2` | `koss:deno` | Deno v2.0.x 兼容层 |
| `KOSS_BUILTIN_KOSS` | `1 << 3` | `koss:io/crypto/system/data/ffi` 等 | Koss 原生模块（23 个 koss 标准库模块） |

### 组合标志位

```c
// 仅启用 Node.js + Koss 原生模块
uint32_t builtins = KOSS_BUILTIN_NODE | KOSS_BUILTIN_KOSS;

// 启用 Bun + Deno
uint32_t builtins = KOSS_BUILTIN_BUN | KOSS_BUILTIN_DENO;

// 全部启用
uint32_t builtins = KOSS_BUILTIN_ALL;
```

## 能力位定义

参见 [koss_create_with_caps](/zh/api/functions/koss_create_with_caps#能力位定义) 中的完整能力位掩码表。

## 错误码

| 错误码 | 值 | 说明 |
|--------|-----|------|
| `KOSS_ERR_BUILTIN_DISABLED` | 10 | 内置模块被禁用 |
| `KOSS_ERR_INTERNAL_MODULE` | 11 | 尝试直接访问内部模块 |

## 说明

`koss_create_with_builtins` 提供了 layer 级的控制能力：

- **Capability**：控制 L1 Rust 绑定的访问权限（如文件读写、网络请求）
- **Builtin**：控制 L3 JS 兼容模块的可见性（如 Node/Bun/Deno 模块）
- **Stable**：控制 FFI 等不稳定功能的启用

`koss_create_with_modules_and_builtins` 在 `koss_create_with_builtins` 的基础上增加了外部模块加载支持，可通过 `root_dir` 指定模块查找路径。

### 向后兼容

```c
// 旧 API 内部调用新 API，默认 builtins = KOSS_BUILTIN_ALL
// 注意（v0.1.0-dev.10）：默认能力为 KOSS_CAP_SANDBOX
static inline KossInstance* koss_create(void) {
    return koss_create_with_builtins(KOSS_CAP_SANDBOX, KOSS_BUILTIN_ALL, true);
}

static inline KossInstance* koss_create_with_modules(const char* root_dir) {
    return koss_create_with_modules_and_builtins(root_dir, KOSS_CAP_SANDBOX, KOSS_BUILTIN_ALL, true);
}
```

## 使用示例

### C

```c
#include <stdio.h>
#include "kossjs.h"

int main() {
    // 仅启用 Node.js 兼容层 + Koss 原生模块
    KossInstance* inst = koss_create_with_builtins(
        KOSS_CAP_ALL,
        KOSS_BUILTIN_NODE | KOSS_BUILTIN_KOSS,
        true  // stable
    );
    
    if (!inst) {
        fprintf(stderr, "Failed to create instance\n");
        return 1;
    }
    
    // 验证状态
    uint32_t builtins = koss_get_builtins(inst);
    printf("Builtins: 0x%08X\n", builtins);
    
    KossResult result = koss_eval(inst, 
        "var io = require('koss:io');"
        "io.readText('/tmp/test.txt')");
    
    if (result.code == 0) {
        printf("Result: %s\n", result.value);
        koss_free_result(result);
    }
    
    koss_destroy(inst);
    return 0;
}
```

### Python

```python
from kossjs_interface import KossJS

# 仅启用 Bun + Deno 兼容层
koss = KossJS(
    capabilities=KossJS.KOSS_CAP_ALL,
    builtins=KossJS.KOSS_BUILTIN_BUN | KossJS.KOSS_BUILTIN_DENO,
    stable=True
)

# 验证
print(f"Builtins: {koss.get_builtins():#010x}")
print(f"Bun: {koss.is_builtin_enabled(KossJS.KOSS_BUILTIN_BUN)}")
print(f"Deno: {koss.is_builtin_enabled(KossJS.KOSS_BUILTIN_DENO)}")
print(f"Node: {koss.is_builtin_enabled(KossJS.KOSS_BUILTIN_NODE)}")

# Bun 可用
result = koss.eval("""
    import { version } from 'koss:bun';
    version;
""")
print(f"Bun version: {result}")

# Node 不可用
try:
    koss.eval("import { readFileSync } from 'koss:node/fs'")
except Exception as e:
    print(f"Error: {e}")

koss.destroy()
```

### TypeScript

```typescript
import { KossJS } from './kossjs_interface';

// 全部启用（位置参数：libPath?, stable?, caps?, builtins?）
const koss = new KossJS(
    undefined,
    true,
    KossJS.KOSS_CAP_ALL,
    KossJS.KOSS_BUILTIN_ALL
);

console.log(`Builtins: ${koss.getBuiltins().toString(16)}`);
console.log(`Bun enabled: ${koss.isBuiltinEnabled(KossJS.KOSS_BUILTIN_BUN)}`);

koss.eval(`
    import fs from 'koss:node/fs';
    import { version } from 'koss:bun';
    console.log(version);
`);

koss.destroy();
```

## 相关文档

- [内置模块系统指南](/zh/guide/builtin-modules)
- [koss_get_builtins](/zh/api/functions/koss_get_builtins)
- [koss_is_builtin_enabled](/zh/api/functions/koss_is_builtin_enabled)
- [ESM Import 支持指南](/zh/guide/esm-import)
