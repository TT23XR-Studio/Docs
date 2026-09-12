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

SenRi FFI 项目的成功离不开开源社区的支持。

---

## 项目信息

- **项目名称**: SenRi FFI（千里 FFI / せんり FFI）
- **npm 包名**: `@tt23xrstudio/senri_ffi`
- **pypi 包名**: `senri-ffi`
- **python 导入包名**: `senri_ffi`
- **许可证**: [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- **GitHub**: [github.com/TT23XR-Studio/senri_ffi](https://github.com/TT23XR-Studio/senri_ffi)

---

## 项目团队

### 核心开发工作室

<VPTeamMembers size="small" :members="members_CoreStudio" />

### 核心开发

<VPTeamMembers size="small" :members="members_Core" />

### 贡献者（暂无）

<VPTeamMembers size="small" :members="members_Contributor" />

---

## 核心依赖

SenRi FFI 自身几乎无依赖：

### JavaScript 版本

- **[koffi v3](https://github.com/nicola-orlandos/koffi)** — Node.js 的 FFI 库（v3 使用字符串类型名）

### Python 版本

- **ctypes** — Python 标准库，无需额外安装
- **[cffi](https://cffi.readthedocs.io/)** — 可选依赖，提供更灵活的 FFI 支持

## 支持的语言和运行时

SenRi FFI 支持以下语言和运行时：

### JavaScript / TypeScript

| 运行时 | 说明 |
|--------|------|
| [KossJS](https://github.com/KossJS) | 嵌入式 JavaScript 运行时，内置 FFI 支持（同步 + 异步） |
| [Bun](https://bun.sh/) | 快速的全能 JavaScript 运行时（`Bun.FFI`，v1.3+），内置 FFI 支持 |
| [Deno](https://deno.com/) | 安全的 JavaScript/TypeScript 运行时（`Deno.dlopen`），原生异步 FFI |
| [Node.js](https://nodejs.org/) | 广泛使用的 JavaScript 运行时，通过 koffi 提供 FFI 支持 |

### Python

| 后端 | 说明 |
|------|------|
| `ctypes` | Python 标准库，所有平台可用 |
| `cffi` | 可选，更灵活的 FFI 支持 |

---

## 许可证

本项目采用 [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0) 协议开源发布。

---

**感谢所有使用和支持 SenRi FFI 的开发者！**
