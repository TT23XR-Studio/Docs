# bon-py 库使用指南

## 安装

```bash
pip install -e packages/bon-py
```

## 快速开始

```python
from bon_py.evaluator import evaluate, load

# 解析 BON 字符串
result = evaluate('{ "name": "Alice", "age": 30 }')
print(result)  # {'name': 'Alice', 'age': 30}

# 从文件加载
result = load("config.bon")
```

## API 参考

### `evaluate(source: str, base_dir: str = ".", params: dict[str, Any] = None) -> Any`

解析并执行 BON 源码字符串，返回 JSON 兼容的 Python 对象。

```python
from bon_py.evaluator import evaluate

# 基础 JSON
result = evaluate('{"a": 1, "b": [1, 2, 3]}')

# 使用模板
result = evaluate('''
server-{"host": "localhost", "port": 8080}
{"server": {server}}
''')

# 使用编译时参数
result = evaluate('{"env": $env, "debug": $debug}', params={"env": "production", "debug": False})

# 使用类
result = evaluate('''
class User {
    "name": "Anonymous",
    fn greet() { return "Hi, " + self.name }
}
User { "name": "Bob" }.greet()
''')
```

### `load(filepath: str, params: dict[str, Any] = None) -> Any`

从文件加载并执行 BON 代码。`base_dir` 自动设为文件所在目录，import 路径基于此解析。

```python
from bon_py.evaluator import load

# 基础加载
config = load("config.bon")

# 带参数加载
config = load("config.bon", params={"env": "production", "debug": True})
```

### `loads(source: str, base_dir: str = ".") -> Any`

`evaluate` 的别名，保持与 `json.loads` 一致的命名风格。

```python
from bon_py.evaluator import loads

data = loads('{"key": "value"}')
```

### `parse(source: str, filename: str = "<stdin>") -> Program`

将 BON 源码解析为 AST（抽象语法树），不做求值。用于需要检查语法或转换的场景。

```python
from bon_py.evaluator import parse

program = parse('{"x": 1}')
# program 是 Program AST 节点
```

### `Evaluator` 类

底层求值器，提供更多控制：

```python
from bon_py.evaluator import Evaluator, parse

evaluator = Evaluator(base_dir="/path/to/project")

# 可复用同一个求值器执行多个文件
program1 = parse(source1)
result1 = evaluator.evaluate(program1)

program2 = parse(source2)
result2 = evaluator.evaluate(program2)
```

### `EvalError`

求值错误，包含错误码和位置信息。

```python
from bon_py.evaluator import evaluate, EvalError

try:
    result = evaluate('undefined_var')
except EvalError as e:
    print(f"错误码: {e.code}")    # E001
    print(f"错误信息: {e}")
    if e.pos:
        print(f"位置: 第 {e.pos.line} 行, 第 {e.pos.column} 列")
```

## 使用场景

### 配置文件处理

```python
from bon_py.evaluator import load

# config.bon 中可以使用模板、类继承等
config = load("config.bon")

database_host = config["database"]["host"]
```

### 模板系统

```python
from bon_py.evaluator import evaluate

source = '''
cpu_small-{"cpu": "100m", "memory": "128Mi"}
cpu_large-{"cpu": "1000m", "memory": "1Gi"}

{
    "dev": {cpu_small},
    "prod": {cpu_large}
}
'''

result = evaluate(source)
# result["dev"] == {"cpu": "100m", "memory": "128Mi"}
# result["prod"] == {"cpu": "1000m", "memory": "1Gi"}
```

### 数据转换管道

```python
from bon_py.evaluator import evaluate

source = '''
{
    "data": [1, 2, 3, 4, 5],
    "doubled": std.map([1, 2, 3, 4, 5], fn(x) { return x * 2 }),
    "filtered": std.filter([1, 2, 3, 4, 5], fn(x) { return x > 3 }),
    "sum": std.reduce([1, 2, 3, 4, 5], 0, fn(a, b) { return a + b })
}
'''

result = evaluate(source)
# result["doubled"] == [2, 4, 6, 8, 10]
# result["filtered"] == [4, 5]
# result["sum"] == 15
```

### 与 JSON 互操作

```python
import json
from bon_py.evaluator import evaluate

# BON 是 JSON 的超集，标准 JSON 也能解析
json_str = '{"name": "test", "items": [1, 2, 3]}'
result = evaluate(json_str)

# 转回 JSON
print(json.dumps(result, indent=2))
```

### 批量处理文件

```python
from pathlib import Path
from bon_py.evaluator import load

for bon_file in Path("configs").glob("*.bon"):
    try:
        config = load(str(bon_file))
        print(f"{bon_file.name}: {config}")
    except Exception as e:
        print(f"{bon_file.name} 解析失败: {e}")
```
