# 自定义数据段

自定义数据段位于 **B区**，通过配置字节 0 的 bit 4（HasCustom）标记其存在。

## 位置

自定义数据段在 B区中 Manifest 之后（如果 Manifest 存在）：

```
B区 = [Manifest 长度 + Manifest] + [自定义数据长度 + 自定义数据]
```

- 自定义数据长度为 8 字节小端序 uint64
- 后续为对应字节数的任意二进制数据

## B区结构

```
[HasManifest = 1 时]
  Manifest 长度 (4 bytes, uint32 LE)
  Manifest 文本 (UTF-8 JSON)
[HasCustom = 1 时]
  自定义数据长度 (8 bytes, uint64 LE)
  自定义数据 (原始字节)
```

## 读取方式

B区数据经过压缩 + S-Box 置换后存储。解包时：
1. 逆 S-Box 置换
2. 解压
3. 按上述结构解析

## 用途

自定义数据段没有内部格式规定，由应用层自由定义。常见用途：

- 可执行指令（启动入口等）
- 许可证全文
- 图标等二进制资源
- 元描述 JSON

示例 JSON 格式的 custom data：

```json
{
  "run": "./main.exe",
  "license": "MIT",
  "license_text": "...",
  "custom_icon": "base64..."
}
```
