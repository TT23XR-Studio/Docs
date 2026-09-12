# std.to_number

将字符串转为数字。

## 签名

```
to_number(s: string) → number | null
```

## 说明

尝试将字符串 `s` 解析为数字。成功返回数字，失败返回 `null`。

## 示例

```bon
std.to_number("42.5")  // 42.5
std.to_number("100")   // 100
std.to_number("abc")   // null
```

```json
42.5
```

> [!WARNING]
> 无法转换的字符串会静默返回 `null`，不会抛出错误。
