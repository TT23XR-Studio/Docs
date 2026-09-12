# koss_is_builtin_enabled 函数

**功能描述**：检查指定的 Builtin 标志位是否在当前实例中启用。  
**返回值**：`bool` — `true` 表示该标志位已启用，`false` 表示未启用。

## 函数签名

```c
bool koss_is_builtin_enabled(KossInstance* inst, uint32_t flag);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |
| ***flag*** | ***uint32_t*** | 要检查的 Builtin 标志位（见 KossBuiltin） |

## 支持的标志位

| 标志位 | 值 | 说明 |
|--------|-----|------|
| `KOSS_BUILTIN_NODE` | `1 << 0` (1) | Node.js 兼容层 |
| `KOSS_BUILTIN_BUN` | `1 << 1` (2) | Bun 兼容层 |
| `KOSS_BUILTIN_DENO` | `1 << 2` (4) | Deno 兼容层 |
| `KOSS_BUILTIN_KOSS` | `1 << 3` (8) | Koss 原生模块 |

## 说明

`koss_is_builtin_enabled` 是对 `koss_get_builtins` 的便捷封装，用于快速检查单个 Builtin 标志位的启用状态。

等效实现：

```c
bool koss_is_builtin_enabled(KossInstance* inst, uint32_t flag) {
    return (koss_get_builtins(inst) & flag) != 0;
}
```

### 典型用途

- 运行时检查特定兼容层是否可用
- 条件性加载模块或功能
- 调试和诊断

## 使用示例

### C

```c
#include <stdio.h>
#include "kossjs.h"

int main() {
    KossInstance* inst = koss_create_with_builtins(
        KOSS_CAP_ALL,
        KOSS_BUILTIN_NODE,  // 仅启用 Node.js
        true
    );
    
    if (koss_is_builtin_enabled(inst, KOSS_BUILTIN_NODE)) {
        printf("Node.js modules available\n");
        
        KossResult result = koss_eval(inst,
            "const path = require('koss:node/path');"
            "path.join('/usr', 'local', 'bin');"
        );
        if (result.code == 0) {
            printf("Path: %s\n", result.value);
            koss_free_result(result);
        }
    }
    
    if (!koss_is_builtin_enabled(inst, KOSS_BUILTIN_BUN)) {
        printf("Bun modules not available (expected)\n");
    }
    
    if (!koss_is_builtin_enabled(inst, KOSS_BUILTIN_KOSS)) {
        printf("Koss native modules not available (expected)\n");
    }
    
    koss_destroy(inst);
    return 0;
}
```

### Python

```python
from kossjs_interface import KossJS

# 创建仅启用 Bun 的实例
koss = KossJS(
    capabilities=KossJS.KOSS_CAP_ALL,
    builtins=KossJS.KOSS_BUILTIN_BUN,
    stable=True
)

# 检查各标志位
checks = {
    "Node.js": KossJS.KOSS_BUILTIN_NODE,
    "Bun": KossJS.KOSS_BUILTIN_BUN,
    "Deno": KossJS.KOSS_BUILTIN_DENO,
    "Koss": KossJS.KOSS_BUILTIN_KOSS,
}

for name, flag in checks.items():
    enabled = koss.is_builtin_enabled(flag)
    print(f"{name}: {'enabled' if enabled else 'disabled'}")

# 条件性执行
if koss.is_builtin_enabled(KossJS.KOSS_BUILTIN_BUN):
    result = koss.eval("""
        import { version } from 'koss:bun';
        version;
    """)
    print(f"Bun version: {result}")

koss.destroy()
```

### TypeScript

```typescript
import { KossJS } from './kossjs_interface';

const koss = new KossJS(
    undefined,
    true,
    KossJS.KOSS_CAP_ALL,
    KossJS.KOSS_BUILTIN_DENO | KossJS.KOSS_BUILTIN_KOSS
);

// 批量检查
const flags = [
    { name: 'Node.js', flag: KossJS.KOSS_BUILTIN_NODE },
    { name: 'Bun', flag: KossJS.KOSS_BUILTIN_BUN },
    { name: 'Deno', flag: KossJS.KOSS_BUILTIN_DENO },
    { name: 'Koss', flag: KossJS.KOSS_BUILTIN_KOSS },
];

for (const { name, flag } of flags) {
    const enabled = koss.isBuiltinEnabled(flag);
    console.log(`${name}: ${enabled ? 'enabled' : 'disabled'}`);
}

// 根据状态执行不同逻辑
if (koss.isBuiltinEnabled(KossJS.KOSS_BUILTIN_DENO)) {
    koss.eval(`
        import { readTextFile } from 'koss:deno';
        const text = await readTextFile('/tmp/test.txt');
        console.log(text);
    `);
} else {
    koss.eval(`
        const fs = require('fs');
        console.log(fs.readFileSync('/tmp/test.txt', 'utf8'));
    `);
}

koss.destroy();
```

## 相关文档

- [内置模块系统指南](/zh/guide/builtin-modules)
- [koss_get_builtins](/zh/api/functions/koss_get_builtins)
- [koss_create_with_builtins](/zh/api/functions/koss_create_with_builtins)
