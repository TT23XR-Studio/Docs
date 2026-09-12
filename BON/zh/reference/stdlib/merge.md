# std.merge

浅合并两个对象。

## 签名

```
merge(obj1: object, obj2: object) → object
```

## 说明

将 `obj2` 的键值对合并到 `obj1`，后者覆盖前者的同名键。返回新对象，不修改原对象。

## 示例

```bon
std.merge({"a": 1}, {"b": 2})        // {"a": 1, "b": 2}
std.merge({"a": 1, "b": 2}, {"b": 3})  // {"a": 1, "b": 3}
```

```json
{"a": 1, "b": 2}
```

> [!NOTE]
> `merge` 是**浅合并**，不会深度递归嵌套对象。
