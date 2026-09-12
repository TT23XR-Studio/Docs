# koss_get_capabilities 函数

**功能描述**：查询当前实例的能力位掩码（只读）。  
**返回值**：`uint32_t` 能力位掩码。

## 函数签名

```c
uint32_t koss_get_capabilities(KossInstance* inst);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |

## 说明

返回创建实例时设定的能力位掩码。可用于在运行时检查当前实例拥有哪些权限。

## 使用示例

### C

```c
KossInstance* inst = koss_create_with_caps(KOSS_CAP_NET | KOSS_CAP_CRYPTO);
uint32_t caps = koss_get_capabilities(inst);

if (caps & KOSS_CAP_NET) {
    printf("网络能力已启用\n");
}
koss_destroy(inst);
```
