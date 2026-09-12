# 结构体用法示例（Python）

本页展示如何使用 SenRi FFI Python 版定义和操作 C 结构体。

---

## 1. 基本结构体定义

```python
from senri_ffi import struct, types

Point = struct({
    "x": types.float64,
    "y": types.float64,
})

p = Point({"x": 10.5, "y": 20.3})
print(p.x, p.y)       # 10.5 20.3
print(Point._total_size)  # 16
```

---

## 2. 嵌套结构体

```python
from senri_ffi import struct, types

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
print(r.topLeft.y)  # 0
print(r.width)      # 100
print(r.height)     # 200
print(Rect._total_size)  # 32 (16 + 8 + 8)
```

---

## 3. 紧凑排列 (packed)

```python
from senri_ffi import struct, types

Normal = struct({
    "a": types.int8,
    "b": types.int32,
    "c": types.int8,
})
print(Normal._total_size)  # 12 (int8 + 3 pad + int32 + int8 + 3 pad)

Packed = struct({
    "a": types.int8,
    "b": types.int32,
    "c": types.int8,
}, {"packed": 1})
print(Packed._total_size)  # 6 (1 + 4 + 1，无填充)

p = Packed({"a": 1, "b": 2, "c": 3})
print(p.a, p.b, p.c)  # 1 2 3
```

---

## 4. 获取内存指针

```python
from senri_ffi import struct, types

Point = struct({"x": types.float64, "y": types.float64})

p = Point({"x": 1.5, "y": 2.5})

# 获取底层内存指针
ptr = p.ptr  # 或者 p.to_pointer()

# 直接通过指针读写内存
print(ptr.read_float64(0))  # 1.5 (x)
print(ptr.read_float64(8))  # 2.5 (y)

# 通过指针修改内存
ptr.write_float64(0, 100.0)
print(p.x)  # 100.0 (修改已反映到结构体)
```

---

## 5. 从内存反序列化 — `from_pointer`

```python
from senri_ffi import struct, types, alloc

Point = struct({"x": types.float64, "y": types.float64})

# 模拟从 C 函数获得的指针数据
mem = alloc(16)
mem.write_float64(0, 3.0)   # x
mem.write_float64(8, 4.0)   # y

# 从指针反序列化
p = Point.from_pointer(mem)
print(p.x, p.y)  # 3.0 4.0
```

---

## 6. 复杂结构体

```python
from senri_ffi import struct, types

Person = struct({
    "id": types.int32,
    "age": types.uint8,
    "salary": types.float64,
    "namePtr": types.pointer,
})

p = Person({
    "id": 1,
    "age": 30,
    "salary": 50000.0,
    "namePtr": 0,  # 指针稍后设置
})

print(Person._total_size)  # 24 (int32 + uint8 + 7 pad + float64 + pointer)
print(p.id)               # 1
print(p.age)              # 30
print(p.salary)           # 50000.0
```

---

## 7. 结构体作为函数参数

```python
from senri_ffi import Library, struct, types

Point = struct({"x": types.float64, "y": types.float64})

lib = Library.load("my_geometry.so")

# C 函数: double distance(Point a, Point b)
distance = lib.func(
    "distance",
    types.float64,
    [Point, Point]
)

p1 = Point({"x": 0, "y": 0})
p2 = Point({"x": 3, "y": 4})

# 结构体实例可以直接作为参数传递
result = distance(p1, p2)
print(result)  # 5.0

lib.close()
```

---

## 8. C 结构体布局验证

```python
from senri_ffi import struct, types

# 此结构体模拟典型的 C 结构体内存布局
Header = struct({
    "magic": types.uint32,    # offset 0
    "version": types.uint16,  # offset 4
    "flags": types.uint16,    # offset 6
    "size": types.uint64,     # offset 8
})

h = Header({"magic": 0xDEADBEEF, "version": 1, "flags": 0x0003, "size": 1024})

# 查看内存布局
ptr = h.ptr
print(hex(ptr.read_uint32(0)))  # deadbeef
print(ptr.read_uint16(4))       # 1
print(ptr.read_uint16(6))       # 3
print(ptr.read_uint64(8))       # 1024

print(Header._total_size)  # 16
```
