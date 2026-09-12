# Python API 参考

## packer

### `pack_ttp(input_dir, ...)`

```python
def pack_ttp(
    input_dir: str,
    compression: str = 'lzma',
    lzma_dict: int = 64,
    volume_size: int = 0,
    manifest: dict | None = None,
    custom_data: bytes | None = None,
    password: str | None = None,
) -> bytes:
```

**参数**

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `input_dir` | `str` | — | 源目录路径 |
| `compression` | `str` | `"lzma"` | 压缩算法：`"lzma"` / `"brotli"` / `"deflate"` |
| `lzma_dict` | `int` | `64` | LZMA 字典大小 MiB：`32` / `64` / `128` / `256` |
| `volume_size` | `int` | `0` | 分卷大小（字节），`0` 表示不分卷 |
| `manifest` | `dict\|None` | `None` | Manifest 数据，`None` 则不写入 |
| `custom_data` | `bytes\|None` | `None` | 自定义数据段，`None` 则不写入 |
| `password` | `str\|None` | `None` | 加密密码，`None` 则不加密 |

**返回值**

返回完整的 `.ttp` 文件内容（`bytes`），含头部。

**异常**

- `NotADirectoryError` — `input_dir` 不是目录
- `ValueError` — 未知压缩算法或无效的 LZMA 字典大小
- `RuntimeError` — Brotli/LZMA/cryptography 未安装但被选用

**用法**

```python
from src.packer import pack_ttp

# 基本打包
data = pack_ttp("./myapp", "output.ttp")

# 带 Manifest 和加密
data = pack_ttp(
    "./myapp",
    compression="brotli",
    manifest={"version": "1.0", "author": "TT23XR"},
    password="secret123"
)

# 写入文件
from pathlib import Path
Path("output.ttp").write_bytes(data)
```

## unpacker

### `unpack_ttp(buffer, password=None)`

```python
def unpack_ttp(
    buffer: bytes,
    password: str | None = None,
) -> tuple[dict | None, dict[str, bytes], bytes | None]:
```

**参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `buffer` | `bytes` | 完整的 `.ttp` 文件内容（含头部） |
| `password` | `str\|None` | 解密密码，b6=1 时必须提供 |

**返回值**

返回 `(manifest, asset_map, custom_data)` 三元组：

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `manifest` | `dict\|None` | Manifest 对象，无则为 `None` |
| `asset_map` | `dict[str, bytes]` | 文件路径 → 文件内容字节 |
| `custom_data` | `bytes\|None` | 自定义数据段内容，无则为 `None` |

**异常**

- `ValueError` — 魔数/版本/格式错误，或文件已加密但未提供密码
- `RuntimeError` — 解压失败或不支持的压缩方法
- `SecurityError` — 检测到路径穿越攻击

**用法**

```python
from src.unpacker import unpack_ttp

manifest, assets, custom = unpack_ttp(open("output.ttp", "rb").read())
```

### `unpack_ttp_to_dir(ttp_path, output_dir, password=None)`

解包 `.ttp` 文件到指定目录。

```python
from src.unpacker import unpack_ttp_to_dir

unpack_ttp_to_dir("output.ttp", "./output", password="secret123")
```

## CLI 用法

```bash
# 打包
python cli/python/packer.py ./src output.ttp -c lzma -D 128 -m manifest.json

# 解包
python cli/python/unpacker.py output.ttp ./output

# 加密打包
python cli/python/packer.py ./src output.ttp -p mypassword

# 解密解包
python cli/python/unpacker.py output.ttp ./output -p mypassword
```
