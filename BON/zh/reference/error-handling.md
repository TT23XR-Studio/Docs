# 错误处理

BON 秉持"尽早失败 (Fail Fast)"原则。

## 错误类型总览

| 错误码 | 类型 | 触发条件 |
| :--- | :--- | :--- |
| `E001` | `UndefinedIdentifierError` | 引用了未定义的标识符、模板或类 |
| `E002` | `RecursiveTemplateError` | 模板循环引用 |
| `E003` | `UndefinedClassError` | 实例化了未定义的类 |
| `E004` | `CircularInheritanceError` | 类循环继承 |
| `E005` | `CircularDependencyError` | 计算属性循环依赖 |
| `E006` | `IndexOutOfBoundsError` | `std.at` 索引越界 |
| `E007` | `TypeError` | 类型不匹配或非法操作 |
| `E008` | `CircularImportError` | 文件循环导入 |
| `E009` | `MissingParameterError` | 引用了未传入的 `$` 参数 |
| `E010` | `IterationLimitExceededError` | `for` 循环迭代次数 > 10000 |
| `E011` | `InvalidConditionError` | 条件表达式求值失败（如缺少 else 分支、for 遍历非可迭代对象、$ 键名非字符串） |

## 错误信息格式

```
E001: Undefined identifier: undefined_var
   位置: 第 5 行, 第 10 列
```

错误信息包含：
1. **错误码**：唯一标识符（E001–E011）
2. **错误类型**：面向开发者的名称
3. **描述**：人类可读的错误原因
4. **源码位置**：行号和列号，便于定位

## 详细说明

### E009: MissingParameterError

在源码中使用了 `$` 参数，但编译时未传入对应的值：

```bon
{"env": $env}
# 若仅传入 params={"debug": true}，抛出：
# E009: Missing parameter: $env. Available: $debug
```

### E010: IterationLimitExceededError

`for` 循环的迭代次数超过最大限制（10000）：

```bon
for i in 0..15000 { i }
# 抛出 E010: For loop iteration count exceeds maximum
```

> 遇到此错误时，考虑使用 `std.map` 或减小参数值。

### E011: InvalidConditionError

条件表达式无法正常求值：

```bon
{"val": if (true) { "yes" }}       # 表达式上下文缺少 else
for x in "not an array" { x }      # 遍历非可迭代对象
{$bad: 1}  # 当 $bad = 42 时，键名非字符串
```

## Python 错误处理

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

## TypeScript 错误处理

```typescript
import { evaluate, EvalError } from "bon-ts";

try {
  const result = evaluate("undefined_var");
} catch (e) {
  if (e instanceof EvalError) {
    console.log(`错误码: ${e.code}`);  // E001
    console.log(`错误信息: ${e.message}`);
    if (e.pos) {
      console.log(`位置: 第 ${e.pos.line} 行, 第 ${e.pos.column} 列`);
    }
  }
}
```
