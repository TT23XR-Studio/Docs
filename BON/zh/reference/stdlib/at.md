# std.at

获取数组指定索引的元素，支持负索引。

## 签名

```
at(array: array, index: number) → any
```

## 说明

返回 `array` 中 `index` 位置的元素。支持负索引：`-1` 表示最后一项，`-2` 表示倒数第二项，以此类推。

## 示例

```bon
std.at([10, 20, 30], 0)   // 10
std.at([10, 20, 30], -1)  // 30
std.at([10, 20, 30], 2)   // 30
```

```json
30
```

## 边界

- 索引越界会抛出 `IndexOutOfBoundsError`（错误码 `E006`）
