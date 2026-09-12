# 数组类型 (`_senri_ffi.array()`)

`_senri_ffi.array(innerType, count)` 创建一个**定长数组类型描述符**，用于描述 C 语言中的固定大小数组参数。

---

## 语法

```javascript
const ArrayType = _senri_ffi.array(innerType, count)
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `innerType` | `string\|Object` | 数组元素类型 |
| `count` | `number` | 元素数量 |

### 返回值

返回一个**类型描述对象**，包含：

| 属性 | 类型 | 说明 |
|------|------|------|
| `.sizeof` | `number` | 数组总大小 = `sizeof(innerType) * count` |
| `__ffi_type_handle__` | `Object` | 内部类型句柄 |

---

## 作为 FFI 参数

```javascript
const { int32, float64 } = ffi.types;

// C: void process(int32_t data[10])
const IntArr10 = ffi.array(int32, 10);
const process = lib.func('process', ffi.types.void, [IntArr10]);

// 传递数组
const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
process(data);
```

### 传递方式

JS 数组或类数组对象作为数组参数传递时：

1. 以整数索引（`0`, `1`, `2`, ...）读取每个元素
2. 逐元素按 `innerType` 转换
3. 填充到连续字节缓冲区
4. 将缓冲的指针传递给 C 函数

---

## 示例

### 一维数组

```javascript
const IntArr5 = ffi.array(ffi.types.int32, 5);
console.log(IntArr5.sizeof); // 20 (5 × 4)

const sum = lib.func('sum_int_arr', ffi.types.int32, [IntArr5]);
sum([10, 20, 30, 40, 50]); // C: sum_int_arr({10,20,30,40,50}) → 150
```

### 浮点数数组

```javascript
const FloatArr3 = ffi.array(ffi.types.float64, 3);
console.log(FloatArr3.sizeof); // 24 (3 × 8)

const dot_product = lib.func('dot_product', ffi.types.float64, [
  FloatArr3, FloatArr3
]);
dot_product([1, 2, 3], [4, 5, 6]); // C: (1×4 + 2×5 + 3×6) → 32.0
```

### 结构体数组

```javascript
const Vec3 = ffi.struct([
  { name: 'x', type: ffi.types.float32 },
  { name: 'y', type: ffi.types.float32 },
  { name: 'z', type: ffi.types.float32 },
]);

const Vec3Arr10 = ffi.array(Vec3, 10);
console.log(Vec3Arr10.sizeof); // 120 (10 × 12)

const transform_many = lib.func('transform_many', ffi.types.void, [
  Vec3Arr10, Vec3Arr10
]);

// 传递结构体数组
const positions = Array.from({ length: 10 }, (_, i) => ({
  x: i * 1.0, y: i * 2.0, z: 0.0
}));
const results = Array(10).fill({ x: 0, y: 0, z: 0 });
transform_many(positions, results);
```

---

## 与 Pointer 的区别

| 特性 | `array(type, count)` | `Pointer` |
|------|---------------------|-----------|
| 内存 | 调用时临时分配栈缓冲区 | 需要预先 `alloc()` |
| 大小 | 显式指定 `count` | 任意字节 |
| 索引 | JS 整数索引 `data[i]` | 手动计算偏移 |
| 用途 | C 值传递: `int arr[10]` | C 指针参数: `int *arr, size_t len` |

```javascript
// array 参数 — 按值传递
const fn_with_array = lib.func('fn', void, [ffi.array(int32, 10)]);
fn_with_array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
// C 接收：int arr[10]（栈上 40 字节的副本）

// pointer 参数 — 按引用传递
const fn_with_pointer = lib.func('fn', void, [ffi.types.pointer, ffi.types.uint64]);
const buf = ffi.alloc(40);
// ... 写入数据到 buf ...
fn_with_pointer(buf, 10); // C 接收：int *arr, size_t len
ffi.free(buf);
```

---

## 多维数组

多维 C 数组（如 `int[3][4]`）可以分解为 `array(array(innerType, innerCount), outerCount)`：

```javascript
// C: int matrix[3][4]
const Row = ffi.array(ffi.types.int32, 4);   // 内部: int[4]
const Matrix = ffi.array(Row, 3);             // 外部: int[3][4]

console.log(Matrix.sizeof); // 48 (3 × 4 × 4)

const process_matrix = lib.func('process_matrix', ffi.types.void, [Matrix]);

process_matrix([
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12]
]);
```

**注意**：多维数组的嵌套 `array()` 在 JS 侧不验证每个子数组的长度。确保传入的数据结构与 C 定义匹配。

---

## 完整示例

### 矩阵乘法 (C BLAS)

```javascript
const { float64, int32 } = ffi.types;

// C: void dgemm(int n, double A[n][n], double B[n][n], double C[n][n])
const N = 4;
const SquareMatrix = ffi.array(ffi.array(float64, N), N);

const lib = ffi.open('libblas.so');
const dgemm = lib.func('custom_dgemm', ffi.types.void, [
  int32, SquareMatrix, SquareMatrix, SquareMatrix
]);

const A = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16]
];

const B = [
  [16, 15, 14, 13],
  [12, 11, 10, 9],
  [8, 7, 6, 5],
  [4, 3, 2, 1]
];

const C = Array.from({ length: N }, () => Array(N).fill(0));

dgemm(N, A, B, C);
// C 矩阵包含 A × B 的结果

lib.close();
```

### 字符串数组

```javascript
// C: void process_names(char *names[10])
// (每个元素是 char*，即 cstring)
const CharPtrArr = ffi.array(ffi.types.cstring, 10);

const process_names = lib.func('process_names', ffi.types.void, [CharPtrArr]);

process_names([
  null, "Alice", null, "Bob", null,
  "Charlie", null, null, null, "Eve"
]);
// C 接收: char *names[10] = {NULL, "Alice", NULL, "Bob", NULL, ...}
```
