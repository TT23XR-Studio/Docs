# 编译时参数

BON 支持通过 `$var` 语法注入编译时参数，用于环境特定的配置值。

## 语法

```bon
$var_name
```

`$` 前缀**专属于外部注入参数**。源码中不允许出现 `$xxx = value` 这样的赋值语句。

## 区分规则

一眼看源码，带 `$` 的是外部依赖，不带 `$` 的是内部常量：

```bon
# 内部常量（裸标识符，文件内定义）
cluster_name = "my-cluster"
default_replicas = 1

# 外部参数（$ 前缀，由编译时注入）
class Service {
    "name": cluster_name + "-svc",
    "replicas": if ($env == "prod") { 5 } else { default_replicas }
}
```

## 用法

```bon
# config.bon — 使用参数
{
    "env": $env,
    "debug": $debug,
    "replicas": $count
}
```

## 在 if 条件中使用

```bon
{
    "replicas": if ($env == "prod") { 5 } else { 1 },
    "debug": if ($debug) { true } else { false }
}
```

## 作为动态对象键

```bon
# 假设 $feature_name = "enable_cache"
{ $feature_name: true }
# 输出: {"enable_cache": true}
```

## CLI 使用

```bash
bon compile config.bon --param env=production --param debug=false --param count=3
```

## 程序化使用

### Python

```python
from bon_py.evaluator import evaluate, load

# 字符串中使用参数
result = evaluate('{"env": $env}', params={"env": "production"})

# 从文件加载并传递参数
result = load("config.bon", params={"env": "production", "debug": False})
```

### TypeScript

```typescript
import { evaluate, load } from "bon-ts";

// 字符串中使用参数
const result = evaluate('{"env": $env}', ".", { env: "production" });

// 从文件加载并传递参数
const result = load("config.bon", { env: "production", debug: false });
```

## 约束

- **只读**：`$var` 只能读取，不能赋值（`$x = 5` 是语法错误）
- **必须传入**：引用的参数若未在编译时传入，抛出 `E009` 错误
- **键名限制**：`$var` 作为对象键时，值必须为字符串

## 参数类型

支持 JSON 兼容类型：
- 字符串：`"production"`, `"dev"`
- 数字：`42`, `3.14`
- 布尔值：`true`, `false`
- 空值：`null`
- 数组：`[1, 2, 3]`
- 对象：`{"key": "value"}`

## 错误处理

```bon
{"env": $missing}
# 若未传入 $missing，抛出 E009: Missing parameter
```

## 应用场景

- 多环境配置（dev/staging/prod）
- 动态端口号分配
- 条件编译开关
- 构建参数注入（git sha、版本号）
