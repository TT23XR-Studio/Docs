<script setup>
import { VPTeamMembers } from 'vitepress/theme'

const members_CoreStudio = [
  {
    avatar: 'https://images-sxxyrry.pages.dev/sxxyrryAvatar_old.jpg',
    name: 'TT23XR Studio',
    title: '项目创始工作室',
    links: [
      { icon: 'github', link: 'https://github.com/sxxyrry' },
    ]
  },
]

const members_Core = [
  {
    avatar: 'https://images-sxxyrry.pages.dev/sxxyrryAvatar.jpg',
    name: 'XstarRelight（来自 TT23XR Studio ）',
    title: '项目负责人，作者',
    links: [
      { icon: 'github', link: 'https://github.com/sxxyrry' },
    ]
  },
  {
    avatar: 'https://images-sxxyrry.pages.dev/Wangziqi0Avatar.png',
    name: 'Wangziqi0',
    title: '核心开发者',
    links: [
      { icon: 'github', link: 'https://github.com/Wangziqi0' }
    ]
  },
]

const members_Contributor = [
]
</script>

# 鸣谢

KossJS 项目的成功离不开开源社区的支持和众多贡献者的努力。在此，我们向所有帮助过项目的人和组织表示最诚挚的感谢。

## 核心依赖项目

KossJS 的开发离不开以下优秀的开源项目：

### Rust 语言生态

- **[Boa](https://github.com/boa-dev/boa)** - JavaScript 引擎
  - KossJS 的核心 JS 引擎（含 boa_engine、boa_parser、boa_runtime、boa_gc）
  - 许可证: MIT OR Apache-2.0

- **[Rust](https://www.rust-lang.org/)** - 编程语言
  - 提供内存安全保证和零成本抽象
  - 使 KossJS 能够支持多平台

### Rust Crate 依赖

| Crate | 用途 | 许可证 |
|-------|------|--------|
| [tokio](https://tokio.rs/) | 异步运行时与事件循环 | MIT |
| [reqwest](https://github.com/seanmonstar/reqwest) | HTTP/HTTPS 客户端（fetch） | MIT OR Apache-2.0 |
| [rustls](https://github.com/rustls/rustls) | TLS 加密传输 | MIT OR Apache-2.0 |
| [rustls-native-certs](https://github.com/rustls/rustls-native-certs) | 本地证书加载 | MIT OR Apache-2.0 |
| [webpki-roots](https://github.com/rustls/webpki-roots) | WebPKI 根证书 | MIT |
| [serde](https://serde.rs/) + [serde_json](https://github.com/serde-rs/json) | 序列化与 JSON 处理 | MIT OR Apache-2.0 |
| [rand](https://github.com/rust-random/rand) | 随机数生成 | MIT OR Apache-2.0 |
| [sha1](https://github.com/RustCrypto/hashes) | SHA-1 哈希 | MIT OR Apache-2.0 |
| [sha2](https://github.com/RustCrypto/hashes) | SHA-2 系列哈希 | MIT OR Apache-2.0 |
| [md-5](https://github.com/RustCrypto/hashes) | MD5 哈希 | MIT OR Apache-2.0 |
| [hmac](https://github.com/RustCrypto/MACs) | HMAC 消息认证码 | MIT OR Apache-2.0 |
| [pbkdf2](https://github.com/RustCrypto/password-hashes) | PBKDF2 密钥派生 | MIT OR Apache-2.0 |
| [base64](https://github.com/marshallpierce/rust-base64) | Base64 编解码 | MIT OR Apache-2.0 |
| [url](https://github.com/servo/rust-url) | URL 解析 | MIT OR Apache-2.0 |
| [once_cell](https://github.com/matklad/once_cell) | 惰性初始化 | MIT OR Apache-2.0 |
| [rustc-hash](https://github.com/rust-lang/rustc-hash) | 高性能哈希表 | Apache-2.0 |
| [num_cpus](https://github.com/seanmonstar/num_cpus) | CPU 核心数探测 | MIT OR Apache-2.0 |

### 平台绑定

| Crate | 用途 | 平台 | 许可证 |
|-------|------|------|--------|
| [winapi](https://github.com/retep998/winapi-rs) | Windows API 绑定 | Windows | MIT OR Apache-2.0 |
| [libc](https://github.com/rust-lang/libc) | POSIX C 库绑定 | Unix/Linux/macOS/iOS/Android | MIT OR Apache-2.0 |

### Python 接口

- **[ctypes](https://docs.python.org/3/library/ctypes.html)** - Python 外部函数库
  - 提供 Python 与 C 动态库的互操作性
  - Python 标准库的一部分

### 构建工具

- **[Cargo](https://doc.rust-lang.org/cargo/)** - 包管理器
- **[rustfmt](https://github.com/rust-lang/rustfmt)** - 代码格式化
- **[clippy](https://github.com/rust-lang/rust-clippy)** - 代码检查

## 项目团队

### 核心开发工作室

<VPTeamMembers size="small" :members="members_CoreStudio" />

### 核心开发

<VPTeamMembers size="small" :members="members_Core" />

### 贡献者（暂无）

<VPTeamMembers size="small" :members="members_Contributor" />

## 社区贡献者

感谢以下开发者：
- 感谢所有提交 Issue 和 Pull Request 的开发者
- 感谢提供宝贵建议和反馈的用户
- 感谢帮助完善文档的贡献者

## 特别感谢

- 感谢所有使用 KossJS 的用户和开发者
- 感谢 [Boa](https://github.com/boa-dev/boa) 团队提供的优秀引擎
- 感谢 Rust 社区提供的工具和库

---

## 如何贡献

如果您想为 KossJS 做出贡献，我们欢迎以下形式的帮助：

- **代码贡献**：提交 Pull Request 修复 bug 或添加新功能
- **文档改进**：完善文档，纠正错误
- **问题反馈**：提交 Issue 报告 bug 或提出功能建议
- **测试验证**：在不同平台测试 KossJS 的功能
- **推广分享**：向他人介绍和推荐 KossJS

[查看贡献指南](/zh/guide/contributing) | [提交 Issue](https://github.com/KossJS/KossJS/issues) | [发起 Pull Request](https://github.com/KossJS/KossJS/pulls)

---

**再次感谢所有为 KossJS 项目提供帮助的人！** 🎉
