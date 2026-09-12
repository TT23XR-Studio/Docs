# std.to_string

将任意值转为字符串。

## 签名

```
to_string(value: any) → string
```

## 说明

返回 `value` 的字符串表示形式。

## 示例

```bon
std.to_string(123)      // "123"
std.to_string(true)     // "true"
std.to_string(null)     // "null"
std.to_string([1, 2])   // "[1, 2]"
```

```json
"123"
```
