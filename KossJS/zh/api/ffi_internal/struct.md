# 结构体 (`_senri_ffi.struct()`)

`_senri_ffi.struct(fields, [options])` 创建一个**结构体构造函数**，用于定义和操作 C 兼容的结构体类型。

---

## 语法

```javascript
const StructCtor = _senri_ffi.struct(fields)
const StructCtor = _senri_ffi.struct(fields, options)
```

### 参数

| 参数 | 类型 | 必须 | 说明 |
|------|------|------|------|
| `fields` | `Array` | 是 | 字段定义数组 `[{name, type}, ...]` |
| `options` | `Object` | 否 | 可选配置 |
| `options.packed` | `number` | 否 | 压缩对齐（字节数），默认按自然对齐 |

### 返回值

返回一个 JavaScript **构造函数** `StructCtor`。

### 字段定义格式

```javascript
ffi.struct([
  { name: 'fieldName', type: fieldType },  // name 可选，type 必填
  ffi.types.float64,                        // 简写：无名（使用索引访问）
  ffi.types.int32,
])
```

字段可通过两种方式定义：

| 格式 | 说明 |
|------|------|
| `{ name: 'x', type: float64 }` | 具名字段，可通过 `instance.x` 访问 |
| `ffi.types.int32` | 无名（简写），只能通过构造函数参数按索引赋值 |

---

## 结构体构造函数

返回的 `StructCtor` 是一个构造函数：

### `new StructCtor([initValues])` → `StructInstance`

| 属性/方法 | 类型 | 说明 |
|-----------|------|------|
| `.prototype` | `Object` | 原型对象，每个实例字段都有 getter/setter |
| `.sizeof` | `number` | 结构体总大小（字节数） |

### 构造选项

```javascript
const p1 = new Point();                              // 全零初始化
const p2 = new Point({ x: 1.0, y: 2.0 });           // 按字段名初始化
const p3 = new Point({ 0: 1.0, 1: 2.0 });           // 按索引初始化
```

---

## 结构体实例

结构体实例具有以下特性：

### 属性访问 (getter/setter)

每个具名字段自动生成 getter 和 setter，直接读写底层字节缓冲区：

```javascript
const Point = ffi.struct([
  { name: 'x', type: ffi.types.float64 },
  { name: 'y', type: ffi.types.float64 },
]);

const p = new Point({ x: 1.5, y: 3.0 });
console.log(p.x); // 1.5
console.log(p.y); // 3.0
p.x = 10.0;
console.log(p.x); // 10.0
```

### 内存布局

字段按 C 结构体规则布局（自然对齐），存储在内部 `Vec<u8>` 缓冲区中。实例有一个隐藏属性 `_ffi_buffer`（指向缓冲区的指针），在传递给 C 函数时自动使用。

### 嵌套结构体

```javascript
const vec2 = ffi.struct([
  { name: 'x', type: ffi.types.float64 },
  { name: 'y', type: ffi.types.float64 },
]);

const ColoredRect = ffi.struct([
  { name: 'pos',   type: vec2 },
  { name: 'size',  type: vec2 },
  { name: 'color', type: ffi.types.uint32 },
]);
```

但注意：嵌套结构体字段的 getter 返回的**不是**子结构体实例，而是从嵌套字段的偏移量直接读取的**数值**。对于结构体类型的字段，getter 读取该偏移处的一个地址值（作为指针），setter 写入地址。

> 此行为可能在将来的版本中改进为真正的嵌套结构体支持。

---

## 内存对齐

### 自然对齐（默认）

C 编译器的标准行为：每个字段对齐到其类型的自然对齐边界。

```javascript
const Mixed = ffi.struct([
  { name: 'a', type: ffi.types.int8 },    // 1 字节, offset 0
  { name: 'b', type: ffi.types.int32 },   // 4 字节, offset 4 (对齐填充 3 字节)
  { name: 'c', type: ffi.types.int8 },    // 1 字节, offset 8
  { name: 'd', type: ffi.types.float64 }, // 8 字节, offset 16 (对齐填充 7 字节)
]);

console.log(Mixed.sizeof); // 24
// 布局: a[0] ___[1..3] b[4..7] c[8] _______[9..15] d[16..23]
//                                                      = 24
```

### Packed（无对齐填充）

```javascript
const Packed = ffi.struct([
  { name: 'a', type: ffi.types.int8 },
  { name: 'b', type: ffi.types.int32 },
], { packed: 1 });

console.log(Packed.sizeof); // 5
// 布局: a[0] b[1..4] = 5（无填充）
```

### Packed with specific alignment

```javascript
const Aligned2 = ffi.struct([
  { name: 'a', type: ffi.types.int8 },
  { name: 'b', type: ffi.types.int32 },
], { packed: 2 });

console.log(Aligned2.sizeof); // 6
// 布局: a[0] _[1] b[2..5] = 6（对齐到 2 字节边界）
```

### 查看字段偏移

```javascript
// 通过检查 sizeof 和字段类型推断偏移
const S = ffi.struct([
  { name: 'a', type: ffi.types.int8 },
  { name: 'b', type: ffi.types.int32 },
]);

// a: offset 0, size 1
// b: offset 4 (aligned from 1 to 4), size 4
// total: 8
```

---

## 结构体作为 FFI 参数/返回值

结构体实例可以**按值**传递给期望结构体参数的 C 函数，也可以作为返回值接收。

### 作为参数（按值传递）

```javascript
const Rect = ffi.struct([
  { name: 'x', type: ffi.types.int32 },
  { name: 'y', type: ffi.types.int32 },
  { name: 'w', type: ffi.types.int32 },
  { name: 'h', type: ffi.types.int32 },
]);

const area = libc.func('rect_area', ffi.types.int32, [Rect]);
const r = new Rect({ x: 0, y: 0, w: 100, h: 50 });
console.log(area(r)); // 5000
```

### 作为返回值（按值返回）

```javascript
const createRect = libc.func('create_rect', Rect, [ffi.types.int32, ffi.types.int32]);
const r = createRect(100, 50);
// r 是 Rect 结构体实例
console.log(r.w, r.h); // 100 50
```

对于大结构体返回值（超过一个寄存器大小），C ABI 可能使用**隐藏指针**。如果返回值不正确，可能需要使用 `pointer` 作为返回值，手动读取：

```javascript
const createBigRect = libc.func('create_big_rect', ffi.types.pointer, [...]);
const resultPtr = createBigRect(100, 50);
// resultPtr 是指向 Rect 的指针，以 Number 形式返回
```

---

## 完整示例

### POSIX timespec 结构体

```c
// C 定义
struct timespec {
    time_t tv_sec;   // 秒 (int64 / long)
    long   tv_nsec;  // 纳秒 (int64 / long)
};

int clock_gettime(clockid_t clk_id, struct timespec *tp);
```

```javascript
const ffi = _senri_ffi;
const { int64, int32, pointer } = ffi.types;

const libc = ffi.open('libc.so.6');

const timespec = ffi.struct([
  { name: 'tv_sec',  type: int64 },
  { name: 'tv_nsec', type: int64 },
]);

const clock_gettime = libc.func('clock_gettime', int32, [int32, pointer]);
const CLOCK_REALTIME = 0;

// 分配 struct timespec
const tp = new timespec();
const result = clock_gettime(CLOCK_REALTIME, tp);
// tp 被 C 函数 filled
console.log(`Seconds: ${tp.tv_sec}, Nanos: ${tp.tv_nsec}`);

// 或使用 alloc + memcpy 方式
const tpBuf = ffi.alloc(timespec.sizeof);
clock_gettime(CLOCK_REALTIME, tpBuf);
// 手动从 tpBuf 构造结构体实例（或直接读取）
const tp2 = ffi.alloc(timespec.sizeof);
const memcpy = libc.func('memcpy', pointer, [pointer, pointer, ffi.types.uint64]);
memcpy(tp2, tpBuf, timespec.sizeof);
// 但此时 tp2 没有 getter/setter... 需要从 Pointer 读取原始字节

ffi.free(tpBuf);
ffi.free(tp2);
libc.close();
```

### 网络 socketaddr_in 结构体

```c
struct sockaddr_in {
    sa_family_t    sin_family; // uint16
    in_port_t      sin_port;   // uint16 (network byte order)
    struct in_addr sin_addr;   // uint32 (network byte order)
    char           sin_zero[8]; // padding
};
```

```javascript
const { uint16, uint32 } = ffi.types;

const sockaddr_in = ffi.struct([
  { name: 'sin_family', type: uint16 },
  { name: 'sin_port',   type: uint16 },
  { name: 'sin_addr',   type: uint32 },
  // sin_zero[8] 手动填充
]);

const addr = new sockaddr_in();
addr.sin_family = 2;  // AF_INET
addr.sin_port = 0x5000; // 端口 80，网络字节序 (用 htons 或手动)
addr.sin_addr = 0x0100007F; // 127.0.0.1 网络字节序

console.log(addr.sin_family, addr.sin_port, addr.sin_addr);
// 2, 0x5000, 0x0100007F
```

### 带 nested 引用的结构体

```javascript
const Vec3 = ffi.struct([
  { name: 'x', type: ffi.types.float32 },
  { name: 'y', type: ffi.types.float32 },
  { name: 'z', type: ffi.types.float32 },
]);

const Transform = ffi.struct([
  { name: 'position', type: Vec3 },
  { name: 'rotation', type: Vec3 },
  { name: 'scale',    type: Vec3 },
  { name: 'id',       type: ffi.types.uint32 },
]);

console.log(Transform.sizeof); // 40 = 3 × 12 + 4

// 构造
const t = new Transform({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale:    { x: 1, y: 1, z: 1 },
  id: 42,
});
```
