# std.first

获取数组的第一个元素。

## 签名

```
first(array: array) → any
```

## 说明

等价于 `std.at(array, 0)`。返回 `array` 的第一个元素。

## 示例

```bon
std.first([5, 6, 7])  // 5
std.first(["a", "b"])  // "a"
```

```json
5
```
