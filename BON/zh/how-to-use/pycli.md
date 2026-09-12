# bon-py CLI 使用指南

## 安装

```bash
# 在 monorepo 根目录
pip install -e packages/bon-py

# 或者直接安装
cd packages/bon-py
pip install .
```

## 基本用法

```bash
# 从文件读取并解析
bon file.bon

# 解析 BON 表达式
bon -e '{ "name": "Alice", "age": 30 }'

# 从 stdin 读取
echo '{ "key": "value" }' | bon

# 紧凑输出
bon -c file.bon

# 指定缩进
bon --indent 4 file.bon
```

## 命令行参数

| 参数 | 说明 |
|------|------|
| `file` | 要解析的 .bon 文件 |
| `-e, --eval` | 直接解析 BON 表达式字符串 |
| `-p, --pretty` | 美化输出（默认） |
| `-c, --compact` | 紧凑输出 |
| `--indent N` | 缩进级别（默认 2） |
| `--param KEY=VALUE` | 编译时参数，支持多个（可重复） |

## 使用编译时参数

```bash
# 传递字符串参数
bon config.bon --param env=production

# 传递布尔参数
bon config.bon --param debug=true --param verbose=false

# 传递数字参数
bon config.bon --param timeout=30 --param retries=3

# 多个参数
bon config.bon --param env=prod --param debug=false --param count=5
```

## 示例

### 解析简单对象

```bash
bon -e '{ "name": "BON", "version": "1.0" }'
```

输出：
```json
{
  "name": "BON",
  "version": "1.0"
}
```

### 使用模板

```bash
bon -e '
base_cpu-{"cpu": "250m"}
base_mem-{"memory": "512Mi"}
{
    "resources": {base_cpu},
    "limits": {base_mem}
}
'
```

输出：
```json
{
  "resources": {
    "cpu": "250m"
  },
  "limits": {
    "memory": "512Mi"
  }
}
```

### 使用类和继承

```bash
bon -e '
class Animal {
    "type": "unknown",
    fn move() { return "moving" }
}

class Dog extends Animal {
    "type": "canine",
    fn bark() { return "woof!" }
}

Dog { "breed": "Husky" }
'
```

输出：
```json
{
  "type": "canine",
  "breed": "Husky",
  "move": "moving",
  "bark": "woof!"
}
```

### 使用标准库

```bash
bon -e '
{
    "upper": std.upper("hello"),
    "split": std.split("a,b,c", ","),
    "map": std.map([1, 2, 3], fn(x) { return x * 2 }),
    "len": std.len("hello")
}
'
```

输出：
```json
{
  "upper": "HELLO",
  "split": ["a", "b", "c"],
  "map": [2, 4, 6],
  "len": 5
}
```

## 在 Python 代码中使用

```python
from bon_py.evaluator import evaluate, load

# 解析 BON 表达式
result = evaluate('{ "name": "Alice" }')

# 从文件加载
result = load("config.bon")

# 访问结果
print(result["name"])  # Alice
```

## 在 Shell 脚本中使用

```bash
#!/bin/bash

# 解析配置文件
CONFIG=$(bon config.bon)

# 提取值
NAME=$(bon -c -e "config.bon" | jq -r '.name')

# 管道处理
bon data.bon | jq '.items[]'
```
