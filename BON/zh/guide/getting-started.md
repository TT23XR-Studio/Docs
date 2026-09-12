# 快速开始

## 安装

### Python 实现

```bash
# 在 monorepo 根目录
pip install -e packages/bon-py

# 验证安装
python -m bon_py.cli -e '{ "hello": "world" }'
```

### TypeScript 实现

```bash
# 在 monorego 根目录
cd packages/bon-ts
npm install
npm run build

# 验证安装
node dist/cli.js -e '{ "hello": "world" }'
```

### VS Code 扩展

```bash
code --install-extension packages/bon-vsc-ext/bon-language-1.0.0.vsix
```

安装后 `.bon` 文件自动获得语法高亮和语言图标。

## 第一个 BON 文件

创建 `hello.bon`：

```bon
# 这是注释
{
    "name": "BON",
    "version": "1.0",
    "message": "Hello from Better Object Notation!"
}
```

解析：

```bash
# Python
python -m bon_py.cli hello.bon

# TypeScript
node packages/bon-ts/dist/cli.js hello.bon
```

输出：

```json
{
  "name": "BON",
  "version": "1.0",
  "message": "Hello from Better Object Notation!"
}
```

## 逐步升级

### 加上模板

```bon
defaults-{
    "host": "localhost",
    "port": 8080,
    "debug": false
}

{
    "server": {defaults},
    "test_server": {defaults, "debug": true}
}
```

```json
{
  "server": { "host": "localhost", "port": 8080, "debug": false },
  "test_server": { "host": "localhost", "port": 8080, "debug": true }
}
```

### 加上类

```bon
class Service {
    "name": "unnamed",
    "replicas": 1,
    "image": "app:latest",

    fn full_image() {
        return self.image
    }
}

{
    "api": Service { "name": "api", "replicas": 3 },
    "worker": Service { "name": "worker", "image": "worker:v2" }
}
```

```json
{
  "api": { "name": "api", "replicas": 3, "image": "app:latest" },
  "worker": { "name": "worker", "replicas": 1, "image": "worker:v2" }
}
```

### 加上标准库

```bon
{
    "items": [1, 2, 3, 4, 5],
    "doubled": std.map([1, 2, 3, 4, 5], fn(x) { return x * 2 }),
    "big": std.filter([1, 2, 3, 4, 5], fn(x) { return x > 3 }),
    "sum": std.reduce([1, 2, 3, 4, 5], 0, fn(a, b) { return a + b })
}
```

```json
{
  "items": [1, 2, 3, 4, 5],
  "doubled": [2, 4, 6, 8, 10],
  "big": [4, 5],
  "sum": 15
}
```

## 在代码中使用

### Python

```python
from bon_py.evaluator import evaluate, load

# 解析字符串
result = evaluate('{ "name": "Alice" }')

# 从文件加载
config = load("config.bon")
```

### TypeScript

```typescript
import { evaluate, load } from "bon-ts";

// 解析字符串
const result = evaluate('{ "name": "Alice" }');

// 从文件加载
const config = load("config.bon");
```

## 下一步

- 阅读 [语言规范概览](/zh/reference/syntax-overview) 了解完整语法
- 浏览 [标准库概览](/zh/reference/stdlib-overview) 了解所有内置函数
- 查看 [Python API](/zh/how-to-use/py) 或 [TypeScript API](/zh/how-to-use/ts) 了解库的详细用法
