# If/Else 条件表达式

BON 支持编译期条件表达式，用于根据条件选择不同的配置分支。

## 语法

```bon
# 表达式上下文（必须带 else）
if (condition) { expr } else { expr }

# else-if 链
if (condition) { expr } else if (condition) { expr } else { expr }

# 对象块上下文（else 可选，条件为假且无 else 时节点被剪除）
if (condition) { "key": value, ... }
if (condition) { "key": value, ... } else { "key": value, ... }
```

## Boolean 判定

BON 使用宽松的 truthiness 求值，无需显式布尔比较：

```bon
{"r": if (0) { "yes" } else { "no" }}   # → "no"
{"r": if (1) { "yes" } else { "no" }}   # → "yes"
```

详细规则：[Boolean 判定规则](/zh/reference/syntax/boolean-judgement)

## 基本用法

```bon
# 简单条件
{"mode": if (true) { "enabled" } else { "disabled" }}
# 输出: {"mode": "enabled"}

# 比较表达式
{"status": if (5 > 3) { "big" } else { "small" }}
# 输出: {"status": "big"}
```

## 形式 A：表达式上下文

`if` 作为值表达式使用，**必须带 `else`** 分支：

```bon
{
    "replicas": if ($env == "prod") { 5 } else { 1 },
    "log_level": if ($env == "prod") {
        "ERROR"
    } else if ($env == "staging") {
        "WARN"
    } else {
        "DEBUG"
    }
}
```

若没有 `else` 分支且条件为假，在表达式上下文（顶层或数组元素）中将抛出 `E011` 错误：

```bon
if (false) { "yes" }          # 错误：顶层是表达式上下文
[if (false) { "yes" }]        # 错误：数组元素也是表达式上下文
```

## 形式 B：对象块上下文

`if` 直接写在对象内部，用于**动态插入字段**。`else` 可选：

```bon
{
    "name": "app",
    # 条件成立时插入 debug 字段
    if ($env == "dev") {
        "debug": true,
        "verbose": false
    }
    # 条件不成立时，什么都不插入
}
```

**重要语义：** 条件为假且无 `else` 时，整个节点被**剪除（Pruned）**，不产生任何字段。

```bon
{"name": "app", if (false) { "extra": true }}
# 输出: {"name": "app"}  — extra 字段被完全忽略
```

## 链式 else-if

```bon
{"result": if (false) { "a" } else if (true) { "b" } else { "c" }}
# 输出: {"result": "b"}
```

## 与参数结合

```bon
{
    "timeout": if ($env == "prod") { 30 } else { 5 },
    "debug": if ($debug) { true } else { false }
}
```

## 返回值规则

| 条件 | 有 else | 无 else（表达式上下文） | 无 else（对象块上下文） |
| :--- | :--- | :--- | :--- |
| true | 返回 then 分支 | 返回 then 分支 | 插入 then 块中的字段 |
| false | 返回 else 分支 | **E011 错误** | **节点被剪除** |

## 应用场景

- 环境特定配置（生产/开发）
- 功能开关控制
- 可选字段动态插入
- 默认值回落
