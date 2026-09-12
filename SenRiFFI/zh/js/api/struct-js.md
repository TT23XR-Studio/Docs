# struct（JavaScript）

`struct()` 函数用于定义 C 结构体类型，自动处理字段布局、对齐和紧凑排列。

## 导入

```ts
import { struct, types } from '@tt23xrstudio/senri_ffi';
```

## 基本用法

### 定义结构体

```ts
const Point = struct({
  x: types.float64,
  y: types.float64,
});
```

返回的是一个 JavaScript 类，既是类型描述符，也是构造函数。

### 创建实例

```ts
const p = new Point({ x: 10.5, y: 20.3 });
console.log(p.x, p.y); // 10.5 20.3
```

### 获取大小和对齐

```ts
console.log(Point.sizeof); // 16 (两个 float64)
console.log(Point.align);  // 8
```

---

## 嵌套结构体

结构体字段可以引用其他结构体。

```ts
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
console.log(Rect.sizeof); // 32 (Point 16 + width 8 + height 8)
```

**注意**: 嵌套结构体字段在内存中内联存储（不存储指针），`get`/`set` 直接读写内存中的对应区域。

---

## 紧凑排列 (packed)

默认情况下，结构体会按字段的自然对齐边界对齐（可能产生填充字节）。使用 `packed` 选项可以取消对齐。

```ts
const Normal = struct({
  a: types.int8,
  b: types.int32,
});
console.log(Normal.sizeof); // 8 (int8 + 3 填充 + int32)

const Packed = struct({
  a: types.int8,
  b: types.int32,
}, { packed: 1 });
console.log(Packed.sizeof); // 5 (int8 + int32，无填充)
```

**参数**:
- `options.packed` — 最大对齐值，通常设为 `1` 表示按字节对齐（无填充）

---

## 指针操作

### `ptr` / `toPointer()`

获取结构体实例的底层内存指针：

```ts
const p = new Point({ x: 1.0, y: 2.0 });
const ptr = p.ptr;  // 或者 p.toPointer()
console.log(ptr.readFloat64(0)); // 1.0 (x)
console.log(ptr.readFloat64(8)); // 2.0 (y)
```

返回的 `Pointer` 可以直接传给 C 函数。

### `fromPointer(ptr)` — 从内存反序列化

```ts
// 假设 C 函数返回了一个 Point 的指针
const pointPtr = someCFunction(); // 返回 Pointer

const p = Point.fromPointer(pointPtr);
console.log(p.x, p.y); // 读取内存中的值
```

`fromPointer` 将指针指向的内存数据复制到一个新的 `ArrayBuffer` 中，然后返回结构体实例。

---

## 结构体作为函数参数/返回值

```ts
const Point = struct({ x: types.float64, y: types.float64 });

const lib = Library.load('my_lib.so');

// 结构体作为参数类型
const distance = lib.func('distance', types.float64, [Point, Point]);

const p1 = new Point({ x: 0, y: 0 });
const p2 = new Point({ x: 3, y: 4 });
console.log(distance(p1, p2)); // 5.0
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

## 内部实现

结构体实例内部结构：

```ts
class StructInstance {
  _buffer: ArrayBuffer;   // 存储所有字段的原始内存
  _view: DataView;        // DataView 视图用于读写
  _fields: FieldInfo[];   // 字段布局信息
}
```

每个字段通过 `Object.defineProperty` 定义 getter/setter，直接读写 `_view` 中的对应偏移。

## 限制

| 限制 | 说明 |
|------|------|
| 不支持位域 (bit fields) | 仅支持完整字节对齐的类型 |
| 不支持联合体 (union) | 布局计算假定字段顺序排列 |
| Bun 运行时不支持结构体 | Bun 适配器的 `createStructType` 返回 `null`，结构体操作完全由 JS 端模拟 |

在 Bun 上使用结构体时，内存读写完全通过 JS 的 `DataView` 完成，不受 Bun FFI 结构体支持限制的影响。
