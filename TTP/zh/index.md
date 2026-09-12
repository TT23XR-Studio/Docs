# TTP 格式规范 v1 — 文档目录

TTP（TT Pack）是 TT23XR Studio 专用的二进制包格式，前身为 VHP。它使用压缩与 S-Box 置换混淆生成不可读的纯二进制文件，支持 A/B 区分离、AES-256 加密和分卷存储。

## 文档结构

| 路径 | 内容 |
|------|------|
| [specification/header.md](specification/header.md) | 26 字节头部字段表与配置字节位域 |
| [specification/payload.md](specification/payload.md) | A区/B区分离设计与载荷格式 |
| [specification/compression.md](specification/compression.md) | 支持的压缩算法与 LZMA 字典大小参数 |
| [specification/obfuscation.md](specification/obfuscation.md) | S-Box 置换盒种子与生成算法 |
| [specification/volumes.md](specification/volumes.md) | 单卷 / 分卷命名与拼接规则 |
| [implementation/pack-flow.md](implementation/pack-flow.md) | 打包完整流程 |
| [implementation/unpack-flow.md](implementation/unpack-flow.md) | 解包完整流程 |
| [implementation/edge-cases.md](implementation/edge-cases.md) | 边界情况处理 |
| [implementation/custom-data.md](implementation/custom-data.md) | 自定义数据段规则与用途 |
| [api/python.md](api/python.md) | Python API 参考 |
| [api/javascript.md](api/javascript.md) | JavaScript API 参考 |
| [changelog.md](changelog.md) | 版本变更记录 |

## 数据体生命周期

```
原始文件/目录
    │
    ▼
┌─────────────────────────────┐
│  构建 A区明文                │  文件数量 + 路径条目
├─────────────────────────────┤
│  构建 B区明文                │  Manifest + CustomData (可选)
└──────────┬──────────────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐ ┌─────────┐
│ 压缩 A区 │ │ 压缩 B区 │  LZMA / Brotli / Deflate
└────┬────┘ └────┬────┘
     │           │
     ▼           ▼
┌─────────┐ ┌─────────┐
│ 处理 A区 │ │ S-Box   │
│ 加密/S-Box│ │ 置换 B区 │
└────┬────┘ └────┬────┘
     │           │
     ▼           ▼
┌─────────────────────────────┐
│  组装输出                    │
│  头部 + A区长度 + A区 + B区  │
└──────────┬──────────────────┘
           │
           ▼
       .ttp 文件
```
