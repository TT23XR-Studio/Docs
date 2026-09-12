# 结构体用法示例

本页展示如何使用 SenRi FFI 定义和操作 C 结构体（JavaScript/TypeScript 和 Python 对照）。

---

## 1. 基本结构体定义

### JavaScript / TypeScript

```ts
import { struct, types } from '@tt23xrstudio/senri_ffi';

const Point = struct({
  x: types.float64,
  y: types.float64,
});

const p = new Point({ x: 10.5, y: 20.3 });
console.log(p.x, p.y);      // 10.5 20.3
console.log(Point.sizeof);  // 16
```

### Python

```python
from senri_ffi import struct, types

Point = struct({
    "x": types.float64,
    "y": types.float64,
})

p = Point({"x": 10.5, "y": 20.3})
print(p.x, p.y)           # 10.5 20.3
print(Point._total_size)  # 16
```

---

## 2. 嵌套结构体

### JavaScript / TypeScript

```ts
import { struct, types } from '@tt23xrstudio/senri_ffi';

const Point = struct({ x: types.float64, y: types.float64 });

const Rect = struct({
  topLeft: Point,
  width: types.float64,
  height: types.float64,
});

const r = new Rect({
  topLeft: new Point({ x: 0, y: 0 }),
  width: 100,
  height: 200,
});

console.log(r.topLeft.x); // 0
console.log(r.width);     // 100
console.log(Rect.sizeof); // 32
```

### Python

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

print(r.topLeft.x)       # 0
print(r.width)           # 100
print(Rect._total_size)  # 32
```

---

## 3. 紧凑排列 (packed)

### JavaScript / TypeScript

```ts
import { struct, types } from '@tt23xrstudio/senri_ffi';

const Normal = struct({
  a: types.int8,
  b: types.int32,
});
console.log(Normal.sizeof); // 8 (int8 + 3 填充 + int32)

const Packed = struct({
  a: types.int8,
  b: types.int32,
}, { packed: 1 });
console.log(Packed.sizeof); // 5 (无填充)
```

### Python

```python
from senri_ffi import struct, types

Normal = struct({
    "a": types.int8,
    "b": types.int32,
})
print(Normal._total_size)  # 8

Packed = struct({
    "a": types.int8,
    "b": types.int32,
}, {"packed": 1})
print(Packed._total_size)  # 5
```

---

## 4. 从内存反序列化

### JavaScript / TypeScript

```ts
import { struct, types, alloc } from '@tt23xrstudio/senri_ffi';

const Point = struct({ x: types.float64, y: types.float64 });

const mem = alloc(16);
mem.writeFloat64(0, 3.0);
mem.writeFloat64(8, 4.0);

const p = Point.fromPointer(mem);
console.log(p.x, p.y); // 3.0 4.0
```

### Python

```python
from senri_ffi import struct, types, alloc

Point = struct({"x": types.float64, "y": types.float64})

mem = alloc(16)
mem.write_float64(0, 3.0)
mem.write_float64(8, 4.0)

p = Point.from_pointer(mem)
print(p.x, p.y)  # 3.0 4.0
```
