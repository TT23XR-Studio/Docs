---
layout: home

hero:
  name: "SenRi FFI / 千里 FFI / せんり FFI"
  text: "统一 FFI（外部函数接口）库"
  tagline: "统一 FFI（外部函数接口）库，提供跨语言的原生 C 函数调用能力。支持 JavaScript/TypeScript 和 Python。"
  actions:
    - theme: brand
      text: "快速开始"
      link: "/zh/guide/getting-started"
    - theme: alt
      text: "什么是 SenRi FFI"
      link: "/zh/guide/what-is-senri-ffi"
    - theme: alt
      text: "API 概览"
      link: "/zh/api/API-overview"

features:
  - title: "跨语言/运行时统一 API"
    details: "同一套 FFI 概念和类型系统，JavaScript/TypeScript（KossJS、Node.js、Bun、Deno）和 Python（ctypes/cffi）均可使用"
  - title: "一次编写，到处运行"
    details: "JS 版本同一套代码可在 KossJS、Node.js、Bun 和 Deno 上运行，自动检测并选择正确的原生 FFI 后端"
  - title: "依赖极少"
    details: "JS: KossJS/Bun/Deno 内置 FFI，Node.js 安装 koffi；Python: 使用内置 ctypes，可选 cffi"
  - title: "完整类型系统"
    details: "统一的 C 类型名称 (int32、float64、cstring 等)，各语言/运行时/后端自动映射，支持指针、数组、结构体"
  - title: "结构体支持"
    details: "定义 C 结构体，自动处理布局、对齐和紧凑排列，支持嵌套结构体和 fromPointer 反序列化"
  - title: "指针 API"
    details: "从原始内存中读写基本类型、指针和 C 字符串，支持偏移读写和指针算术"
  - title: "回调函数"
    details: "将宿主语言函数封装为 C 函数指针，支持自动垃圾回收"
  - title: "易于扩展"
    details: "提供自定义 FFI 后端支持，可注入任意底层实现"
---
