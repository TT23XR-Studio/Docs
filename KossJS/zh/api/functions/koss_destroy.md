# koss_destroy 函数

**功能描述**：销毁 JavaScript 实例并释放所有关联的内存。  
**返回值**：无

## 函数签名

```c
void koss_destroy(KossInstance* inst);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |

## 说明

销毁 JS 实例并释放所有关联的内存。调用后实例指针不再有效。

## 使用示例

```c
KossInstance* inst = koss_create();
// 使用实例...
koss_destroy(inst);
```
