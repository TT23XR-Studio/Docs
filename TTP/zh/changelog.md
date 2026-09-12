# 变更记录

## v1 — 初始定义

- 载荷格式统一为路径条目模式，移除目录树/扁平双模式
- A区/B区完全分离：A区存文件元数据+内容，B区存 Manifest+自定义数据
- 配置字节 0 位域重新设计：
  - b0-b1: 压缩算法（00=LZMA, 01=Brotli, 10=Deflate）
  - b2-b3: LZMA 字典大小（00=32M, 01=64M, 10=128M, 11=256M）
  - b4: HasCustom（B区自定义数据段）
  - b5: HasManifest（B区 Manifest）
  - b6: Encrypted（A区 AES-256 加密）
- 文件数量字段固定为 uint32
- 文件内容长度字段固定为 uint64，移除 ZIP64 式扩展
- A区长度字段（uint32）始终存在，用于分隔 A区和 B区
- Manifest 改为可选（HasManifest 位控制），仅用于应用元数据
- 新增 AES-256-GCM 加密支持（密码派生：PBKDF2-SHA256, 100000 次迭代）
- 路径分隔符强制使用 `/`，解包时自动转换为系统分隔符
- LZMA 字典大小支持 32/64/128/256 MiB，默认 64 MiB
- 库与 CLI 分离：`src/` 为纯库，`cli/` 为命令行入口
- JavaScript 库支持浏览器和 Node.js 双环境
- 魔数 `TTP\x01`，固定 26 字节头部
- 三种载荷模式：目录树、扁平标准、扁平扩展
- 三种压缩算法：LZMA、Brotli、Deflate
- S-Box 固定置换混淆（种子 `0x5A7B3C9D`）
- 分卷支持（`.ttp.001`, `.ttp.002`, …）
- 自定义数据段（可选，HasCustom 标志位）
- Manifest 透传
