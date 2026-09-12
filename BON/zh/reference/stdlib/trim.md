# std.trim

去除字符串首尾的空白字符。

## 签名

```
trim(s: string) → string
```

## 说明

移除 `s` 开头和结尾的所有空白字符（空格、制表符、换行符等）。

## 示例

```bon
std.trim("  hello  ")  // "hello"
std.trim("\n\t BON \t\n")  // "BON"
```

```json
"hello"
```
