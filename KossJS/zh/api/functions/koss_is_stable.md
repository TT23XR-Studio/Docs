# koss_is_stable 函数

**功能描述**：查询实例是否处于稳定模式。  
**返回值**：`bool` — `true` 表示稳定模式，`false` 表示开发模式。

## 函数签名

```c
bool koss_is_stable(KossInstance* inst);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |

## 说明

返回创建实例时设定的 `stable` 参数值。稳定模式下，FFI 功能被禁用。

详见 [安全与沙箱指南 - 稳定模式](/zh/security-sandbox/security-sandbox#二稳定模式stable)。

## 使用示例

### C

```c
// 默认创建（stable=true）
KossInstance* inst = koss_create();
bool stable = koss_is_stable(inst);  // true
printf("Stable: %s\n", stable ? "true" : "false");
koss_destroy(inst);

// 开发模式（stable=false）
KossInstance* inst2 = koss_create_with_caps(KOSS_CAP_ALL, false);
bool stable2 = koss_is_stable(inst2);  // false
koss_destroy(inst2);
```

### Python

```python
from kossjs_interface import KossJS

# 默认创建（stable=True）
koss = KossJS()
print(koss.is_stable)  # True
koss.destroy()

# 开发模式（stable=False）
koss2 = KossJS(stable=False)
print(koss2.is_stable)  # False
koss2.destroy()
```

### TypeScript

```typescript
import { KossJS } from './kossjs_interface';

const koss = new KossJS();
console.log(koss.isStable());  // true
koss.destroy();
```

## 相关 API

- [koss_create_with_caps](/zh/api/functions/koss_create_with_caps)
- [koss_create_with_modules_and_caps](/zh/api/functions/koss_create_with_modules_and_caps)
- [koss_get_capabilities](/zh/api/functions/koss_get_capabilities)
