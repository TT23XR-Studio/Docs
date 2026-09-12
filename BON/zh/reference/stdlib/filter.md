# std.filter

过滤数组元素。

## 签名

```
filter(array: array, fn: function) → array
```

## 说明

遍历 `array`，仅保留 `fn` 返回 `true` 的元素，返回新数组。

回调函数接收 `(item)` 一个参数。

## 示例

```bon
std.filter([1, 2, 3, 4], fn(x) { return x > 2 })  // [3, 4]
std.filter([10, 20, 30], fn(x) { return x >= 20 })  // [20, 30]
```

```json
[3, 4]
```

> [!TIP]
> `filter` 的回调必须使用 `fn` 语法定义。
