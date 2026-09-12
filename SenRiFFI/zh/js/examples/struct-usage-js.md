# 结构体用法示例（JavaScript）

本页展示如何使用 SenRi FFI 定义和操作 C 结构体。

---

## 1. 基本结构体定义

```ts
import { struct, types } from '@tt23xrstudio/senri_ffi';

const Point = struct({
  x: types.float64,
  y: types.float64,
});

const p = new Point({ x: 10.5, y: 20.3 });
console.log(p.x, p.y);      // 10.5 20.3
console.log(Point.sizeof);  // 16
console.log(Point.align);   // 8
```

---

## 2. 嵌套结构体

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
console.log(r.topLeft.y); // 0
console.log(r.width);     // 100
console.log(r.height);    // 200
console.log(Rect.sizeof); // 32 (16 + 8 + 8)
```

---

## 3. 紧凑排列 (packed)

```ts
import { struct, types } from '@tt23xrstudio/senri_ffi';

const Normal = struct({
  a: types.int8,
  b: types.int32,
  c: types.int8,
});
console.log(Normal.sizeof); // 12 (int8 + 3 pad + int32 + int8 + 3 pad)

const Packed = struct({
  a: types.int8,
  b: types.int32,
  c: types.int8,
}, { packed: 1 });
console.log(Packed.sizeof); // 6 (1 + 4 + 1，无填充)

const p = new Packed({ a: 1, b: 2, c: 3 });
console.log(p.a, p.b, p.c); // 1 2 3
```

---

## 4. 获取内存指针

```ts
import { struct, types } from '@tt23xrstudio/senri_ffi';

const Point = struct({ x: types.float64, y: types.float64 });

const p = new Point({ x: 1.5, y: 2.5 });

// 获取底层内存指针
const ptr = p.ptr; // 或 p.toPointer()

// 直接通过指针读写内存
console.log(ptr.readFloat64(0)); // 1.5 (x)
console.log(ptr.readFloat64(8)); // 2.5 (y)

// 通过指针修改内存
ptr.writeFloat64(0, 100.0);
console.log(p.x); // 100.0 (修改已反映到结构体)
```

---

## 5. 从内存反序列化 — `fromPointer`

```ts
import { struct, types, alloc } from '@tt23xrstudio/senri_ffi';

const Point = struct({ x: types.float64, y: types.float64 });

// 模拟从 C 函数获得的指针数据
const mem = alloc(16);
mem.writeFloat64(0, 3.0);   // x
mem.writeFloat64(8, 4.0);   // y

// 从指针反序列化
const p = Point.fromPointer(mem);
console.log(p.x, p.y); // 3.0 4.0
```

---

## 6. 复杂结构体

```ts
import { struct, types } from '@tt23xrstudio/senri_ffi';

const Person = struct({
  id: types.int32,
  age: types.uint8,
  salary: types.float64,
  namePtr: types.pointer,
});

const p = new Person({
  id: 1,
  age: 30,
  salary: 50000.0,
  namePtr: 0, // 指针稍后设置
});

console.log(Person.sizeof); // 24 (int32 + uint8 + 7 pad + float64 + pointer)
console.log(p.id);          // 1
console.log(p.age);         // 30
console.log(p.salary);      // 50000
```

---

## 7. 结构体作为函数参数

```ts
import { Library, struct, types } from '@tt23xrstudio/senri_ffi';

const Point = struct({ x: types.float64, y: types.float64 });

const lib = Library.load('my_geometry.so');

// C 函数: double distance(Point a, Point b)
const distance = lib.func(
  'distance',
  types.float64,
  [Point, Point]
);

const p1 = new Point({ x: 0, y: 0 });
const p2 = new Point({ x: 3, y: 4 });

// 结构体实例可以直接作为参数传递
const result = distance(p1, p2);
console.log(result); // 5.0

lib.close();
```

---

## 8. C 结构体布局验证

```ts
import { struct, types } from '@tt23xrstudio/senri_ffi';

// 此结构体模拟典型的 C 结构体内存布局
const Header = struct({
  magic: types.uint32,   // offset 0
  version: types.uint16, // offset 4
  flags: types.uint16,   // offset 6
  size: types.uint64,    // offset 8
});

const h = new Header({ magic: 0xDEADBEEF, version: 1, flags: 0x0003, size: 1024n });

// 查看内存布局
const ptr = h.ptr;
console.log(ptr.readUint32(0).toString(16)); // deadbeef
console.log(ptr.readUint16(4));              // 1
console.log(ptr.readUint16(6));              // 3
console.log(ptr.readUint64(8));              // 1024n

console.log(Header.sizeof); // 16
```
