# std.replace

替换字符串中的子串。

## 签名

```
replace(s: string, old: string, new: string) → string
```

## 说明

返回一个新字符串，其中 `s` 里所有的 `old` 都被替换为 `new`。

## 示例

```bon
std.replace("foo bar", "bar", "baz")  // "foo baz"
std.replace("hello hello", "hello", "hi")  // "hi hi"
```

```json
"foo baz"
```
