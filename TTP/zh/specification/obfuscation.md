# S-Box 置换混淆

压缩后的数据经过 S-Box 字节置换，使其统计特征不可直接辨识。这不是加密（密钥固定），仅用于避免 plain 压缩流被直接识别。

## 种子

```
0x5A7B3C9D
```

## 生成算法

```
arr = [0, 1, 2, ..., 255]
state = seed
for i = 255 down to 1:
    state = (state * 1103515245 + 12345) & 0x7FFFFFFF
    j = (state >> 16) % (i + 1)
    swap(arr[i], arr[j])

forward = arr
backward[ forward[i] ] = i  for i in 0..255
```

使用的伪随机生成器是线性同余（LCG），取高 15 位作为随机值。

## 正向映射（打包）

```
obfuscated[i] = forward[ compressed[i] ]
```

## 逆向映射（解包）

```
compressed[i] = backward[ obfuscated[i] ]
```
