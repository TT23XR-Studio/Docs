# 标准库概览

BON 提供内置的 `std` 命名空间，包含纯函数，用于处理字符串、数组和对象。所有函数均为**编译期求值**。

## 函数速查表

### 字符串操作

| 函数 | 签名 | 说明 |
|------|------|------|
| `std.upper` | `upper(s: string) → string` | 转大写 |
| `std.lower` | `lower(s: string) → string` | 转小写 |
| `std.trim` | `trim(s: string) → string` | 去除首尾空白 |
| `std.split` | `split(s: string, sep: string) → array` | 按分隔符拆分 |
| `std.replace` | `replace(s: string, old: string, new: string) → string` | 替换子串 |

### 数组操作

| 函数 | 签名 | 说明 |
|------|------|------|
| `std.at` | `at(array: array, index: number) → any` | 获取索引元素（支持负索引） |
| `std.first` | `first(array: array) → any` | 第一个元素 |
| `std.last` | `last(array: array) → any` | 最后一个元素 |
| `std.map` | `map(array: array, fn: function) → array` | 映射变换 |
| `std.filter` | `filter(array: array, fn: function) → array` | 过滤元素 |
| `std.reduce` | `reduce(array: array, init: any, fn: function) → any` | 归约累加 |
| `std.concat` | `concat(a1: array, a2: array) → array` | 合并两个数组 |

### 对象操作

| 函数 | 签名 | 说明 |
|------|------|------|
| `std.merge` | `merge(obj1: object, obj2: object) → object` | 浅合并 |
| `std.keys` | `keys(obj: object) → array` | 提取所有键 |
| `std.values` | `values(obj: object) → array` | 提取所有值 |

### 类型与长度

| 函数 | 签名 | 说明 |
|------|------|------|
| `std.to_string` | `to_string(value: any) → string` | 任意值转字符串 |
| `std.to_number` | `to_number(s: string) → number \| null` | 字符串转数字 |
| `std.type_of` | `type_of(value: any) → string` | 返回类型名 |
| `std.len` | `len(value: string \| array) → number` | 返回长度 |

## 完整示例

```bon
{
    // 字符串
    "upper": std.upper("hello"),
    "lower": std.lower("HELLO"),
    "trim": std.trim("  spaces  "),
    "split": std.split("a,b,c", ","),
    "replace": std.replace("foo bar", "bar", "baz"),

    // 数组
    "at": std.at([10, 20, 30], -1),
    "first": std.first([5, 6]),
    "last": std.last([5, 6]),
    "map": std.map([1, 2, 3], fn(x) { return x * 2 }),
    "filter": std.filter([1, 2, 3, 4], fn(x) { return x > 2 }),
    "reduce": std.reduce([1, 2, 3], 0, fn(a, b) { return a + b }),
    "concat": std.concat([1, 2], [3, 4]),

    // 对象
    "merge": std.merge({"a": 1}, {"b": 2}),
    "keys": std.keys({"a": 1, "b": 2}),
    "values": std.values({"a": 1, "b": 2}),

    // 类型
    "to_string": std.to_string(123),
    "to_number": std.to_number("42.5"),
    "type_of": std.type_of([1]),
    "len_str": std.len("hello"),
    "len_arr": std.len([1, 2, 3])
}
```

详细文档：每个函数都有独立页面，见左侧边栏「标准库」分组。
