# 什么是 KossJS？

## 概述

**KossJS**（Koss JavaScript Runtime）是一个高性能、跨平台、嵌入式 JavaScript 运行时引擎，可为外部项目提供强大的 JavaScript 执行能力支持，使开发者能够在自己的应用中轻松集成 JavaScript 脚本执行功能。

> [!TIP]
> KossJS 基于 [Boa](https://github.com/boa-dev/boa) JavaScript 引擎开发，使用 Rust 语言编写，利用 Rust 的内存安全特性和零成本抽象实现高性能。

## 开源协议

本项目采用 [GNU AGPL v3.0](https://gnu.ac.cn/licenses/agpl-3.0.html) 协议并附带 TT23XR Studio 第 7 节附加权限《独立模块闭源组合例外》开源。

## 核心特性

### 1. 标准化 C ABI
KossJS 通过标准的 C 应用程序二进制接口（ABI）暴露功能，支持：
- **Python**: 通过 ***kossjs_interface.py*** 封装调用
- **C/C++**: 通过 ***kossjs.h*** 封装调用
- **C#/.NET**: 通过 P/Invoke 封装调用
- **Java/Kotlin**: 通过 JNA (桌面) 或 JNI (Android) 接口调用
- **其他任何支持调用 C 函数的语言**

### 2. 嵌入式设计
KossJS 为嵌入式场景优化设计：
- **轻量级**：极低的内存占用（~10-15 MB）
- **极短 GC 停顿**：Rust 侧无 GC，JS 引擎 GC 停顿极短，适合实时应用
- **隔离实例**：每个 KossInstance 是完全隔离的 JS VM
- **快速创建销毁**：实例创建/销毁开销极低

### 3. 内置 Fetch API
原生支持 HTTP/HTTPS 请求：
- **TLS 支持**：基于 rustls 的 TLS 加密传输（默认兼容 Chrome TLS 加密套件）
- **Headers 支持**：自定义请求头
- **Body 支持**：支持请求体
- **完整响应**：返回状态码、状态文本、响应头、响应体

### 4. Node.js 兼容
内置 Node.js 标准库模块，按支持程度分类：

#### 完整支持（可直接 require）

| 模块 | 说明 |
|------|------|
| assert | 断言 |
| buffer | 缓冲区 |
| constants | 常量 |
| events | 事件 |
| os | 操作系统信息 |
| path | 路径处理 |
| process | 进程信息 |
| querystring | 查询字符串 |
| string_decoder | 字符串解码 |
| timers | 定时器 |
| url | URL 解析 |

#### 部分支持（核心 API 可用）

| 模块 | 说明 |
|------|------|
| crypto | 加密（randomBytes, createHash, createHmac, AES-GCM, Ed25519, pbkdf2） |
| dns | DNS 解析（lookup, resolve, lookupService, isIP） |
| http | HTTP 服务器与客户端 |
| https | HTTPS（未实现 TLS，显式抛错） |
| net | TCP 网络 |
| stream | 流处理 |
| tls | TLS（未实现，显式抛错） |
| dgram | UDP 数据报（真实 UDP 收发） |
| zlib | 压缩（gzip/deflate） |

#### 纯 JS Shim（基础功能可用）

| 模块 | 说明 |
|------|------|
| util | 工具函数 |
| perf_hooks | 性能钩子（单调时钟 + 直方图） |
| trace_events | 跟踪事件 |
| diagnostics_channel | 诊断通道 |

### 5. ES Modules 支持
完整支持 ES Module 语法：
- ***import*** / ***export*** 语法
- 异步模块加载
- 模块解析

## 支持的平台

KossJS 编译为平台原生的动态链接库：

| 平台 | 文件名 | 架构 |
|------|--------|------|
| Windows | ***kossjs.dll*** | x86_64, i686, aarch64 |
| Linux | ***kossjs.so*** | x86_64, aarch64 |
| macOS | ***kossjs.dylib*** | x86_64, aarch64 |
| Android | ***kossjs_android*.so*** | aarch64, armv7, x86_64 |
| iOS | ***kossjs_ios*.dylib*** | aarch64（设备 + 模拟器） |
| HarmonyOS | ***kossjs_harmony*.so*** | aarch64, x86_64 |

## 技术架构

```
     您的应用程序 (Python/C++/C#/Java)
                   ↓
         ( KossJS 的接口封装 )
                   ↓
         C ABI 接口 (标准调用约定)
                   ↓
   KossJS 核心引擎 (Rust 编译的动态链接库)
                   ↓
    Boa JS 引擎 / 异步运行时 / 网络层
```

## 使用场景

### 1. 桌面应用程序
- 脚本插件系统
- 用户宏支持
- 自动化脚本

### 2. 游戏开发
- 游戏脚本引擎
- 插件系统
- 自动化任务

### 3. 服务器应用
- 用户代码沙箱
- 动态配置
- 规则引擎

### 4. 移动应用
- Android 应用中的脚本执行
- 插件系统
- 动态功能

## 快速开始

### 基本要求
- 目标平台: Windows/Linux/macOS/Android
- Python 3.11+ (如果使用 Python 接口)

### 安装步骤
1. 下载对应平台的动态链接库
2. 将库文件放入项目目录
3. 复制 ***kossjs_interface.py*** 到项目（Python）

### 示例工作流
```python
# 1. 初始化
from kossjs_interface import KossJS
koss = KossJS()

# 2. 执行 JavaScript 代码
result = koss.eval("1 + 2")
print(result)  # 输出: 3

# 3. 设置全局变量
koss.set_global("myVar", "Hello from Python")
result = koss.eval("myVar")
print(result)  # 输出: Hello from Python

# 4. 使用 fetch API
code = '''
fetch("https://api.github.com/users/github")
  .then(response => response.json())
  .then(data => console.log(data.login))
'''
koss.eval(code)

# 5. 销毁实例
koss.destroy()
```

## 性能对比

| 特性 | KossJS | QuickJS | Duktape |
|------|-------|---------|---------|
| **核心语言** | Rust | C | C |
| **内存占用** | ~10-15 MB | ~200 KB | ~200 KB |
| **GC** | 标记-清除 | 引用计数 | 标记-清除 |
| **GC 停顿** | 有 | 无 | 有 |
| **并发支持** | 事件循环 + 多实例 | 单线程 | 单线程 |
| **ES Modules** | ✅ | ❌ | ❌ |
| **内置 Fetch** | ✅ | ❌ | ❌ |
| **Node.js 兼容** | 标准库模块 | 无 | 无 |

## 总结

KossJS 是一个专业级的嵌入式 JavaScript 解决方案：

| 功能 | 描述 |
|------|------|
| ✅ **高性能** | Rust 实现，极低内存占用 |
| ✅ **跨平台** | 一次集成，全平台运行 |
| ✅ **多语言** | 支持几乎所有主流编程语言 |
| ✅ **隔离性** | 完全隔离的 JS VM 实例 |
| ✅ **Node.js 兼容** | 标准库模块（assert、buffer、crypto、events、http、net、stream、url、zlib 等） |
| ✅ **ES Modules** | 原生 ES Module 支持 |
| ✅ **Fetch API** | 原生 HTTP 请求支持 |
| ✅ **开源** | 透明可控，可根据需要修改 |

---

**下一步**:
- [快速开始](/zh/guide/getting-started) - 立即开始使用 KossJS
- [标准库支持状态](/zh/reference/stdlib-support) - 查看完整的模块支持状态
- [stable 模式替代方案](/zh/reference/stable-alternatives) - FFI 被禁用时的替代实现
- [API 详解](/zh/api/API-overview) - 了解所有可用功能
- [Python 接口使用](/zh/interface/py/how-to-use) - Python 开发指南
- [TypeScript 接口使用](/zh/interface/ts/how-to-use) - TypeScript 开发指南
