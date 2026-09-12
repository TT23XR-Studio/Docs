# std.keys

提取对象的所有键。

## 签名

```
keys(obj: object) → array
```

## 说明

返回 `obj` 所有键组成的数组。

## 示例

```bon
std.keys({"a": 1, "b": 2})  // ["a", "b"]
std.keys({"name": "BON", "version": "1.0"})  // ["name", "version"]
```

```json
["a", "b"]
```
