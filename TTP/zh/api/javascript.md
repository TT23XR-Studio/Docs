# JavaScript API 参考

## packer (浏览器 + Node.js)

### `packTTP(files, options)`

```javascript
async function packTTP(
  files: Map<string, Uint8Array>,
  options?: {
    compression?: 'lzma' | 'brotli' | 'deflate',
    lzmaDict?: number,
    manifest?: object | null,
    customData?: Uint8Array | string | object | null,
    password?: string | null,
  }
): Promise<Uint8Array>
```

**参数**

| 参数 | 默认 | 说明 |
|------|------|------|
| `files` | — | 文件映射 `Map<path, content>` |
| `compression` | `'lzma'` | 压缩算法 |
| `lzmaDict` | `64` | LZMA 字典大小 MiB |
| `manifest` | `null` | Manifest 对象 |
| `customData` | `null` | 自定义数据（自动转换为 Buffer） |
| `password` | `null` | 加密密码 |

**返回值**

返回 `Promise<Uint8Array>`，完整的 `.ttp` 文件内容。

**用法**

```javascript
// Node.js
const fs = require('fs');
const { packTTP } = require('./src/javascript/packer.js');

const files = new Map();
files.set('hello.txt', Buffer.from('Hello World'));
files.set('sub/dir/file.txt', Buffer.from('Nested file'));

const data = await packTTP(files, {
  compression: 'brotli',
  manifest: { version: '1.0' },
  password: 'secret123'
});
fs.writeFileSync('output.ttp', data);
```

```javascript
// 浏览器
const files = new Map();
files.set('hello.txt', new TextEncoder().encode('Hello World'));

const data = await packTTP(files, { compression: 'deflate' });
const blob = new Blob([data], { type: 'application/octet-stream' });
const url = URL.createObjectURL(blob);
```

## unpacker (浏览器 + Node.js)

### `unpackTTP(buffer, password?)`

```javascript
async function unpackTTP(
  buffer: Uint8Array | ArrayBuffer,
  password?: string | null
): Promise<{
  manifest: object | null,
  assetMap: Map<string, Buffer | string>,
  customData: Uint8Array | null
}>
```

**参数**

| 参数 | 说明 |
|------|------|
| `buffer` | 支持 `Uint8Array` 或 `ArrayBuffer` |
| `password` | 解密密码 |

**返回值**

| 字段 | Node.js | 浏览器 |
|------|---------|--------|
| `manifest` | `object \| null` | `object \| null` |
| `assetMap` | `Map<string, Buffer>` | `Map<string, Blob URL>` |
| `customData` | `Uint8Array \| null` | `Uint8Array \| null` |

浏览器中文件内容以 `URL.createObjectURL(new Blob([content]))` 形式提供。

**用法**

```javascript
// Node.js
const fs = require('fs');
const { unpackTTP } = require('./src/javascript/unpacker.js');

const buf = fs.readFileSync('output.ttp');
const { manifest, assetMap, customData } = await unpackTTP(buf, 'secret123');

for (const [path, content] of assetMap) {
  fs.writeFileSync(path, content);
}
```

```javascript
// 浏览器
const response = await fetch('output.ttp');
const buf = new Uint8Array(await response.arrayBuffer());
const { manifest, assetMap, customData } = await unpackTTP(buf);

// assetMap: Map<string, Blob URL>
// 可直接用于 <img src={url}> 或 <a href={url}>
```

## LZMA Worker 路径配置（浏览器）

浏览器模式需要加载 LZMA 脚本。通过 `window.TTP_LZMA_PATH` 自定义路径：

```html
<script>
  window.TTP_LZMA_PATH = './assets/lzma-min.js';
</script>
<script src="src/javascript/unpacker.js"></script>
```

## CLI 用法

```bash
# 打包
node cli/javascript/packer.js ./src output.ttp -c lzma -D 128 -m manifest.json

# 解包
node cli/javascript/unpacker.js output.ttp ./output

# 加密打包
node cli/javascript/packer.js ./src output.ttp -p mypassword

# 解密解包
node cli/javascript/unpacker.js output.ttp ./output -p mypassword
```
