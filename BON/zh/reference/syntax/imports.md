# 导入系统

支持多文件拆分，通过 `import` 语句实现。

## 语法

```bon
// 无别名导入
import "path/to/file.bon"

// 带别名导入
import "path/to/file.bon" as Alias
```

## 语义

- 导入语句必须放在文件**最顶层**（注释之后，任何定义之前）
- **无别名导入**：将目标文件中的所有顶层模板和类合并到当前全局命名空间（重名冲突报错）
- **带别名导入**：目标文件的所有导出内容挂载到命名空间对象（如 `Alias.ClassName`）
- **循环导入检测**：解析器维护导入栈，检测到循环立即抛出 `CircularImportError`

## 示例

`lib/shapes.bon`:
```bon
class Circle {
    "radius": 1
}
```

`main.bon`:
```bon
import "lib/shapes.bon" as Shapes

{
    "my_circle": Shapes.Circle { "radius": 10 }
}
```

输出：
```json
{
    "my_circle": { "radius": 10 }
}
```

## 路径规则

- 路径相对于当前文件所在目录解析
- 支持相对路径：`"./config.bon"`、`"../shared/base.bon"`
- 不可在 `import` 语句中使用变量或表达式
