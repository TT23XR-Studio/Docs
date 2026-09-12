# koss_get_builtins 函数

**功能描述**：查询当前实例的 Builtin 标志位掩码（只读）。  
**返回值**：`uint32_t` — Builtin 标志位掩码。

## 函数签名

```c
uint32_t koss_get_builtins(KossInstance* inst);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |

## 说明

返回创建实例时设定的 Builtin 标志位掩码。可用于在运行时检查当前实例启用了哪些内置模块。

### 返回值解析

```c
uint32_t builtins = koss_get_builtins(inst);

// 检查单个标志位
if (builtins & KOSS_BUILTIN_NODE) { /* Node 兼容层已启用 */ }
if (builtins & KOSS_BUILTIN_BUN)  { /* Bun 兼容层已启用 */ }
if (builtins & KOSS_BUILTIN_DENO) { /* Deno 兼容层已启用 */ }
if (builtins & KOSS_BUILTIN_KOSS) { /* Koss 原生模块已启用 */ }

// 检查是否无内置模块
if (builtins == KOSS_BUILTIN_NONE) { /* 无内置模块 */ }

// 检查是否全部启用
if (builtins == KOSS_BUILTIN_ALL) { /* 全部启用 */ }
```

| 返回值 | 说明 |
|--------|------|
| `KOSS_BUILTIN_NONE` (0) | 无内置模块 |
| `contains KOSS_BUILTIN_NODE` (1) | Node.js 兼容层已启用 |
| `contains KOSS_BUILTIN_BUN` (2) | Bun 兼容层已启用 |
| `contains KOSS_BUILTIN_DENO` (4) | Deno 兼容层已启用 |
| `contains KOSS_BUILTIN_KOSS` (8) | Koss 原生模块已启用 |

## 使用示例

### C

```c
#include <stdio.h>
#include "kossjs.h"

void print_builtins(KossInstance* inst) {
    uint32_t builtins = koss_get_builtins(inst);
    
    printf("Builtins: 0x%08X\n", builtins);
    
    if (builtins & KOSS_BUILTIN_NODE) printf("  - Node.js compat\n");
    if (builtins & KOSS_BUILTIN_BUN)  printf("  - Bun compat\n");
    if (builtins & KOSS_BUILTIN_DENO) printf("  - Deno compat\n");
    if (builtins & KOSS_BUILTIN_KOSS) printf("  - Koss native\n");
    if (builtins == KOSS_BUILTIN_NONE) printf("  - None\n");
}

int main() {
    KossInstance* inst = koss_create_with_builtins(
        KOSS_CAP_ALL,
        KOSS_BUILTIN_NODE | KOSS_BUILTIN_KOSS,
        true
    );
    
    print_builtins(inst);
    // 输出：
    // Builtins: 0x00000009
    //   - Node.js compat
    //   - Koss native
    
    koss_destroy(inst);
    return 0;
}
```

### Python

```python
from kossjs_interface import KossJS

# 创建实例
koss = KossJS(
    capabilities=KossJS.KOSS_CAP_ALL,
    builtins=KossJS.KOSS_BUILTIN_NODE | KossJS.KOSS_BUILTIN_KOSS,
    stable=True
)

# 获取 Builtin 标志
builtins = koss.get_builtins()
print(f"Builtins: 0x{builtins:08X}")

# 解析标志位
if builtins & KossJS.KOSS_BUILTIN_NODE:
    print("Node.js compat: enabled")
if builtins & KossJS.KOSS_BUILTIN_BUN:
    print("Bun compat: enabled")
if builtins & KossJS.KOSS_BUILTIN_DENO:
    print("Deno compat: enabled")
if builtins & KossJS.KOSS_BUILTIN_KOSS:
    print("Koss native: enabled")

koss.destroy()
```

### TypeScript

```typescript
import { KossJS } from './kossjs_interface';

const koss = new KossJS(
    undefined,
    true,
    KossJS.KOSS_CAP_ALL,
    KossJS.KOSS_BUILTIN_ALL
);

const builtins = koss.getBuiltins();
console.log(`Builtins: 0x${builtins.toString(16)}`);

// 使用位运算检查
const hasNode = (builtins & KossJS.KOSS_BUILTIN_NODE) !== 0;
const hasBun = (builtins & KossJS.KOSS_BUILTIN_BUN) !== 0;

console.log(`Node: ${hasNode}, Bun: ${hasBun}`);

koss.destroy();
```

## 相关文档

- [内置模块系统指南](/zh/guide/builtin-modules)
- [koss_create_with_builtins](/zh/api/functions/koss_create_with_builtins)
- [koss_is_builtin_enabled](/zh/api/functions/koss_is_builtin_enabled)
