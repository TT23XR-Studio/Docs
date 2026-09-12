# std.last

获取数组的最后一个元素。

## 签名

```
last(array: array) → any
```

## 说明

等价于 `std.at(array, -1)`。返回 `array` 的最后一个元素。

## 示例

```bon
std.last([5, 6, 7])  // 7
std.last(["a", "b"])  // "b"
```

```json
7
```
