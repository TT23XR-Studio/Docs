# 贡献指南

感谢您对 KossJS 项目的关注和贡献意愿！

> [!TIP]
> KossJS 基于 [Boa](https://github.com/boa-dev/boa) JavaScript 引擎开发，使用 Rust 语言编写。

## 贡献方式

我们欢迎以下形式的贡献：

### 1. 代码贡献
- 修复 bug
- 添加新功能
- 优化性能

### 2. 文档改进
- 完善现有文档
- 纠正文档错误
- 添加示例代码

### 3. 问题反馈
- 报告 bug
- 提出功能建议
- 提供使用反馈

## 开发环境设置

### 前置要求

- **Rust 1.85+** - 用于编译核心库（项目使用 `edition = "2024"`，需 Rust 1.85 及以上）
- **Python 3.11+** - 用于开发和测试 Python 接口
- **Git** - 用于版本控制
- **Cargo** - Rust 包管理器

### 克隆仓库

```bash
git clone https://github.com/KossJS/KossJS.git
cd KossJS
```

### 编译项目

```bash
cargo build --release
```

## 提交代码

### 分支策略
- **main** - 主分支
- **feature/xxx** - 功能分支
- **fix/xxx** - 修复分支

### Pull Request 流程
1. Fork 本项目
2. 创建新的功能分支
3. 进行开发测试
4. 提交 Pull Request

### 要求
- 描述清晰
- 测试通过
- 代码规范（***cargo fmt***、***cargo clippy***）

## 代码规范

### Rust 代码
- 使用 ***cargo fmt*** 格式化代码
- 使用 ***cargo clippy*** 进行检查
- 编写单元测试

### Python 代码
- 遵循 PEP 8 编码规范
- 使用类型注解

## 许可证

通过向 KossJS 项目贡献代码，您同意您的贡献将遵循本项目采用的开源协议，即 [GNU AGPL v3.0](https://gnu.ac.cn/licenses/agpl-3.0.html) 及其附带的 TT23XR Studio 第 7 节附加权限《独立模块闭源组合例外》。

---

**感谢您的贡献！** 🙏
