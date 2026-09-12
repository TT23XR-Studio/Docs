# std.reduce

归约累加数组元素。

## 签名

```
reduce(array: array, init: any, fn: function) → any
```

## 说明

使用 `fn` 将数组归约为单个值。`init` 为初始累加值。

回调函数接收 `(accumulator, item)` 两个参数。

## 示例

```bon
std.reduce([1, 2, 3], 0, fn(a, b) { return a + b })  // 6
std.reduce([1, 2, 3], 1, fn(a, b) { return a * b })  // 6 (1*1*2*3)
```

```json
6
```

> [!TIP]
> `reduce` 的回调必须使用 `fn` 语法定义。
