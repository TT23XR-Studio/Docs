# 标识符

类名、模板名、属性键（非引号模式）使用字母、数字、下划线，不能以数字开头：

```
name ✅
_name ✅
name1 ✅
1name ✗
```

## 规则

- 由字母、数字、下划线组成
- 不能以数字开头
- 区分大小写

## 在代码中的使用

```bon
class UserService {
    "service_name": "api",
    "max_connections": 100
}

template_name-{"value": "test"}
```

> [!NOTE]
> JSON 对象键若包含特殊字符，仍需使用双引号包裹。
