# std.split

按分隔符拆分字符串为数组。

## 签名

```
split(s: string, sep: string) → array
```

## 说明

将字符串 `s` 按分隔符 `sep` 拆分为字符串数组。

## 示例

```bon
std.split("a,b,c", ",")  // ["a", "b", "c"]
std.split("hello world", " ")  // ["hello", "world"]
```

```json
["a", "b", "c"]
```
