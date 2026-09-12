# 完整示例

这是一个结合模板、继承、导入和标准库的完整示例。

`base.bon`:
```bon
resources-{
    "cpu": "250m",
    "memory": "256Mi"
}

class BaseService {
    "name": "unnamed",
    "replicas": 1,
    "resources": {resources},
    "image_tag": "latest",

    fn full_name() {
        return self.name + ":" + self.image_tag
    }
}
```

`main.bon`:
```bon
import "base.bon" as Base

class WebService extends Base.BaseService {
    "port": 8080,
    "endpoints": ["/health", "/api"],

    fn get_urls(domain) {
        return std.map(self.endpoints, fn(ep) {
            return "https://" + domain + ":" + std.to_string(self.port) + ep
        })
    }
}

raw_ports = [3000, 3001, 3002]

{
    "services": std.map(raw_ports, fn(port, idx) {
        return WebService {
            "name": "web-svc-" + std.to_string(idx),
            "port": port
        }
    }),
    "admin": WebService {
        "name": "admin-svc",
        "port": 9000
    }.get_urls("myapp.com")
}
```

输出：

```json
{
    "services": [
        { "name": "web-svc-0", "replicas": 1, "resources": {"cpu":"250m","memory":"256Mi"}, "image_tag": "latest", "port": 3000, "endpoints": ["/health","/api"] },
        { "name": "web-svc-1", "replicas": 1, "resources": {"cpu":"250m","memory":"256Mi"}, "image_tag": "latest", "port": 3001, "endpoints": ["/health","/api"] },
        { "name": "web-svc-2", "replicas": 1, "resources": {"cpu":"250m","memory":"256Mi"}, "image_tag": "latest", "port": 3002, "endpoints": ["/health","/api"] }
    ],
    "admin": [
        "https://myapp.com:9000/health",
        "https://myapp.com:9000/api"
    ]
}
```
