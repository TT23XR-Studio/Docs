# 类型系统 (`_senri_ffi.types`)

`_senri_ffi.types` 对象包含所有可用的 FFI 类型常量。这些常量用于描述 C 函数的参数和返回值类型。每个常量都是一个**不可变的字符串标识符**。

---

## 类型常量

```javascript
const {
  void,      // 空类型（0 字节）
  int8,      // 有符号 8 位整数  → C: int8_t / char
  uint8,     // 无符号 8 位整数  → C: uint8_t / unsigned char
  int16,     // 有符号 16 位整数 → C: int16_t / short
  uint16,    // 无符号 16 位整数 → C: uint16_t / unsigned short
  int32,     // 有符号 32 位整数 → C: int32_t / int
  uint32,    // 无符号 32 位整数 → C: uint32_t / unsigned int
  int64,     // 有符号 64 位整数 → C: int64_t / long long
  uint64,    // 无符号 64 位整数 → C: uint64_t / unsigned long long
  float32,   // 32 位浮点        → C: float
  float64,   // 64 位浮点        → C: double
  pointer,   // 指针/内存地址    → C: void* (64位系统 8 字节)
  cstring,   // C 字符串         → C: const char* (以 null 结尾)
  '...',     // 可变参数标记     → C: va_list (用于 printf 等)
} = _senri_ffi.types;
```

### 类型属性

| 类型 | 字节数 (sizeof) | 对齐 | JS 对应类型 | 备注 |
|------|----------------|------|------------|------|
| `void` | 0 | 1 | `undefined` | 仅作返回值，表示无返回值 |
| `int8` | 1 | 1 | `number` | 范围 -128 ~ 127 |
| `uint8` | 1 | 1 | `number` | 范围 0 ~ 255 |
| `int16` | 2 | 2 | `number` | 范围 -32768 ~ 32767 |
| `uint16` | 2 | 2 | `number` | 范围 0 ~ 65535 |
| `int32` | 4 | 4 | `number` | 范围 -2^31 ~ 2^31-1 |
| `uint32` | 4 | 4 | `number` | 范围 0 ~ 2^32-1 |
| `int64` | 8 | 8 | `number` | JS Number 只能精确表示 -2^53~2^53 |
| `uint64` | 8 | 8 | `number` | 大值可能丢失精度 |
| `float32` | 4 | 4 | `number` | IEEE 754 单精度 |
| `float64` | 8 | 8 | `number` | IEEE 754 双精度（JS 原生） |
| `pointer` | 4/8\* | 4/8\* | `number` / `Pointer` | 32位 4 字节，64位 8 字节 |
| `cstring` | 4/8\* | 4/8\* | `string` / `null` | 自动编码/解码 UTF-8 |
| `...` | 4/8\* | 4/8\* | 取决于上下文 | 仅用于标记可变参数 |

\* 取决于目标平台指针宽度（现代系统通常为 8 字节）

---

## 复合类型

除了基本类型常量，`_senri_ffi` 还提供**类型构造函数**来创建复合类型：

| 函数 | 说明 | 详情 |
|------|------|------|
| `_senri_ffi.pointer(innerType)` | 创建指针类型描述 | 指向 innerType 的指针 |
| `_senri_ffi.array(innerType, count)` | 创建定长数组类型 | 如 `array(int32, 10)` → `int32_t[10]` |
| `_senri_ffi.callback(retType, [argTypes])` | 创建回调类型描述 | 函数指针类型 |
| `_senri_ffi.struct(fields, [opts])` | 创建结构体构造函数 | 返回 JS 构造函数 |

### 复合类型的 `sizeof` 属性

```javascript
const Point = _senri_ffi.struct([
  { name: 'x', type: float64 },
  { name: 'y', type: float64 },
]);

console.log(Point.sizeof); // 16 (2 × 8 bytes)

const IntArr = _senri_ffi.array(int32, 5);
console.log(IntArr.sizeof); // 20 (5 × 4 bytes)
```

---

## 类型作为参数：两种表示法

`func()` 和 `funcAsync()` 接受两种形式的类型参数：

```javascript
// 方式 1：直接使用字符串常量
lib.func('sqrt', float64, [float64]);

// 方式 2：使用复合类型对象（由 pointer/array/struct 构造）
lib.func('memcpy', void, [pointer, pointer, uint64]);

// 方式 3：使用回调类型
const CompareFunc = _senri_ffi.callback(int32, [pointer, pointer]);
lib.func('qsort', void, [pointer, uint64, uint64, CompareFunc]);
```

---

## 类型转换规则

### JS → C（参数方向）

| C 类型 | 接收的 JS 值 | 转换逻辑 |
|--------|-------------|---------|
| `int8` ~ `uint64` | `number` | `Math.floor(num)` → 对应的 bit 宽有符号/无符号整数 → little-endian 字节 |
| `float32` | `number` | `Number(num)` → f32 → little-endian 字节 |
| `float64` | `number` | `Number(num)` → f64 → little-endian 字节 |
| `pointer` | `number` 或 `Pointer` | 提取地址值 → little-endian usize |
| `cstring` | `string` 或 `null`/`undefined` | 编码为 null-terminated UTF-8 C 字符串；`null` → 空指针 |
| `void` | 任意 | 忽略，不传递任何值 |
| 结构体 | 结构体实例对象 | 从 `_ffi_buffer` 拷贝结构体字节 |
| 数组 | 类数组对象 | 逐元素转换 |
| `...`（变参） | `number` 或 `Pointer` | 提取地址值 |

### C → JS（返回值方向）

| C 类型 | 返回的 JS 值 | 转换逻辑 |
|--------|-------------|---------|
| `int8` ~ `uint64` | `number` | 从 little-endian 字节解码为相应整数 → JS Number |
| `float32` / `float64` | `number` | 从 little-endian 字节解码为 JS Number |
| `pointer` | `number` | 地址值作为 JS Number |
| `cstring` | `string` / `null` | 从 C 字符串指针读取 → 解码 UTF-8；空指针 → `null` |
| `void` | `"null"` | 无返回值时返回字符串 `"null"` |
| 结构体/数组 | `"[binary data]"` | 字符串占位（需用 Pointer 操作读取） |

### 异步模式下返回值

异步 `funcAsync()` 的返回值全部通过 JSON 字符串传递：

| C 类型 | Promise 解析值 | 格式 |
|--------|---------------|------|
| 数值类型 | `number` | 整数或浮点数 |
| `pointer` | `number` | 地址值 |
| `cstring` | `string` | JSON 引用的 UTF-8 字符串 |
| `void` | `null` | — |
| 结构体/数组 | `"[binary data]"` | 字符串 |

---

## 使用示例

```javascript
const ffi = _senri_ffi;
const { int32, float64, pointer, cstring, void: VOID } = ffi.types;

const libc = ffi.open('libc.so.6');

// printf: int printf(const char *format, ...)
const printf = libc.func('printf', int32, [cstring, '...']);
printf('Hello %s, number: %d\n', 'world', 42);

// pow: double pow(double x, double y)
const pow = libc.func('pow', float64, [float64, float64]);
console.log(pow(2.0, 10.0)); // 1024.0

// memset: void *memset(void *s, int c, size_t n)
const memset = libc.func('memset', pointer, [pointer, int32, uint64]);
const buf = ffi.alloc(256);
memset(buf, 0, 256);
ffi.free(buf);
```
