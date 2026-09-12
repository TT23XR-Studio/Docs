# 继承

使用 `extends` 实现单继承：

```bon
class Animal {
    "type": "unknown",
    fn move() { return "moving" }
}

class Dog extends Animal {
    "type": "canine",
    "breed": "mixed",
    fn bark() { return "woof!" }
}

{
    "pet": Dog { "breed": "Golden Retriever" }
}
// 结果包含 type="canine", breed="Golden Retriever", move() 和 bark()
```

## 继承规则

- 子类继承父类所有属性和方法
- 子类可以覆盖父类属性
- BON 仅支持**单继承**（一个子类只能 extends 一个父类）
- 子类方法可以调用父类方法（通过 `super`，如果实现了的话）
- 循环继承会抛出 `CircularInheritanceError`

```bon
class Animal {
    "type": "unknown",
    fn move() { return "moving" }
}

class Cat extends Animal {
    "type": "feline"
    // 继承了 Animal 的 move() 方法
}

{
    "cat": Cat {}
}
// 输出: { "type": "feline", "move": "moving" }
```
