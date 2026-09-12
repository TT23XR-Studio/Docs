# koss_fetch 函数

**功能描述**：执行 HTTP 请求。  
**返回值**：***KossResult*** 结构体，包含 JSON 格式的响应。

## 函数签名

```c
KossResult koss_fetch(KossInstance* inst, const char* url_json);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |
| ***url_json*** | ***const char**** | JSON 格式的请求参数 |

## 请求参数格式

```json
{
  "url": "https://example.com/api",
  "method": "GET",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": ""
}
```

## 响应格式

```json
{
  "ok": true,
  "status": 200,
  "statusText": "OK",
  "body": "response body",
  "headers": {}
}
```

## 使用示例

```c
KossInstance* inst = koss_create();

const char* request_json = "{\"url\": \"https://api.github.com/users/github\", \"method\": \"GET\"}";
KossResult result = koss_fetch(inst, request_json);

if (result.code == 0) {
    printf("Response: %s\n", result.value);
    // Response: {"ok":true,"status":200,"statusText":"OK","body":"...","headers":{}}
    koss_free_result(result);
}

koss_destroy(inst);
```
