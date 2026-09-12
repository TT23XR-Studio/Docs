// ============================================================
// 示例 1: Hello World
// 文件位置: docs/09-examples/01-hello-world/index.js
//
// 最简单的 KifeJS 脚本，演示基础日志功能。
//
// 使用方法:
//   1. 将此文件放入 .minecraft/KifeJS/scripts/
//   2. 在游戏中执行 /kifejs reload
//   3. 查看 logs/latest.log
// ============================================================

KifeJS.log("你好，KifeJS！");
KifeJS.log("当前脚本: " + __kife_current_script);

var count = 1;
KifeJS.log("脚本执行计数: " + count);

KifeJS.log("Hello World 示例执行完成");
