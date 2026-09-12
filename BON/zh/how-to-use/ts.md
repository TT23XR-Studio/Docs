# bon-ts 库使用指南

## 安装

```bash
cd packages/bon-ts
npm install
npm run build
```

## 快速开始

```typescript
import { evaluate, load } from "bon-ts";

// 解析 BON 字符串
const result = evaluate('{ "name": "Alice", "age": 30 }');
console.log(result); // { name: "Alice", age: 30 }

// 从文件加载
const config = load("config.bon");
```

## API 参考

### `evaluate(source: string, baseDir?: string, params?: Record<string, unknown>): unknown`

解析并执行 BON 源码字符串，返回 JSON 兼容的 JavaScript 对象。

```typescript
import { evaluate } from "bon-ts";

// 基础 JSON
const r1 = evaluate('{"a": 1, "b": [1, 2, 3]}');

// 使用模板
const r2 = evaluate(`
server-{"host": "localhost", "port": 8080}
{"server": {server}}
`);

// 使用编译时参数
const r3 = evaluate('{"env": $env}', undefined, { env: "production" });

// 使用类
const r4 = evaluate(`
class User {
    "name": "Anonymous",
    fn greet() { return "Hi, " + self.name }
}
User { "name": "Bob" }.greet()
`);
```

### `load(filepath: string, params?: Record<string, unknown>): unknown`

从文件加载并执行 BON 代码。`baseDir` 自动设为文件所在目录。

```typescript
import { load } from "bon-ts";

const config = load("config.bon");

// 带参数加载
const config = load("config.bon", { env: "production", debug: true });
```

### `loads(source: string, baseDir?: string): unknown`

`evaluate` 的别名。

```typescript
import { loads } from "bon-ts";

const data = loads('{"key": "value"}');
```

### `parse(source: string, filename?: string): Program`

将 BON 源码解析为 AST，不做求值。

```typescript
import { parse } from "bon-ts";

const program = parse('{"x": 1}');
// program 是 Program AST 节点
```

### `Evaluator` 类

底层求值器：

```typescript
import { Evaluator, parse } from "bon-ts";

const evaluator = new Evaluator("/path/to/project");

const program1 = parse(source1);
const result1 = evaluator.evaluate(program1);

const program2 = parse(source2);
const result2 = evaluator.evaluate(program2);
```

### `EvalError`

求值错误，包含错误码和位置：

```typescript
import { evaluate, EvalError } from "bon-ts";

try {
  const result = evaluate("undefined_var");
} catch (e) {
  if (e instanceof EvalError) {
    console.log(`错误码: ${e.code}`);  // E001
    console.log(`错误信息: ${e.message}`);
    if (e.pos) {
      console.log(`位置: 第 ${e.pos.line} 行, 第 ${e.pos.column} 列`);
    }
  }
}
```

### 其他导出

```typescript
import { Lexer, ast, stdlib } from "bon-ts";

// Lexer - 词法分析器
const lexer = new Lexer('{"x": 1}');
const tokens = lexer.tokens();

// ast - AST 节点类型
// ast.Literal, ast.BinaryOp, ast.ClassDef 等

// stdlib - 标准库函数
// stdlib.STD_LIB 包含所有内置函数
```

## 使用场景

### 配置文件处理

```typescript
import { load } from "bon-ts";

const config = load("config.bon");

const host = config.database.host;
```

### 模板系统

```typescript
import { evaluate } from "bon-ts";

const source = `
cpu_small-{"cpu": "100m", "memory": "128Mi"}
cpu_large-{"cpu": "1000m", "memory": "1Gi"}

{
    "dev": {cpu_small},
    "prod": {cpu_large}
}
`;

const result = evaluate(source);
// result.dev === { cpu: "100m", memory: "128Mi" }
// result.prod === { cpu: "1000m", memory: "1Gi" }
```

### 数据转换管道

```typescript
import { evaluate } from "bon-ts";

const source = `
{
    "data": [1, 2, 3, 4, 5],
    "doubled": std.map([1, 2, 3, 4, 5], fn(x) { return x * 2 }),
    "filtered": std.filter([1, 2, 3, 4, 5], fn(x) { return x > 3 }),
    "sum": std.reduce([1, 2, 3, 4, 5], 0, fn(a, b) { return a + b })
}
`;

const result = evaluate(source);
// result.doubled === [2, 4, 6, 8, 10]
// result.filtered === [4, 5]
// result.sum === 15
```

### 与 JSON 互操作

```typescript
import { evaluate } from "bon-ts";

// BON 是 JSON 的超集
const data = evaluate('{"name": "test", "items": [1, 2, 3]}');

// 转回 JSON
console.log(JSON.stringify(data, null, 2));
```

### 在 Node.js 项目中使用

```typescript
import { load } from "bon-ts";

// 加载项目配置
const config = load("project.bon");

// 用配置初始化服务
const server = {
  host: config.server.host,
  port: config.server.port,
};

console.log(`Starting on ${server.host}:${server.port}`);
```

### TypeScript 类型安全

```typescript
import { evaluate } from "bon-ts";

interface AppConfig {
  name: string;
  version: string;
  database: {
    host: string;
    port: number;
  };
}

const config = evaluate(`
{
    "name": "my-app",
    "version": "1.0.0",
    "database": {
        "host": "localhost",
        "port": 5432
    }
}
`) as AppConfig;

// 现在有完整的类型提示
console.log(config.database.host);
```
