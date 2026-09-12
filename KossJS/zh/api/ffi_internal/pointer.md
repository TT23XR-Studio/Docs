# 指针操作 (Pointer 对象)

`Pointer` 对象由 `_senri_ffi.alloc()` 或 `_senri_ffi.addressOf()` 返回，封装了原生内存地址和大小信息。提供类型化的读写操作，类似于在 JS 中对 C 指针进行解引用。

---

## Pointer 对象属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `.address` | `number` | 原生内存地址（`usize`） |
| `.size` | `number` | 指向的内存块大小（字节数） |

```javascript
const ptr = ffi.alloc(64);
console.log(ptr.address); // 例如: 140728960000000
console.log(ptr.size);    // 64
```

---

## 读取方法

所有读取方法接受一个**可选偏移量**（`offset`，默认为 0），返回从 `address + offset` 处读取的值。

### 整数读取

| 方法 | C 类型 | 字节数 | 返回值 |
|------|--------|--------|--------|
| `.readInt8([offset])` | `int8_t` | 1 | JS Number |
| `.readUint8([offset])` | `uint8_t` | 1 | JS Number |
| `.readInt16([offset])` | `int16_t` | 2 | JS Number |
| `.readUint16([offset])` | `uint16_t` | 2 | JS Number |
| `.readInt32([offset])` | `int32_t` | 4 | JS Number |
| `.readUint32([offset])` | `uint32_t` | 4 | JS Number |
| `.readInt64([offset])` | `int64_t` | 8 | JS Number |
| `.readUint64([offset])` | `uint64_t` | 8 | JS Number |

```javascript
const ptr = ffi.alloc(32);

ptr.writeInt32(0, 42);
ptr.writeInt16(4, 7);

console.log(ptr.readInt32(0));   // 42
console.log(ptr.readInt16(4));   // 7
console.log(ptr.readInt32(4));   // 未定义（混合了 int16 和其他字节）
```

### 浮点读取

| 方法 | C 类型 | 字节数 | 返回值 |
|------|--------|--------|--------|
| `.readFloat32([offset])` | `float` | 4 | JS Number |
| `.readFloat64([offset])` | `double` | 8 | JS Number |

```javascript
ptr.writeFloat64(0, 3.14159265358979);
console.log(ptr.readFloat64(0)); // 3.14159265358979
```

### 指针/字符串读取

| 方法 | C 类型 | 返回值 |
|------|--------|--------|
| `.readPointer([offset])` | `void*` | JS Number（地址值） |
| `.readCString([offset])` | `const char*` | JS String（读取到 null 终止符） |

```javascript
const buf = ffi.alloc(64);
buf.writeCString(0, 'Hello, World!');
console.log(buf.readCString(0)); // "Hello, World!"

// 存储另一个指针的地址
const otherPtr = ffi.alloc(32);
buf.writePointer(20, otherPtr);
console.log(buf.readPointer(20)); // otherPtr 的地址值
```

---

## 写入方法

所有写入方法接受**值**和**可选偏移量**（`offset`，默认为 0）。

### 整数写入

| 方法 | C 类型 | 参数 |
|------|--------|------|
| `.writeInt8([offset,] value)` | `int8_t` | JS Number → `i8` |
| `.writeUint8([offset,] value)` | `uint8_t` | JS Number → `u8` |
| `.writeInt16([offset,] value)` | `int16_t` | JS Number → `i16` |
| `.writeUint16([offset,] value)` | `uint16_t` | JS Number → `u16` |
| `.writeInt32([offset,] value)` | `int32_t` | JS Number → `i32` |
| `.writeUint32([offset,] value)` | `uint32_t` | JS Number → `u32` |
| `.writeInt64([offset,] value)` | `int64_t` | JS Number → `i64` |
| `.writeUint64([offset,] value)` | `uint64_t` | JS Number → `u64` |

如果提供了 `offset`，则偏移量由第一个参数指定：

```javascript
ptr.writeInt32(0, -1);
ptr.writeInt32(4, 256);

// 等价写法（offset 作为最后一个参数）：
// ptr.writeInt32(-1, 0);  ← 注意：无法区分 "value=-1, offset=0"
//                         和 "value=0, offset=-1"
// 推荐使用 offset 在前的形式
```

### 浮点写入

| 方法 | C 类型 | 参数 |
|------|--------|------|
| `.writeFloat32([offset,] value)` | `float` | JS Number → `f32` |
| `.writeFloat64([offset,] value)` | `double` | JS Number → `f64` |

### 指针/字符串写入

| 方法 | C 类型 | 参数 |
|------|--------|------|
| `.writePointer([offset,] value)` | `void*` | JS Number 或 Pointer → 地址值 |
| `.writeCString([offset,] value)` | `const char*` | JS String → null-terminated UTF-8 C 字符串 |

```javascript
const buf = ffi.alloc(128);

buf.writeCString(0, 'Hello');
buf.writeInt32(6, 42);           // 覆盖 null 终止符
// C 字符串期望 null 终止 → 手动写入
buf.writeUint8(11, 0);           // 显式再写的 null

// 写指针
buf.writePointer(16, buf);        // 自引用：buf[16] = &buf
console.log(buf.readPointer(16)); // buf 的地址
```

---

## 指针算术

### `.add(offset)` → `Pointer`

创建新 Pointer，地址偏移 `offset` 字节。

```javascript
const base = ffi.alloc(64);
const p = base.add(16); // 新 Pointer，地址比 base 高 16 字节
console.log(p.address === base.address + 16); // true
console.log(p.size);    // 0（不跟踪大小）

p.writeInt32(0, 123);
console.log(base.readInt32(16)); // 123（offset=16 处）
```

### `.toBigInt()` → `number`

返回指针的地址值（与 `.address` 相同，以 BigInt 语义返回）。

```javascript
console.log(ptr.address);    // 例如: 140728960000000
console.log(ptr.toBigInt()); // 同上
```

---

## 读取外部地址

当只有地址值（number）而没有 Pointer 对象时，可以先创建零大小的临时 Pointer：

```javascript
function readInt32At(addr) {
  const tmp = ffi.alloc(0);  // 0 字节 — 没有分配，只是一个指针包装器
  // 但是 alloc(0) 返回 address=0 的指针
  // 更好的方式：使用 .add 语法
  const ptr = ffi.alloc(4);   // 分配 4 字节
  const libc = ffi.open('libc.so.6');
  const memcpy = libc.func('memcpy', ffi.types.pointer,
    [ffi.types.pointer, ffi.types.pointer, ffi.types.uint64]
  );
  memcpy(ptr, addr, 4);      // 从外部地址拷贝到本地
  const val = ptr.readInt32(0);
  ffi.free(ptr);
  return val;
}
```

---

## 完整示例

```javascript
const ffi = _senri_ffi;

// 分配缓冲区
const buf = ffi.alloc(64);

// === 写入 ===
buf.writeInt32(0, 0x12345678);        // 偏移 0: int32
buf.writeFloat64(4, Math.PI);          // 偏移 4: float64
buf.writeInt16(12, -32768);            // 偏移 12: int16
buf.writeCString(16, 'C-Style');       // 偏移 16: C string
buf.writePointer(30, buf);             // 偏移 30: 自引用指针

// === 读取 ===
console.log('0x' + buf.readInt32(0).toString(16)); // 0x12345678
console.log(buf.readFloat64(4));                    // 3.14159265358979
console.log(buf.readInt16(12));                     // -32768
console.log(buf.readCString(16));                   // "C-Style"
console.log(buf.readPointer(30));                   // buf 的地址

// === 遍历数组 ===
const intArr = ffi.alloc(40); // 10 个 int32
for (let i = 0; i < 10; i++) {
  intArr.writeInt32(i * 4, i * i);
}

for (let i = 0; i < 10; i++) {
  console.log(`intArr[${i}] = ${intArr.readInt32(i * 4)}`);
}
// intArr[0] = 0, intArr[1] = 1, ..., intArr[9] = 81

ffi.free(buf);
ffi.free(intArr);
```
