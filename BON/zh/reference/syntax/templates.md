# 模板系统

模板是纯数据的宏，用于消除重复配置。模板内部**不允许使用 `self`**。

## 定义模板

语法：`<template_name>-{ <json_value> }`

```bon
resource_spec-{
    "cpu": "500m",
    "memory": "512Mi"
}

env_dev-{
    "NODE_ENV": "development",
    "LOG_LEVEL": "debug"
}
```

- `template_name` 必须为标识符
- 值必须是一个合法的 BON 表达式

## 引用模板

在值的位置使用 `{template_name}` 进行**深拷贝展开**：

```bon
{
    "main": {resource_spec},
    "sidecar": {resource_spec}  // 独立的深拷贝副本
}
```

多次引用同一模板会产生独立的深拷贝副本，互不干扰。

## 裸引用

若对象的值直接引用模板，可以省略大括号：

```bon
a-{"x": 1}

{
    "prop1": {a},   // 标准写法
    "prop2": a      // 裸引用，结果一致
}
```

## 注意事项

- 模板展开为深拷贝，修改副本不会影响原模板
- 模板内部不能包含 `self` 引用（那属于类的概念）
- 模板可以引用其他模板（递归展开，最大深度 100）
