# API 参考

本节详细介绍了 KossJS 的 API 接口、数据结构和用法。

## 核心概念

### KossInstance

KossJS 中的每个 JS 实例都是完全隔离的虚拟机 (VM)，互不影响。您可以创建任意数量的实例。

### KossResult

大多数 API 函数返回 ***KossResult*** 结构体：

```c
typedef struct {
    int code;       /* 0=ok, 1=js error, 2=bad argument */
    char *value;    /* heap string — free with koss_free_string */
} KossResult;
```

| code | 含义 |
|------|------|
| 0 | 成功 |
| 1 | JavaScript 执行错误 |
| 2 | 无效参数 |

> 部分函数（如 `koss_get_binding`）还会返回额外错误码：`3` = 能力位拒绝、`4` = 审核配置错误/审核拒绝，详见各函数页面的"返回码"。

### KossNativeFn

原生函数回调类型：

```c
typedef char* (*KossNativeFn)(int argc, const char **argv);
```

### KossCapability（能力位掩码）

KossJS 使用 28 个细粒度能力位控制每个实例的可用能力（沙箱机制）。详见 [安全与沙箱指南](/zh/security-sandbox/security-sandbox)。

```c
typedef enum {
    /* 文件系统（6 个细粒度操作） */
    FS_READ         = 1u << 0,
    FS_WRITE        = 1u << 1,
    FS_DELETE       = 1u << 2,
    FS_MKDIR        = 1u << 3,
    FS_RENAME       = 1u << 4,
    FS_CHMOD        = 1u << 5,

    /* 网络（5 个细粒度操作） */
    NET_TCP_CLIENT  = 1u << 6,
    NET_TCP_SERVER  = 1u << 7,
    NET_UDP         = 1u << 8,
    NET_DNS         = 1u << 9,
    NET_FETCH       = 1u << 10,

    /* 加密（4 个细粒度操作） */
    CRYPTO_HASH     = 1u << 11,
    CRYPTO_HMAC     = 1u << 12,
    CRYPTO_RANDOM   = 1u << 13,
    CRYPTO_PBKDF2   = 1u << 14,

    /* 内置 FFI（5 个细粒度操作） */
    FFI_OPEN        = 1u << 15,
    FFI_CALL        = 1u << 16,
    FFI_ALLOC       = 1u << 17,
    FFI_CALLBACK    = 1u << 18,
    FFI_STRUCT      = 1u << 19,

    /* 其他模块（8 个操作） */
    NATIVE_ADDON    = 1u << 20,
    WASM            = 1u << 21,
    SHARED_MEMORY   = 1u << 22,
    HIGHRES_TIME    = 1u << 23,
    SYSINFO         = 1u << 24,
    MODULE_LOAD     = 1u << 25,
    DYNAMIC_CODE    = 1u << 26,
    DEBUG_CAP       = 1u << 27
} KossCapability;

#define KOSS_CAP_SANDBOX    0
#define KOSS_CAP_ALL_FS     (FS_READ | FS_WRITE | FS_DELETE | FS_MKDIR | FS_RENAME | FS_CHMOD)
#define KOSS_CAP_ALL_NET    (NET_TCP_CLIENT | NET_TCP_SERVER | NET_UDP | NET_DNS | NET_FETCH)
#define KOSS_CAP_ALL_CRYPTO (CRYPTO_HASH | CRYPTO_HMAC | CRYPTO_RANDOM | CRYPTO_PBKDF2)
#define KOSS_CAP_ALL_FFI    (FFI_OPEN | FFI_CALL | FFI_ALLOC | FFI_CALLBACK | FFI_STRUCT)
#define KOSS_CAP_ALL        0xFFFFFFFF
```

### KossBuiltin（内置模块标志位）

KossJS 使用 Builtin Flags 控制系统控制每个实例的内置模块可见性，与 Capability（沙箱能力）解耦。详见 [内置模块系统指南](/zh/guide/builtin-modules)。

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

| 标志位 | 值 | 控制模块 |
|--------|-----|----------|
| `KOSS_BUILTIN_NODE` | `1 << 0` | `koss:node/*`（29 个 Node.js 兼容模块） |
| `KOSS_BUILTIN_BUN` | `1 << 1` | `koss:bun` |
| `KOSS_BUILTIN_DENO` | `1 << 2` | `koss:deno` |
| `KOSS_BUILTIN_KOSS` | `1 << 3` | `koss:io/crypto/system/data/ffi` 等 23 个 koss 标准库模块 |

### Stable 模式

`stable` 参数控制实例的生产就绪模式。`stable=True`（默认）时禁用 FFI 等不稳定功能。详见 [安全与沙箱指南 - 稳定模式](/zh/security-sandbox/security-sandbox#二稳定模式stable)。

---

## C ABI 函数列表

### 实例生命周期

| 函数名 | 功能描述 |
|--------|----------|
| ***koss_create*** | 创建新的 JS 实例（默认能力 `KOSS_CAP_SANDBOX`，stable=true，builtins=ALL） |
| ***koss_create_with_caps*** | 按能力位掩码和 stable 模式创建实例 |
| ***koss_create_with_modules*** | 创建支持模块加载的 JS 实例（stable=true，builtins=ALL） |
| ***koss_create_with_modules_and_caps*** | 创建支持模块加载 + 能力控制 + stable 模式的实例 |
| ***koss_create_with_builtins*** | 按能力位掩码、Builtin 标志和 stable 模式创建实例 |
| ***koss_create_with_modules_and_builtins*** | 创建支持模块加载 + 能力控制 + Builtin 标志 + stable 模式的实例 |
| ***koss_destroy*** | 销毁 JS 实例并释放内存 |
| ***koss_get_capabilities*** | 查询实例当前能力集（只读） |
| ***koss_get_builtins*** | 查询实例当前 Builtin 标志位掩码 |
| ***koss_is_builtin_enabled*** | 检查指定 Builtin 标志位是否启用 |
| ***koss_is_stable*** | 查询实例是否处于稳定模式 |

### 安全与沙箱

| 函数名 | 功能描述 |
|--------|----------|
| ***koss_set_audit_mask*** | 设置审核掩码 |
| ***koss_get_audit_mask*** | 获取当前审核掩码 |
| ***koss_check_sandbox*** | 注册/清除同步审核回调 |
| ***koss_clear_js_audit*** | 清除 JS 层审核回调（`KossJS.set_audit_callback` 注册） |
| ***koss_enable_audit_debug*** | 启用/禁用审核调试模式 |

### 代码执行

| 函数名 | 功能描述 |
|--------|----------|
| ***koss_eval*** | 执行 JavaScript 代码并返回结果 |
| ***koss_run_file*** | 执行 JavaScript 文件 |
| ***koss_run_module*** | 执行 ES Module 文件 |
| ***koss_run_string*** | 执行 JavaScript 代码字符串 |
| ***koss_run_module_string*** | 执行 ES Module 代码字符串 |

### 异步执行 & 事件循环

| 函数名 | 功能描述 |
|--------|----------|
| ***koss_run_async*** | 执行异步代码并驱动事件循环直到完成或超时 |
| ***koss_tick*** | 运行事件循环的单次迭代 |

### 全局变量注入

| 函数名 | 功能描述 |
|--------|----------|
| ***koss_set_global_string*** | 设置全局字符串变量 |
| ***koss_set_global_number*** | 设置全局数字变量 |
| ***koss_set_global_bool*** | 设置全局布尔变量 |
| ***koss_set_global_null*** | 设置全局 null 变量 |
| ***koss_set_global_undefined*** | 设置全局 undefined 变量 |
| ***koss_set_global_json*** | 设置全局 JSON 对象/数组 |

### 原生函数 / 类注册

| 函数名 | 功能描述 |
|--------|----------|
| ***koss_register_function*** | 注册可从 JS 调用的原生函数 |
| ***koss_register_class*** | 注册支持 `new` 关键字的 JS 类 |
| ***koss_register_module_loader*** | 注册模块加载器 |

### Worker 线程池（已移除）

> **v0.1.0-dev.10 已移除。** Worker 线程池相关 API 不再存在于动态库中，以下页面仅为历史记录。

| 函数名 | 功能描述 |
|--------|----------|
| ~~***koss_create_worker_pool***~~ | ~~创建指定大小的 Worker 线程池~~（已移除） |
| ~~***koss_worker_post_message***~~ | ~~向指定 Worker 发送消息~~（已移除） |
| ~~***koss_worker_execute***~~ | ~~在 Worker 线程上执行代码~~（已移除） |
| ~~***koss_worker_try_recv***~~ | ~~非阻塞收取 Worker 消息/结果~~（已移除） |
| ~~***koss_worker_terminate***~~ | ~~终止指定 Worker~~（已移除） |
| ~~***koss_worker_shutdown***~~ | ~~关闭全部 Worker 线程池~~（已移除） |

### Fetch & 内部绑定

| 函数名 | 功能描述 |
|--------|----------|
| ***koss_fetch*** | 执行 HTTP 请求 |
| ***koss_get_binding*** | 获取内部 Rust 绑定信息（调试用） |

### 内存管理

| 函数名 | 功能描述 |
|--------|----------|
| ***koss_free_string*** | 释放字符串内存 |
| ***koss_free_result*** | 释放 KossResult 内存 |

### 信息获取

| 函数名 | 功能描述 |
|--------|----------|
| ***koss_version*** | 获取 KossJS 版本字符串 |

---

## 函数详情链接

详细文档请参阅各函数页面：

### 实例生命周期
- [koss_create](/zh/api/functions/koss_create)
- [koss_create_with_caps](/zh/api/functions/koss_create_with_caps)
- [koss_create_with_modules](/zh/api/functions/koss_create_with_modules)
- [koss_create_with_modules_and_caps](/zh/api/functions/koss_create_with_modules_and_caps)
- [koss_create_with_builtins](/zh/api/functions/koss_create_with_builtins)
- [koss_create_with_modules_and_builtins](/zh/api/functions/koss_create_with_builtins)
- [koss_destroy](/zh/api/functions/koss_destroy)
- [koss_get_capabilities](/zh/api/functions/koss_get_capabilities)
- [koss_get_builtins](/zh/api/functions/koss_get_builtins)
- [koss_is_builtin_enabled](/zh/api/functions/koss_is_builtin_enabled)
- [koss_is_stable](/zh/api/functions/koss_is_stable)

### 安全与沙箱
- [koss_set_audit_mask](/zh/api/functions/koss_set_audit_mask)
- [koss_get_audit_mask](/zh/api/functions/koss_get_audit_mask)
- [koss_check_sandbox](/zh/api/functions/koss_check_sandbox)
- [koss_clear_js_audit](/zh/api/functions/koss_clear_js_audit)
- [koss_enable_audit_debug](/zh/api/functions/koss_enable_audit_debug)

### 代码执行
- [koss_eval](/zh/api/functions/koss_eval)
- [koss_run_file](/zh/api/functions/koss_run_file)
- [koss_run_module](/zh/api/functions/koss_run_module)
- [koss_run_module_string](/zh/api/functions/koss_run_module_string)
- [koss_run_string](/zh/api/functions/koss_run_string)
- [koss_run_async](/zh/api/functions/koss_run_async)
- [koss_tick](/zh/api/functions/koss_tick)

### 全局变量注入
- [koss_set_global_string](/zh/api/functions/koss_set_global_string)
- [koss_set_global_number](/zh/api/functions/koss_set_global_number)
- [koss_set_global_bool](/zh/api/functions/koss_set_global_bool)
- [koss_set_global_null](/zh/api/functions/koss_set_global_null)
- [koss_set_global_undefined](/zh/api/functions/koss_set_global_undefined)
- [koss_set_global_json](/zh/api/functions/koss_set_global_json)

### 原生函数 / 类注册
- [koss_register_function](/zh/api/functions/koss_register_function)
- [koss_register_class](/zh/api/functions/koss_register_class)
- [koss_register_module_loader](/zh/api/functions/koss_register_module_loader)

### Worker 线程池（已移除）
- [koss_create_worker_pool](/zh/api/functions/koss_create_worker_pool)（已移除）
- [koss_worker_post_message](/zh/api/functions/koss_worker_post_message)（已移除）
- [koss_worker_execute](/zh/api/functions/koss_worker_execute)（已移除）
- [koss_worker_try_recv](/zh/api/functions/koss_worker_try_recv)（已移除）
- [koss_worker_terminate](/zh/api/functions/koss_worker_terminate)（已移除）
- [koss_worker_shutdown](/zh/api/functions/koss_worker_shutdown)（已移除）

### Fetch & 内部绑定
- [koss_fetch](/zh/api/functions/koss_fetch)
- [koss_get_binding](/zh/api/functions/koss_get_binding)

### 内存管理
- [koss_free_string](/zh/api/functions/koss_free_string)
- [koss_free_result](/zh/api/functions/koss_free_result)

### 信息获取
- [koss_version](/zh/api/functions/koss_version)

---

## 使用示例

### C 语言

```c
#include <stdio.h>
#include "kossjs.h"

int main() {
    // 创建实例（stable=true，默认）
    KossInstance* inst = koss_create();
    if (!inst) {
        fprintf(stderr, "Failed to create instance\n");
        return 1;
    }

    KossResult result = koss_eval(inst, "1 + 2");
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

with KossJS() as koss:
    result = koss.eval("'Hello ' + 'World'")
    print(result)
```

### TypeScript

```typescript
import { KossJS } from './kossjs_interface';

const koss = new KossJS();
const result = koss.eval("'Hello ' + 'World'");
console.log(result);
koss.destroy();
```

---

## 语言绑定

KossJS 提供以下语言的接口封装：

| 语言 | 文件 | 说明 |
|------|------|------|
| Python | `kossjs_interface.py` | 基于 ctypes 的完整封装 |
| TypeScript | `kossjs_interface.ts` | 基于 koffi 的完整封装 |

详细使用请参阅：
- [Python 接口使用](/zh/interface/py/how-to-use)
- [TypeScript 接口使用](/zh/interface/ts/how-to-use)

---

如需了解各个函数的详细信息，请点击上方链接查看各函数文档。
