# TLD ABI 命名风格变更说明

## 概述

TLD（Rust 版本）在最近的更新中，对暴露的 C ABI 函数命名风格进行了变更：

| 变更前（驼峰命名） | 变更后（蛇形命名） |
|-------------------|-------------------|
| ***getDownloader*** | ***get_downloader*** |
| ***startDownload*** | ***start_download*** |
| ***startDownload_ID*** | ***start_download_id*** |
| ***startMultipleDownloads_ID*** | ***start_multiple_downloads_id*** |
| ***pauseDownload*** | ***pause_download*** |
| ***resumeDownload*** | ***resume_download*** |
| ***stopDownload*** | ***stop_download*** |

## 变更原因

1. **遵循 Rust 命名规范**：Rust 语言默认使用 ***snake_case*** 作为函数命名风格，TLD 基于 Rust 开发，采用统一的命名风格更符合语言习惯。

2. **与底层实现一致**：Rust 编译后的符号名与源码函数名一致，使用蛇形命名可以直接映射，减少额外的名称转换层。

3. **提高可读性**：蛇形命名在跨语言调用时更易识别和区分单词边界。

## 影响范围

### 核心兼容性问题

由于 ABI 函数名称变更，存在以下**双向不兼容**问题：

| 场景 | 兼容性 | 说明 |
|------|--------|------|
| 新版接口封装 + 旧版 Golang 库 | ❌ 不兼容 | 函数名不匹配，无法调用 |
| 旧版接口封装 + 新版 Rust 库 | ❌ 不兼容 | 函数名不匹配，无法调用 |
| 新版接口封装 + 新版 Rust 库 | ✅ 兼容 | 官方已全部适配 |

> [!IMPORTANT]
> 如果您之前使用的是 TTHSD Golang，迁移到 TLD 时必须同时更新：
> 1. **动态库**：从 Golang 版本切换到 Rust 版本
> 2. **接口封装**：使用新版官方封装

### 官方接口封装状态

新版接口封装已全部适配完成，支持以下语言：

| 语言 | 状态 | 文档 |
|------|------|------|
| Python | ✅ 已适配 | [Python 接口使用](/zh/back/TLD/zh/interface/py/how-to-use) |
| Golang | ✅ 已适配 | [Golang 接口使用](/zh/back/TLD/zh/interface/golang/how-to-use) |
| TypeScript | ✅ 已适配 | [TypeScript 接口使用](/zh/back/TLD/zh/interface/ts/how-to-use) |
| C/C++/C# | ✅ 已适配 | [C/CPP/C# 接口使用](/zh/back/TLD/zh/interface/c_cpp_csharp/how-to-use) |
| Java/Kotlin | ✅ 已适配 | [Java/Kotlin 接口使用](/zh/back/TLD/zh/interface/java_kt/how-to-use) |
| Rust | ✅ 已适配 | [Rust 接口使用](/zh/back/TLD/zh/interface/rust/how-to-use) |
| Godot | ✅ 已适配 | [Godot 接口使用](/zh/back/TLD/zh/interface/godot/how-to-use) |

## 迁移建议

### 使用官方新版接口封装（推荐）

直接使用官方提供的最新版接口封装，已完全适配新版 Rust 库的蛇形命名风格。

### 自行适配（如有自定义封装）

如果您的项目使用自定义封装，需要将所有函数调用名从驼峰改为蛇形：

```python
# 旧版（适配 Golang 库）
lib.getDownloader(...)

# 新版（适配 Rust 库）
lib.get_downloader(...)
```

## 时间线

- **TTHSD Golang**：使用驼峰命名（***getDownloader*** 等），已停止开发
- **TLD**：使用蛇形命名（***get_downloader*** 等），持续维护

## 总结

ABI 命名风格的变更是 TLD 迁移到 Rust 后的自然选择，虽然对现有项目有一定迁移成本，但新的命名风格更加规范、统一。建议所有用户使用官方提供的接口封装，以获得最佳兼容性和持续更新支持。

---

**相关文档**：
- [API 概览](/zh/back/TLD/zh/api/API-overview)
- [快速开始](/zh/back/TLD/zh/guide/getting-started)
