# koss_version 函数

**功能描述**：获取 KossJS 版本字符串。  
**返回值**：版本字符串指针（静态内存，无需释放）。

## 函数签名

```c
const char* koss_version(void);
```

## 参数

无

## 说明

返回 KossJS 版本字符串，如 "0.1.0-dev.10"。

## 使用示例

```c
printf("KossJS version: %s\n", koss_version());
```

```python
from kossjs_interface import KossJS

koss = KossJS()
print(koss.version())  # 输出: 0.1.0-dev.10
```
