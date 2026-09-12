# std.type_of

返回值的类型名称。

## 签名

```
type_of(value: any) → string
```

## 说明

返回 `value` 的类型名字符串。

## 返回值

`type_of` 返回值：`"string"`, `"number"`, `"boolean"`, `"null"`, `"array"`, `"object"`

## 示例

```bon
std.type_of("hello")    // "string"
std.type_of(42)         // "number"
std.type_of(true)       // "boolean"
std.type_of(null)       // "null"
std.type_of([1, 2])     // "array"
std.type_of({"a": 1})   // "object"
```

```json
"array"
```
