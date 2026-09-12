---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "KossJS"
  text: "嵌入式 JavaScript 运行时"
  tagline: "由 TT23XR Studio 开发"
  image:
    src: https://images-sxxyrry.pages.dev/KossJS_Bigger.png
    alt: KossJS
  actions:
    - theme: brand
      text: "快速开始"
      link: "/zh/guide/getting-started"
    - theme: alt
      text: "什么是 KossJS"
      link: "/zh/guide/what-is-KossJS"
    - theme: alt
      text: "API 使用"
      link: "/zh/api/API-overview"

features:
  - title: "🔌 标准化 C ABI"
    details: "基于标准 C 应用程序二进制接口，支持从任何语言调用"
  - title: "🖥️ 6 大平台覆盖"
    details: "Windows、Linux、macOS、Android、HarmonyOS、iOS 全平台动态库编译"
  - title: "⚡ 极致性能"
    details: "Rust 实现，极短 GC 停顿、极低内存占用、异步事件循环"
  - title: "🌐 内置 Fetch API"
    details: "原生支持 HTTP/HTTPS 下载，带 TLS 指纹伪装"
  - title: "📦 Node.js 兼容"
    details: "内置 Node.js 标准库模块（assert、buffer、crypto、events、http、net、stream、url、zlib 等）"
  - title: "🔄 ES Modules"
    details: "原生支持 ES Module 导入导出语法"
  - title: "📦 FFI 和 .node API"
    details: "原生支持同步/异步 FFI 和兼容 .node 的 node 加载"
---