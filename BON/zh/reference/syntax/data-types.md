# 数据类型

BON 完全支持 JSON 数据类型：

| 类型 | 示例 | 说明 |
|------|------|------|
| `null` | `null` | 空值 |
| `boolean` | `true`, `false` | 布尔值 |
| `number` | `42`, `3.14`, `-7` | 整数或浮点数 |
| `string` | `"hello"` | 双引号字符串，支持 JSON 转义 |
| `array` | `[1, 2, 3]` | 有序列表 |
| `object` | `{"key": "val"}` | 键值对集合 |

## 字符串

字符串必须使用双引号 `"`，支持转义序列：`\n`, `\t`, `\\`, `\"`, `\uXXXX` 等。

```bon
{
    "name": "BON",
    "path": "C:\\Users\\admin",
    "emoji": "\\u2764"
}
```

## 数字

支持整数和浮点数，支持科学记数法：

```bon
{
    "integer": 42,
    "negative": -7,
    "float": 3.14,
    "scientific": 1.5e3
}
```

## 布尔值与 null

```bon
{
    "enabled": true,
    "disabled": false,
    "empty": null
}
```
