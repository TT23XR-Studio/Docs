---
layout: home

hero:
  name: 'BON'
  text: 'JSON 的超集，配置界的 SASS'
  tagline: '编译期执行的声明式数据转换语言'
  image:
    src: https://images-sxxyrry.pages.dev/BON_Bigger.png
    alt: BON
  actions:
    - theme: brand
      text: '快速开始'
      link: "/zh/guide/getting-started"
    - theme: alt
      text: '语言规范'
      link: "/zh/reference/syntax-overview"
    - theme: alt
      text: '标准库'
      link: "/zh/reference/stdlib-overview"

features:
  - title: '完全兼容 JSON'
    details: '所有合法 JSON 都是合法 BON。BON 不引入新格式，只在 JSON 之上增加语法糖。'
  - title: '编译期求值，零运行时'
    details: '所有逻辑在解析时完成，输出纯 JSON，宿主程序零改动。'
  - title: '确定性'
    details: '图灵不完备，无循环、无随机数、无系统时间，相同源码输出一致。'
  - title: '模板系统'
    details: '消除重复配置，模板展开为独立的深拷贝副本，互不干扰。'
  - title: '类与继承'
    details: '可复用的数据结构，支持单继承、计算属性和方法调用。'
  - title: '标准库'
    details: '字符串、数组、对象操作，std.map、std.filter、std.reduce 等纯函数。'
---
