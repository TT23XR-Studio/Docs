# `_senri_ffi` 完整示例

本文档提供覆盖 `_senri_ffi` 各核心功能的生产级示例。

---

## 示例 1：POSIX 文件 I/O（同步）

完整实现 C 标准库风格的文件读写操作。

```javascript
const ffi = globalThis._senri_ffi;
const { int32, int64, pointer, cstring, uint64 } = ffi.types;

// 加载 C 库
const libc = ffi.open(
  process.platform === 'win32' ? 'msvcrt.dll' : 'libc.so.6'
);

// === 绑定 POSIX 文件函数 ===
const posix_open = libc.func('open', int32, [cstring, int32]);
const posix_read = libc.func('read', int64, [int32, pointer, uint64]);
const posix_write = libc.func('write', int64, [int32, pointer, uint64]);
const posix_lseek = libc.func('lseek', int64, [int32, int64, int32]);
const posix_close = libc.func('close', int32, [int32]);

// === 常量 ===
const O_RDONLY = 0;
const O_WRONLY = 1;
const O_CREAT   = 0x40;
const O_TRUNC   = 0x200;
const SEEK_SET  = 0;

// === 写文件 ===
function writeFile(path, content) {
  const fd = posix_open(path, O_WRONLY | O_CREAT | O_TRUNC);
  if (fd < 0) throw new Error(`open failed: ${fd}`);

  const buf = ffi.alloc(content.length + 1);
  buf.writeCString(0, content);
  const written = posix_write(fd, buf, content.length);
  ffi.free(buf);

  posix_close(fd);
  return Number(written);
}

writeFile('test_posix.txt', 'Hello from KossJS FFI!\n');
console.log('File written.');

// === 读文件 ===
function readFile(path) {
  const fd = posix_open(path, O_RDONLY);
  if (fd < 0) throw new Error(`open failed: ${fd}`);

  const buf = ffi.alloc(4096);
  const bytesRead = posix_read(fd, buf, 4096);
  const content = buf.readCString(0);
  ffi.free(buf);
  posix_close(fd);

  return { bytesRead: Number(bytesRead), content };
}

const result = readFile('test_posix.txt');
console.log(`Read ${result.bytesRead} bytes:`);
console.log(result.content);

libc.close();
```

---

## 示例 2：异步 DNS 解析

使用 `funcAsync` 调用阻塞的 C DNS 函数，不阻塞 JS 主线程。

```javascript
const ffi = _senri_ffi;
const { int32, pointer, cstring, uint16, uint64 } = ffi.types;

const libc = ffi.open('libc.so.6');

// === 异步 gethostbyname ===
const gethostbyname = libc.funcAsync('gethostbyname', pointer, [cstring], {
  callbackTimeout: 10000,
});

// === addrinfo 结构体 ===
// (简化版，实际结构体更复杂)
const addrinfo = ffi.struct([
  { name: 'ai_flags',    type: int32 },
  { name: 'ai_family',   type: int32 },
  { name: 'ai_socktype',  type: int32 },
  { name: 'ai_protocol',  type: int32 },
  { name: 'ai_addrlen',   type: uint64 },
  { name: 'ai_addr',      type: pointer },
  { name: 'ai_canonname', type: pointer },
  { name: 'ai_next',      type: pointer },
]);

const getaddrinfo = libc.funcAsync('getaddrinfo', int32, [
  cstring, cstring, pointer, pointer
], { callbackTimeout: 10000 });

async function resolveDNS(hostname) {
  console.log(`Resolving ${hostname}...`);

  const hints = new addrinfo();
  hints.ai_family = 2; // AF_INET
  hints.ai_socktype = 1; // SOCK_STREAM

  const resultPtr = ffi.alloc(8); // sizeof(struct addrinfo *)
  const ret = await getaddrinfo(hostname, null, hints, resultPtr);

  if (ret !== 0) {
    ffi.free(resultPtr);
    throw new Error(`getaddrinfo failed: ${ret}`);
  }

  const addrList = resultPtr.readPointer(0);
  // 遍历链表（省略完整解析）
  console.log(`Resolved ${hostname} (addr list at 0x${addrList.toString(16)})`);

  ffi.free(resultPtr);
  // TODO: 调用 freeaddrinfo
}

async function main() {
  try {
    await resolveDNS('example.com');
  } catch (e) {
    console.error('DNS resolution failed:', e.message);
  }

  await libc.closeAsync();
}

main();
```

---

## 示例 3：回调排序（同步 + 异步对比）

```javascript
const ffi = _senri_ffi;
const { int32, pointer, uint64, void: VOID } = ffi.types;
const libc = ffi.open('libc.so.6');

// === 准备数据 ===
function createRandomInt32Array(n) {
  const buf = ffi.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    buf.writeInt32(i * 4, Math.floor(Math.random() * 1000));
  }
  return buf;
}

function readInt32Array(buf, n) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    arr.push(buf.readInt32(i * 4));
  }
  return arr;
}

// ================================================================
// === 同步排序 (createCallback) ===
// ================================================================
function qsortSync(arr, n) {
  const compare = ffi.createCallback(
    int32, [pointer, pointer],
    (aAddr, bAddr) => {
      // 用 memcpy 从地址读取 int32
      const tmpA = ffi.alloc(4);
      const tmpB = ffi.alloc(4);
      const memcpy = libc.func('memcpy', pointer, [
        pointer, pointer, uint64
      ]);
      memcpy(tmpA, aAddr, 4);
      memcpy(tmpB, bAddr, 4);
      const a = tmpA.readInt32(0);
      const b = tmpB.readInt32(0);
      ffi.free(tmpA);
      ffi.free(tmpB);
      return a - b;
    }
  );

  const qsort = libc.func('qsort', VOID, [
    pointer, uint64, uint64,
    ffi.callback(int32, [pointer, pointer])
  ]);

  qsort(arr, n, 4, compare);
}

// ================================================================
// === 异步排序 (funcAsync) ===
// ================================================================
async function qsortAsync(arr, n) {
  const qsort = libc.funcAsync('qsort', VOID, [
    pointer, uint64, uint64,
    ffi.callback(int32, [pointer, pointer])
  ], {
    callbackTimeout: 5000,
  });

  await qsort(arr, n, 4, (aAddr, bAddr) => {
    const tmpA = ffi.alloc(4);
    const tmpB = ffi.alloc(4);
    const memcpy = libc.func('memcpy', pointer, [
      pointer, pointer, uint64
    ]);
    memcpy(tmpA, aAddr, 4);
    memcpy(tmpB, bAddr, 4);
    const a = tmpA.readInt32(0);
    const b = tmpB.readInt32(0);
    ffi.free(tmpA);
    ffi.free(tmpB);
    return a - b;
  });
}

// === 测试 ===
async function main() {
  const N = 10;
  const bufSync = createRandomInt32Array(N);
  const bufAsync = createRandomInt32Array(N);

  console.log('Before sync sort:', readInt32Array(bufSync, N));
  qsortSync(bufSync, N);
  console.log('After sync sort:', readInt32Array(bufSync, N));

  console.log('Before async sort:', readInt32Array(bufAsync, N));
  await qsortAsync(bufAsync, N);
  console.log('After async sort:', readInt32Array(bufAsync, N));

  ffi.free(bufSync);
  ffi.free(bufAsync);
  await libc.closeAsync();
}

main();
```

---

## 示例 4：数学运算（带结构体）

```javascript
const ffi = _senri_ffi;
const { float64, int32 } = ffi.types;
const libm = ffi.open('libm.so.6');

// === 基本数学函数 ===
const sqrt = libm.func('sqrt', float64, [float64]);
const pow  = libm.func('pow',  float64, [float64, float64]);
const sin  = libm.func('sin',  float64, [float64]);
const cos  = libm.func('cos',  float64, [float64]);

console.log('sqrt(16) =', sqrt(16));     // 4
console.log('2^10 =', pow(2, 10));       // 1024
console.log('sin(0.5π) =', sin(Math.PI / 2));  // ≈ 1.0
console.log('cos(0) =', cos(0));         // 1

// === 结构体：2D 向量运算 ===
const Vec2 = ffi.struct([
  { name: 'x', type: float64 },
  { name: 'y', type: float64 },
]);

const vec2_length = libm.func('vec2_length', float64, [Vec2]);
const vec2_add = libm.func('vec2_add', Vec2, [Vec2, Vec2]);

const v1 = new Vec2({ x: 3, y: 4 });
const v2 = new Vec2({ x: 1, y: 2 });

console.log('|v1| =', vec2_length(v1)); // 假设 C 已定义 vec2_length

const v3 = vec2_add(v1, v2);
console.log('v1 + v2 =', v3.x, v3.y); // 4, 6

libm.close();
```

---

## 示例 5：内存操作 + Base64（综合）

```javascript
const ffi = _senri_ffi;
const { int32, pointer, uint64, cstring } = ffi.types;
const libc = ffi.open('libc.so.6');

// === 绑定 ===
const memcpy  = libc.func('memcpy', pointer, [pointer, pointer, uint64]);
const memcmp  = libc.func('memcmp', int32,   [pointer, pointer, uint64]);
const memset  = libc.func('memset', pointer, [pointer, int32, uint64]);
const strlen  = libc.func('strlen', uint64,  [cstring]);

// === 使用 C 函数进行零拷贝内存操作 ===
function copyAndCompare() {
  const src = ffi.alloc(64);
  const dst = ffi.alloc(64);

  src.writeCString(0, 'Hello, KossJS FFI!');
  
  // 零拷贝：将 ArrayBuffer 转为 Pointer，直接用 memcpy
  const jsBuf = new ArrayBuffer(32);
  const jsView = new Uint8Array(jsBuf);
  for (let i = 0; i < 32; i++) jsView[i] = i;
  
  const jsPtr = ffi.addressOf(jsBuf);   // 获取 ArrayBuffer 的原生地址
  memcpy(dst, jsPtr, 32);               // 从 JS 内存拷贝到堆
  console.log('dst[0]:', dst.readUint8(0));   // 0
  console.log('dst[31]:', dst.readUint8(31)); // 31
  
  // 对比
  const cmp = memcmp(dst, jsPtr, 32);
  console.log('memcmp result:', cmp);   // 0（相等）

  ffi.free(src);
  ffi.free(dst);
}

copyAndCompare();

// === 字符串长度统计 ===
function strInfo(s) {
  const cLen = strlen(s);          // C strlen (不含 null)
  const jsLen = Buffer.from(s).length; // JS buffer 长度 (UTF-8 字节)
  return { cLen: Number(cLen), jsLen, chars: s.length };
}

console.log(strInfo('Hello'));     // { cLen: 5, jsLen: 5, chars: 5 }
console.log(strInfo('你好世界'));  // { cLen: 12, jsLen: 12, chars: 4 }

libc.close();
```

---

## 示例 6：多线程异步任务 + AbortController

```javascript
const ffi = _senri_ffi;
const libc = ffi.open('libc.so.6');
const { uint32, void: VOID } = ffi.types;

// === 异步 sleep（模拟长时间操作） ===
const sleep = libc.funcAsync('sleep', uint32, [uint32], {
  callbackTimeout: 5000,
  allowForceKill: false, // 不需要强制杀
});

// === 并发执行多个异步任务 ===
async function concurrencyDemo() {
  const tasks = [1, 2, 3, 4, 5].map(async (n) => {
    console.log(`Task ${n} started`);
    await sleep(n);
    console.log(`Task ${n} done`);
    return n;
  });

  const results = await Promise.all(tasks);
  console.log('All tasks completed:', results);
  // 输出: Task 1 started, Task 2 started, ...
  // (5 个任务并发，最长的一个等 5 秒，总耗时 ≈ 5 秒)
}

// === 带超时的任务取消 ===
async function cancelDemo() {
  const slowFunc = libc.funcAsync('sleep', uint32, [uint32]);

  const ctrl = new AbortController();
  const promise = slowFunc(60, { signal: ctrl.signal }); // sleep 60 秒

  // 3 秒后取消
  setTimeout(() => {
    console.log('Cancelling task...');
    ctrl.abort();
  }, 3000);

  try {
    await promise;
    console.log('Task completed (unexpected)');
  } catch (e) {
    console.log('Task aborted:', e.name); // "AbortError"
    // C 函数 sleep(60) 仍在后台运行，但 Promise 已 reject
  }
}

async function main() {
  console.log('=== Concurrency demo ===');
  await concurrencyDemo();

  console.log('\n=== Cancel demo ===');
  await cancelDemo();

  // closeAsync 不等待已 abort 的任务
  await libc.closeAsync();
}

main();
```

---

## 示例 7：完整应用 — 原生子进程启动

使用 `fork` / `execvp` 在 Linux 上创建子进程。

```javascript
const ffi = _senri_ffi;
const { int32, int64, pointer, cstring, void: VOID } = ffi.types;

if (process.platform !== 'linux') {
  console.log('This example requires Linux');
  return;
}

const libc = ffi.open('libc.so.6');

// === POSIX 进程 API ===
const fork = libc.func('fork', int32, []);
const execvp = libc.func('execvp', int32, [cstring, pointer]);
const waitpid = libc.func('waitpid', int32, [int32, pointer, int32]);
const exit = libc.func('exit', VOID, [int32]);

// === 创建子进程 ===
function createChildProcess() {
  const pid = fork();
  
  if (pid === 0) {
    // 子进程
    console.log('[CHILD] Forked! PID:', pid);
    
    // 分配环境变量数组 (char *argv[])
    // argv = ["ls", "-la", NULL]
    const argv = ffi.alloc(3 * 8); // 3 个指针 (×8 在 64 位)
    
    // arg[0] = "ls"
    const arg0 = ffi.alloc(3);
    arg0.writeCString(0, 'ls');
    
    // arg[1] = "-la"
    const arg1 = ffi.alloc(4);
    arg1.writeCString(0, '-la');
    
    // 组装 argv 数组
    argv.writePointer(0, arg0);       // argv[0] = "ls"
    argv.writePointer(8, arg1);       // argv[1] = "-la"
    argv.writePointer(16, 0);         // argv[2] = NULL
    
    // execvp("ls", argv)
    const ret = execvp('ls', argv);
    
    // 如果 execvp 返回了，表示出错
    console.log('[CHILD] execvp failed:', ret);
    exit(1);
  } else if (pid > 0) {
    // 父进程
    console.log('[PARENT] Child PID:', pid);
    
    const statusPtr = ffi.alloc(4);
    const ret = waitpid(pid, statusPtr, 0);
    
    // WIFEXITED(status): 检查子进程是否正常退出
    // if (ret === pid) { ... }
    
    console.log('[PARENT] Child exited');
    ffi.free(statusPtr);
  } else {
    console.log('[PARENT] Fork failed!');
  }
}

// createChildProcess(); // (在 Linux 上运行)
libc.close();
```

---

## 示例 8：命令行参数解析 + getopt

```c
// C 端
// int getopt(int argc, char *const argv[], const char *optstring);
// extern int optind;
// extern char *optarg;
```

```javascript
const { int32, pointer, cstring } = ffi.types;
const libc = ffi.open('libc.so.6');

const getopt = libc.func('getopt', int32, [int32, pointer, cstring]);

// 模拟 argv
const procArgs = ['program', '-f', 'config.json', '-v', '--help'];
const argc = procArgs.length;

// 分配 argv: array of char*
const argv = ffi.alloc(argc * 8);
for (let i = 0; i < argc; i++) {
  const arg = ffi.alloc(procArgs[i].length + 1);
  arg.writeCString(0, procArgs[i]);
  argv.writePointer(i * 8, arg);
}

let opt;
while ((opt = getopt(argc, argv, 'f:v')) !== -1) {
  switch (opt) {
    case 'f'.charCodeAt(0):
      console.log(`Option -f with value: ...`);
      break;
    case 'v'.charCodeAt(0):
      console.log('Verbose mode');
      break;
    default:
      console.log('Unknown option');
  }
}

// 释放
for (let i = 0; i < argc; i++) {
  ffi.free(argv.readPointer(i * 8));
}
ffi.free(argv);
libc.close();
```

---

## 最佳实践总结

1. **始终 `free` 你分配的内存** — 每次 `alloc()` 必须有对应的 `free()`
2. **异步调用时确保指针数据有效** — 不要在 Promise resolve 前释放
3. **使用 `closeAsync()` 而非 `close()`** — 当库有异步调用时
4. **回调超时设合理值** — 避免死锁时永久阻塞线程
5. **`allowForceKill` 慎用** — 只有确认线程可能永不返回时启用
6. **C 函数必须线程安全** — 异步 FFI 不提供同步锁
7. **测试平台字节序** — 所有整数按 little-endian 读写
8. **大结构体避免按值返回** — 使用 `pointer` 参数接收
