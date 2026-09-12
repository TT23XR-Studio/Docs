# std.len

返回字符串长度或数组长度。

## 签名

```
len(value: string | array) → number
```

## 说明

如果 `value` 是字符串，返回字符数；如果是数组，返回元素个数。

## 示例

```bon
std.len("hello")        // 5
std.len([1, 2, 3])     // 3
std.len("")            // 0
```

```json
5
```

> [!NOTE]
> `len` 不支持对象类型，仅适用于字符串和数组。
