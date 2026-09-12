# koss_create_with_caps 函数

**功能描述**：按能力位掩码和稳定模式创建 JavaScript 实例，精确控制沙箱权限。  
**返回值**：成功返回实例指针，失败返回 NULL。

## 函数签名

```c
KossInstance* koss_create_with_caps(uint32_t caps, bool stable);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***caps*** | ***uint32_t*** | 能力位掩码（见 KossCapability） |
| ***stable*** | ***bool*** | 稳定模式。`true`（默认）禁用 FFI；`false` 启用 FFI |

## 能力位定义

```c
// 文件系统（6 个细粒度操作）
FS_READ         = 1 << 0   // 读取文件、目录、元数据
FS_WRITE        = 1 << 1   // 写入、追加、截断、复制
FS_DELETE       = 1 << 2   // 删除文件或空目录
FS_MKDIR        = 1 << 3   // 创建目录
FS_RENAME       = 1 << 4   // 重命名/移动
FS_CHMOD        = 1 << 5   // 修改权限、所有者、创建链接

// 网络（5 个细粒度操作）
NET_TCP_CLIENT  = 1 << 6   // TCP 客户端连接与数据发送
NET_TCP_SERVER  = 1 << 7   // TCP 服务端监听
NET_UDP         = 1 << 8   // UDP 发送与接收
NET_DNS         = 1 << 9   // DNS 解析
NET_FETCH       = 1 << 10  // HTTP/HTTPS 客户端请求

// 加密（4 个细粒度操作）
CRYPTO_HASH     = 1 << 11  // 哈希（MD5, SHA1, SHA256 等）
CRYPTO_HMAC     = 1 << 12  // HMAC
CRYPTO_RANDOM   = 1 << 13  // 随机数生成（randomBytes, randomUUID）
CRYPTO_PBKDF2   = 1 << 14  // 密钥派生（pbkdf2）

// 内置 FFI（5 个细粒度操作）
FFI_OPEN        = 1 << 15  // 加载/关闭动态库
FFI_CALL        = 1 << 16  // 调用 C 函数（同步/异步）
FFI_ALLOC       = 1 << 17  // 内存分配/释放/地址获取
FFI_CALLBACK    = 1 << 18  // 创建 JS 回调指针
FFI_STRUCT      = 1 << 19  // 结构体、数组、指针操作

// 其他模块（8 个操作）
NATIVE_ADDON    = 1 << 20  // 加载 .node 原生模块
WASM            = 1 << 21  // WebAssembly
SHARED_MEMORY   = 1 << 22  // SharedArrayBuffer 与 Atomics
HIGHRES_TIME    = 1 << 23  // 高精度计时（performance.now, process.hrtime）
SYSINFO         = 1 << 24  // 系统信息泄露（os.hostname, os.cpus 等）
MODULE_LOAD     = 1 << 25  // JS 模块加载（require, import）
DYNAMIC_CODE    = 1 << 26  // 动态代码执行（eval, Function, setTimeout 字符串）
DEBUG_CAP       = 1 << 27  // 调试/内省（Error.stack, console 详细输出）

// 组合常量
KOSS_CAP_SANDBOX    = 0
KOSS_CAP_ALL_FS     = FS_READ | FS_WRITE | FS_DELETE | FS_MKDIR | FS_RENAME | FS_CHMOD
KOSS_CAP_ALL_NET    = NET_TCP_CLIENT | NET_TCP_SERVER | NET_UDP | NET_DNS | NET_FETCH
KOSS_CAP_ALL_CRYPTO = CRYPTO_HASH | CRYPTO_HMAC | CRYPTO_RANDOM | CRYPTO_PBKDF2
KOSS_CAP_ALL_FFI    = FFI_OPEN | FFI_CALL | FFI_ALLOC | FFI_CALLBACK | FFI_STRUCT
KOSS_CAP_ALL        = 0xFFFFFFFF
```

## 说明

创建一个新的 JS 实例，通过位掩码精确控制可用的能力（文件系统、网络、加密、FFI、模块加载等）。被禁用的能力在 JS 侧调用时返回 undefined 或抛出 TypeError。

`stable` 参数控制是否启用 FFI 等不稳定功能：
- `stable=true`（推荐）：自动剥离 FFI 能力位，生产环境使用
- `stable=false`：启用 FFI，开发/调试用

详见 [安全与沙箱指南](/zh/security-sandbox/security-sandbox)。

## 使用示例

### C

```c
// 纯计算实例（无 IO），stable=true（默认）
KossInstance* inst = koss_create_with_caps(KOSS_CAP_SANDBOX, true);
koss_eval(inst, "1 + 1");  // 正常工作
koss_destroy(inst);

// 只允许网络请求
KossInstance* inst2 = koss_create_with_caps(KOSS_CAP_ALL_NET, true);

// 允许 fs + net，禁止 crypto + FFI
KossInstance* inst3 = koss_create_with_caps(KOSS_CAP_ALL_FS | KOSS_CAP_ALL_NET, true);

// 开发模式（启用 FFI）
KossInstance* inst4 = koss_create_with_caps(KOSS_CAP_ALL, false);
```

### Python

```python
from kossjs_interface import KossJS

# 沙箱模式
koss = KossJS(capabilities=KossJS.KOSS_CAP_SANDBOX)

# 部分启用
koss2 = KossJS(capabilities=KossJS.KOSS_CAP_ALL_NET | KossJS.KOSS_CAP_ALL_CRYPTO)

# 开发模式（启用 FFI）
koss3 = KossJS(capabilities=KossJS.KOSS_CAP_ALL, stable=False)
```

## 相关 API

- [koss_create](/zh/api/functions/koss_create)
- [koss_create_with_modules_and_caps](/zh/api/functions/koss_create_with_modules_and_caps)
- [koss_is_stable](/zh/api/functions/koss_is_stable)
- [koss_get_capabilities](/zh/api/functions/koss_get_capabilities)
