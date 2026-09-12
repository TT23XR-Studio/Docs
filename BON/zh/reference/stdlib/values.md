# std.values

提取对象的所有值。

## 签名

```
values(obj: object) → array
```

## 说明

返回 `obj` 所有值组成的数组，顺序与 `std.keys` 一致。

## 示例

```bon
std.values({"a": 1, "b": 2})  // [1, 2]
std.values({"name": "BON", "version": "1.0"})  // ["BON", "1.0"]
```

```json
[1, 2]
```
