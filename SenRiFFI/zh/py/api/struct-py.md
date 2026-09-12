# struct（Python）

`struct()` 函数用于定义 C 结构体类型，自动处理字段布局、对齐和紧凑排列。

## 导入

```python
from senri_ffi import struct, types
```

## 基本用法

### 定义结构体

```python
Point = struct({
    "x": types.float64,
    "y": types.float64,
})
```

返回的是一个 Python 类，既是类型描述符，也是构造函数。

### 创建实例

```python
p = Point({"x": 10.5, "y": 20.3})
print(p.x, p.y)  # 10.5 20.3
```

### 获取大小和对齐

```python
print(Point._total_size)  # 16 (两个 float64)
```

---

## 嵌套结构体

结构体字段可以引用其他结构体。

```python
Point = struct({"x": types.float64, "y": types.float64})

Rect = struct({
    "topLeft": Point,
    "width": types.float64,
    "height": types.float64,
})

r = Rect({
    "topLeft": Point({"x": 0, "y": 0}),
    "width": 100,
    "height": 200,
})

print(r.topLeft.x)  # 0
print(r.width)      # 100
print(Rect._total_size)  # 32 (Point 16 + width 8 + height 8)
```

**注意**: 嵌套结构体字段在内存中内联存储（不存储指针），getter/setter 直接读写内存中的对应区域。

---

## 紧凑排列 (packed)

默认情况下，结构体会按字段的自然对齐边界对齐（可能产生填充字节）。使用 `packed` 选项可以取消对齐。

```python
Normal = struct({
    "a": types.int8,
    "b": types.int32,
})
print(Normal._total_size)  # 8 (int8 + 3 填充 + int32)

Packed = struct({
    "a": types.int8,
    "b": types.int32,
}, {"packed": 1})
print(Packed._total_size)  # 5 (int8 + int32，无填充)
```

**参数**:
- `options["packed"]` — 最大对齐值，通常设为 `1` 表示按字节对齐（无填充）

---

## 指针操作

### `ptr` / `to_pointer()` — 获取底层内存指针

```python
p = Point({"x": 1.0, "y": 2.0})
ptr = p.ptr  # 或者 p.to_pointer()
print(ptr.read_float64(0))  # 1.0 (x)
print(ptr.read_float64(8))  # 2.0 (y)
```

返回的 `Pointer` 可以直接传给 C 函数。

### `from_pointer(ptr)` — 从内存反序列化

```python
# 假设 C 函数返回了一个 Point 的指针
point_ptr = some_c_function()  # 返回 Pointer

p = Point.from_pointer(point_ptr)
print(p.x, p.y)  # 读取内存中的值
```

`from_pointer` 将指针指向的内存数据复制到一个新的 `bytearray` 中，然后返回结构体实例。

---

## 结构体作为函数参数/返回值

```python
from senri_ffi import Library, struct, types

Point = struct({"x": types.float64, "y": types.float64})

lib = Library.load("my_lib.so")

# 结构体作为参数类型
distance = lib.func("distance", types.float64, [Point, Point])

p1 = Point({"x": 0, "y": 0})
p2 = Point({"x": 3, "y": 4})
print(distance(p1, p2))  # 5.0
```

## 布局计算规则

结构体布局计算遵循标准 C 规则：

1. 每个字段的偏移必须是其对齐值的整数倍（除非 `packed`）
2. 结构体总大小必须是最大对齐值的整数倍（除非 `packed`）

```
示例: struct { int8 a; int32 b; }

非 packed:
  offset 0: a (int8, size=1)
  offset 1-3: padding
  offset 4: b (int32, size=4)
  total: 8 (ceil(5/4)*4)

packed: 1:
  offset 0: a (int8, size=1)
  offset 1: b (int32, size=4)
  total: 5
```

## 与 JavaScript 版的对照

| 特性 | JavaScript 版 | Python 版 |
|------|--------------|-----------|
| 定义 | `struct({ x: types.float64 })` | `struct({"x": types.float64})` |
| 创建 | `new Point({ x: 1.0 })` | `Point({"x": 1.0})` |
| 大小 | `Point.sizeof` | `Point._total_size` |
| 指针 | `p.ptr` / `p.toPointer()` | `p.ptr` / `p.to_pointer()` |
| 反序列化 | `Point.fromPointer(ptr)` | `Point.from_pointer(ptr)` |
| packed | `{ packed: 1 }` | `{"packed": 1}` |

## 限制

| 限制 | 说明 |
|------|------|
| 不支持位域 (bit fields) | 仅支持完整字节对齐的类型 |
| 不支持联合体 (union) | 布局计算假定字段顺序排列 |
