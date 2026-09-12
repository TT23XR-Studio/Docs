# std.map

对数组的每个元素执行映射变换。

## 签名

```
map(array: array, fn: function) → array
```

## 说明

遍历 `array` 的每个元素，调用 `fn` 进行变换，返回新数组。

回调函数接收 `(item, index)` 两个参数。

## 示例

```bon
std.map([1, 2, 3], fn(x) { return x * 2 })  // [2, 4, 6]
std.map([10, 20, 30], fn(item, index) { return item + index })  // [10, 22, 32]
```

```json
[2, 4, 6]
```

> [!TIP]
> `map` 的回调必须使用 `fn` 语法定义。
