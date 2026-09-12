# Boolean 判定规则

`if` 表达式支持宽松的 truthiness 求值，无需显式布尔比较。

## Truthiness 表

| 值类型 | 判定为 false | 判定为 true |
| :--- | :--- | :--- |
| 布尔值 | `false` | `true` |
| 空值 | `null` | — |
| 数字 | `0` | 非零数字（包括负数） |
| 字符串 | `""`（空字符串） | 非空字符串（包括 `" "`） |
| 数组 | `[]` | 非空数组 |
| 对象 | `{}` | 非空对象 |

## 快速参考

```bon
if (false)   { "no"  } else { "yes" }  # → "no"
if (null)    { "no"  } else { "yes" }  # → "no"
if (0)       { "no"  } else { "yes" }  # → "no"
if ("")      { "no"  } else { "yes" }  # → "no"
if ([])      { "no"  } else { "yes" }  # → "no"
if ({})      { "no"  } else { "yes" }  # → "no"

if (true)    { "yes" } else { "no" }   # → "yes"
if (1)       { "yes" } else { "no" }   # → "yes"
if (-1)      { "yes" } else { "no" }   # → "yes"
if ("x")     { "yes" } else { "no" }   # → "yes"
if ([1])     { "yes" } else { "no" }   # → "yes"
if ({"a":1}) { "yes" } else { "no" }   # → "yes"
```

## 实际应用

```bon
{
    # 功能开关：直接使用参数值判断
    "monitoring": if ($enable_monitoring) { "on" } else { "off" },

    # 空值保护：若未设置超时则使用默认值
    "timeout": if ($custom_timeout) { $custom_timeout } else { 30 },

    # 数组判空：非空列表才输出
    if ($tags) {
        "tags": $tags
    }
}
```

## 设计动机

宽松求值的核心目的是让配置编写更自然：

- **`if ($debug)` 优于 `if ($debug == true)`**：参数本身就是开关
- **`if ($env)` 优于 `if ($env != null && $env != "")`**：检查参数是否提供
- **`if ($tags)` 优于 `if (std.len($tags) > 0)`**：数组非空判断

## 与其它语言的对比

| 语言 | `0` | `""` | `[]` | `{}` | `null` |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BON** | false | false | false | false | false |
| Python | false | false | false | false | false |
| JavaScript | false | false | **true** | **true** | false |
| Ruby | **true** | **true** | **true** | **true** | false |

BON 遵循 Python 风格，在配置场景中最稳定可靠。
