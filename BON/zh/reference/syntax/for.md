# For 循环表达式

BON 支持编译期循环展开，通过遍历有限集合生成数组或对象。

## 语法

```bon
# 遍历数组 → 返回数组
for var in array_expr { body }

# 遍历对象键值 → 返回对象
for key_var, value_var in object_expr { body }

# 范围迭代（左闭右开）
for var in start..end { body }
```

## 遍历数组

遍历数组，返回新数组：

```bon
{"outputs": for x in [1, 2, 3] { x * 2 }}
# 输出: {"outputs": [2, 4, 6]}

{"outputs": for x in [] { x }}
# 输出: {"outputs": []}
```

## 遍历对象键值对

遍历对象的键值对，返回合并后的对象：

```bon
{"ages": for name, age in {"alice": 30, "bob": 25} {
    name + "_age": age
}}
# 输出: {"ages": {"alice_age": 30, "bob_age": 25}}
```

遍历对象键值对时，使用计算键名（如 `name + "_age"`）来生成动态键。

## 遍历对象值

使用单变量遍历对象时，返回值为数组：

```bon
{"values": for v in {"a": 1, "b": 2} { v }}
# 输出: {"values": [1, 2]}
```

## 范围迭代

`start..end` 表示左闭右开的整数范围：

```bon
{"subnets": for i in 0..3 {
    "10.0." + std.to_string(i) + ".0/24"
}}
# 输出: {"subnets": ["10.0.0.0/24", "10.0.1.0/24", "10.0.2.0/24"]}

{"ports": for i in 0..5 { 8080 + i }}
# 输出: {"ports": [8080, 8081, 8082, 8083, 8084]}
```

## 与 if 结合使用

```bon
# 数组条件过滤（有 else）
{"filtered": for x in [1, 2, 3, 4, 5] if (x > 3) { x } else { 10 - x }}
# 输出: {"filtered": [9, 8, 7, 4, 5]}

# 对象条件过滤
{"partial": for k, v in {"a": 1, "b": 2, "c": 3, "d": 4} {
    if (v % 2 == 0) { k: v }
}}
# 输出: {"partial": {"k": 4}}
```

## 嵌套循环

```bon
{"nested": for i in 0..3 { for j in 0..2 {
    std.to_string(i) + "-" + std.to_string(j)
}}}
# 输出: {"nested": [["0-0", "0-1"], ["1-0", "1-1"], ["2-0", "2-1"]]}
```

## 返回值类型

| 语法 | 返回类型 | 示例输出 |
| :--- | :--- | :--- |
| `for x in [...]` | 数组 | `[1, 2, 3]` |
| `for k, v in {...}` | 对象 | `{"a": 1, "b": 2}` |
| `for v in {...}` | 数组 | `[1, 2]` |
| `for i in 0..n` | 数组 | `[0, 1, 2]` |

## 对象键重复

循环体生成重复键名时，后者覆盖前者：

```bon
{"merged": for k, v in {"x": 1} { for k2, v2 in {"y": 2} { k2: v2 } }}
```

## 限制

- 迭代上限：10000 次（超出触发 `E010`）
- 不支持 `while` 或无限迭代
- 迭代变量仅在循环体内可见

## 应用场景

- 批量生成配置节点（端口、服务名）
- 将数组转换为对象结构
- 数据映射与过滤
- 环境列表展开
