# 边界情况处理

## 空目录

- **打包**：`collect_files()` 静默跳过空目录，不保留在载荷中
- **解包**：输出空目录（无文件）
- **保留空目录**：在 Manifest 中自定义 `empty_dirs` 字段，由应用层处理

## 文件数量 > 65535

无限制。文件数量使用 uint32（最大约 42.9 亿）。

## 单文件 > 4 GiB

无限制。文件内容长度使用 uint64。

## 文件名为空或包含特殊字符

文件名以 UTF-8 字节存储，路径分隔符强制使用 `/`。实现应支持任意 Unicode 字符，但不应包含 `\0`。

## 中段分卷缺失

扫描分卷时发现断层（如 001、002、004 存在，003 缺失），当前行为是静默停止于缺失处。解包器应警告预期卷数与实际卷数不匹配。

## 加密相关

| 场景 | 行为 |
|------|------|
| `password=None` | 不加密，A区使用压缩+S-Box（b6=0） |
| `password` 非空 | A区使用 AES-256-GCM 加密（b6=1） |
| `password` 错误 | AES-GCM 解密失败，抛出异常 |
| B区无数据 | 文件在 A区结束后终止，无 B区部分 |
| 分卷加密 | A区长度+加密A区+均在数据体中，按正常分卷规则切割 |

## 路径穿越攻击

解包器必须在写入文件前检测路径穿越：

```python
# Python
target_path = os.path.join(output_dir, path.replace('/', os.sep))
real_target = os.path.realpath(target_path)
real_output = os.path.realpath(output_dir)
if not real_target.startswith(real_output + os.sep):
    raise SecurityError(f"检测到路径穿越攻击: {path}")
```

## 压缩流损坏

解压时如果数据损坏，相应的解压函数应抛出异常，解包器捕获后报错退出。

## 非 LZMA 模式下的 LZMA Dict 位

当配置字节 b0-b1 不为 `00`（非 LZMA）时，b2-b3 必须为 `00`。解包器在非 LZMA 模式下忽略 b2-b3。
