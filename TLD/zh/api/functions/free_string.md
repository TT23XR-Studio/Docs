# free_string 函数

**功能描述**：释放 ***get_performance_stats*** 返回的字符串内存。
**返回值**：无

| 参数 | 类型 | 说明 |
|------|------|------|
| ***s*** | ***char**** | 需要释放的字符串指针 |

## 重要性

***get_performance_stats*** 返回的字符串是由 Rust 分配的错误信息字符串，必须调用此函数释放内存，否则会导致内存泄漏。

## 示例

```c
const char* stats_json = get_performance_stats(downloader_id);
if (stats_json != NULL) {
    // 处理性能统计数据...
    // 重要：释放内存
    free_string((char*)stats_json);
}
```
