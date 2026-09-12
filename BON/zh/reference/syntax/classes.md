# 类

类用于构建可复用的数据结构，支持计算属性和方法调用。

## 类定义

使用 `class` 关键字定义：

```bon
class Person {
    "name": "Anonymous",
    "age": 0,
    "birth_year": 2000,

    fn calculate_age(current_year) {
        return current_year - self.birth_year
    },

    fn description() {
        return self.name + " is " + std.to_string(self.age) + " years old."
    }
}
```

- **属性**：直接定义键值对作为默认值
- **方法**：使用 `fn` 关键字定义，方法体必须包含 `return` 语句

## 类实例化

语法：`ClassName { <属性覆盖> }`

```bon
{
    "admin": Person {
        "name": "Alice",
        "birth_year": 1990
    },
    "admin_age": Person { "birth_year": 1990 }.calculate_age(2026)
}
```

实例化时，传入的对象会**递归合并**到类的默认属性上。方法调用结果会立即折叠为常量。

**约束**：方法调用必须紧跟实例化，或赋值给属性。无法在运行时动态调用。

## 计算属性

属性值可以直接引用 `self` 进行派生计算：

```bon
class Rectangle {
    "width": 10,
    "height": 5,
    "area": self.width * self.height,
    "perimeter": (self.width + self.height) * 2
}

{
    "rect": Rectangle { "width": 7, "height": 7 }
}
// 输出: { "width": 7, "height": 7, "area": 49, "perimeter": 28 }
```

解析器会在实例化时按依赖顺序求值。
