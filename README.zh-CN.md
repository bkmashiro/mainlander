# mainlander

> 浏览器国家/地区指纹检测实验室。静态优先、隐私优先，用来观察浏览器暴露出的地区画像信号，以及这些信号之间是否互相矛盾。

[English README](./README.md) · 源码：<https://github.com/bkmashiro/mainlander>

## 项目定位

`mainlander` 不是“证明国籍/居住地”的工具，而是一个研究/演示用的 fingerprint lab：

- **本地检测**：在当前浏览器内运行，不需要后端。
- **默认不上传**：本地检测结果只渲染在页面里，本应用不会上传这些结果。
- **可选网络探测**：IP / GeoIP 只能通过第三方 endpoint 或后端看到；本项目把它放在单独区域，必须用户点击后才请求。
- **启发式判断**：所有信号都只能说明“这个浏览器环境看起来像哪里”，不能作为 nationality、residence、eligibility 的唯一证据。

## 在线 demo

Cloudflare Pages：<https://mainlander-dpf.pages.dev/>

> 注意：Cloudflare 可能会给 Pages 项目分配带后缀的默认域名；以仓库 README / 最新部署输出为准。

## npm 库用法

这个项目也可以作为浏览器端检测库使用：

```bash
npm install mainlander
```

```ts
import {
  countryLabel,
  runLocalDetector,
  runNetworkProbe,
  summarizeNetworkGeo,
} from "mainlander";

const report = await runLocalDetector();
console.log(report.primaryCountryGuess, report.countryScores);

// 只应在用户明确点击/授权后调用。
const network = await runNetworkProbe();
console.log(summarizeNetworkGeo(network));
console.log(countryLabel("GB")); // GB · United Kingdom
```

`runLocalDetector()` 只触碰当前页面内的浏览器指纹面；`runNetworkProbe()` 会请求第三方 IP/GeoIP 服务，应该始终放在显式点击/同意之后。

## Mainlander Shield 插件

仓库还包含一个实验性的防御型 MV3 扩展：[`extension/`](./extension/)。它是 Mainlander detector 的隐私/研究 companion：使用稳定 persona、审计高风险 API 调用，并可在本地阻断已知 IP/GeoIP probe endpoint。它不能改变 TLS 指纹，也不能改变真实出口 IP。

网页里已经有 **Shield 插件演示** 面板，会主动调用相关 API，方便对比“普通浏览器”和“加载插件后的浏览器”差异。

## 当前已经实现的检测模块

- Navigator language / platform / user-agent
- 国家/地区市场 app 和内置浏览器偏好信号：微信、QQ、支付宝、抖音/头条、Bilibili、LINE、KakaoTalk、Yandex 等
- Intl locale / timezone / number / date / collator
- Date timezone offset
- Screen / viewport / device characteristics
- Canvas text / canvas hash
- Emoji rendering probe
- Font availability probe
- WebGL vendor / renderer / limits
- AudioContext fingerprint
- Storage availability
- WebRTC candidate probe
- Optional IP API probe：Cloudflare trace、ipify、ipapi.co、freeipapi.com、BigDataCloud、ip-api.com free（HTTPS 页面会跳过 HTTP-only endpoint）
- Network GeoIP summary：把不同 provider 返回的 IP / country 字段做一个简要汇总投票

## 还没实现但有识别能力的技术面

下面是后续可以补进 lab 的方向。它们不一定直接判断国家，但能判断设备、浏览器、网络、权限历史、自动化/虚拟化环境，再和 locale / timezone / IP 等地区画像交叉验证。

### 1. HTTP 请求头 / Client Hints

潜在信号：

- `Accept-Language`
- `Sec-CH-UA-*`
- `Sec-CH-UA-Platform`
- `Sec-CH-UA-Platform-Version`
- `Sec-CH-UA-Arch`
- `Sec-CH-UA-Bitness`
- `Sec-CH-UA-Model`
- `Sec-CH-UA-Full-Version-List`
- `DNT` / `Sec-GPC`
- `Referer` / `Origin`
- `Accept-Encoding`
- HTTP/2 / HTTP/3 行为差异

识别价值：服务端可以把请求头和 JS 层 `navigator.language`、`Intl.timeZone`、IP 国家交叉验证。例如 JS 伪装成 `zh-CN + Asia/Shanghai`，但请求头是 `en-GB`，就会产生明显矛盾。

反制要点：浏览器扩展可用 `declarativeNetRequest` / `webRequest` 做部分请求头统一；油猴基本改不了真实 HTTP/TLS 层。最重要的是“统一画像”：语言、时区、IP、UA、UA-CH、字体、系统平台要一致。

### 2. TLS / JA3 / HTTP2 / QUIC 指纹

潜在信号：TLS ClientHello、cipher suites 顺序、extensions 顺序、ALPN、HTTP/2 SETTINGS、HTTP/2 priority、QUIC 参数、代理/VPN/Tor 特征。

识别价值：JS hook 只能骗页面脚本，骗不了服务端看到的 TLS / HTTP 栈。例如页面 JS 显示“移动端中国浏览器”，但 TLS 指纹像桌面 Chrome + 数据中心代理，这就是冲突。

反制要点：油猴无效，普通扩展也基本无效。需要真实浏览器栈、可信网络出口，或专门网络层代理。不要频繁切换代理/语言/时区；不稳定本身也是异常信号。

### 3. WebGPU

潜在信号：`navigator.gpu`、`requestAdapter()`、adapter features、limits、fallback adapter、shader 编译耗时、pipeline cache 行为、GPU 计算/渲染时序。

识别价值：WebGPU 比 WebGL 更接近底层 GPU 能力，可能暴露硬件、驱动、浏览器实现差异。

反制要点：禁用 WebGPU，或在扩展 main world 中隐藏 `navigator.gpu` / 拦截 `requestAdapter()`。但只隐藏 WebGPU、WebGL 仍暴露真实 GPU，也会形成矛盾。

### 4. 更深 WebGL / GPU 时序

当前项目只读基础 WebGL 参数，还没做 extensions、shader precision、float texture、anisotropy、draw/readPixels 结果、GPU timing、shader 编译时间等更深指纹。

反制要点：屏蔽 `WEBGL_debug_renderer_info`、标准化 WebGL parameters、对 canvas/readPixels 做 per-site seeded farbling、降低 GPU timing 精度。WebGL、Canvas、WebGPU 要一起处理。

### 5. WebAssembly / CPU / JIT 指纹

潜在信号：Wasm 编译/执行速度、SIMD、memory growth、JS 引擎优化路径、CPU cache / branch 行为、ARM/x86/Rosetta/VM 差异。

识别价值：更多是设备/虚拟化/浏览器引擎识别，再和地区画像交叉验证。

反制要点：降低 timer 精度、限制 `SharedArrayBuffer` / 高精度计时、限制 Wasm、对 benchmark 加噪声、按站点隔离 profile。代价是现代 Web app 兼容性可能下降。

### 6. MediaDevices

潜在信号：摄像头/麦克风/音频输出数量、device label、deviceId、groupId、蓝牙耳机、虚拟摄像头、权限授予历史。

识别价值：可区分真实用户、VM、远程桌面、自动化环境，也可能暴露地区常见硬件/软件组合。

反制要点：默认拒绝 camera/mic 权限；未授权状态返回空或通用设备列表。注意不要出现“WebRTC 可用，但 mediaDevices 永远空”的异常组合。

### 7. Permissions API

潜在信号：geolocation、notifications、camera、microphone、clipboard、midi、persistent-storage、idle-detection、local-fonts、payment-handler 的 granted / denied / prompt 状态。

识别价值：权限状态是用户历史行为和浏览器策略的画像。

反制要点：统一返回 `prompt` 或保守状态，并同步真实 API 行为。不能 `permissions.query()` 说 denied，但真实 API 又能成功。

### 8. Geolocation

潜在信号：GPS / Wi-Fi / 蜂窝定位、高精度坐标、IP 与 GPS 冲突、时区与经纬度冲突。

反制要点：默认拒绝定位，不在不可信站点授予；如要模拟，必须和 IP、timezone、locale 保持一致。

### 9. DeviceMotion / DeviceOrientation / Sensor API

潜在信号：加速度计偏差、陀螺仪噪声、采样率、传感器精度、手机型号、iOS/Android 差异。

识别价值：移动端强，可形成设备级指纹。

反制要点：禁用 sensor API、统一采样率、量化/加噪，或用 `Permissions-Policy` 禁用 accelerometer / gyroscope / magnetometer。

### 10. Keyboard layout / IME

潜在信号：`navigator.keyboard.getLayoutMap()`、QWERTY/AZERTY/JIS、composition events、拼音/假名/韩文输入行为、keydown/keyup timing、dead keys。

识别价值：对地区推断很有用，尤其是中文、日文、韩文和欧洲键盘布局。

反制要点：标准化 layout map、降低键盘事件时序精度、减少 IME composition 暴露。但强行改输入事件容易破坏体验。

### 11. CSS / media query / UI preference

潜在信号：`prefers-color-scheme`、`prefers-reduced-motion`、`prefers-contrast`、`forced-colors`、`color-gamut`、`dynamic-range`、`pointer`、`hover`、scrollbar 宽度、system font metrics、visualViewport、DPR。

反制要点：标准化 media query、固定 viewport bucket、letterboxing、标准化 scrollbar / DPR / color-gamut。不要每次刷新真随机；稳定常见画像更自然。

### 12. Local Font Access / 更完整字体指纹

当前只测一组 CJK 字体，还没覆盖 CSS Font Loading API、Local Font Access API、大字体字典、fallback 链、glyph metrics、emoji fallback、Office/设计/开发工具字体。

反制要点：限制本地字体枚举、只暴露标准字体集、标准化 `measureText`、用 webfont 隔离显示和真实本地字体。Canvas、font、emoji 必须一起处理。

### 13. Battery / Network Information

潜在信号：电量、充电状态、电池变化曲线、effectiveType、RTT、downlink、VPN/代理下异常网络质量、移动网络 vs 家宽。

反制要点：禁用或空返回 `navigator.getBattery`，标准化 `navigator.connection`，对 rtt/downlink 粗粒度化。网络层画像也要一致。

### 14. Gamepad / HID / USB / Bluetooth / Serial

潜在信号：gamepad id、手柄型号、蓝牙设备、USB vendor/product、HID、serial、NFC、硬件钱包相关设备。

识别价值：地区识别弱，但“真实用户 vs VM/自动化/远程环境”很强。

反制要点：默认禁用或需要用户手势；权限层拒绝；不暴露设备 id；返回空列表或通用设备。

### 15. 扩展 / 隐私工具检测

潜在信号：`chrome-extension://...` 资源探测、DOM 注入痕迹、API hook 痕迹、Canvas/WebGL/Audio 噪声模式、广告拦截 bait、uBlock / AdGuard / Tampermonkey 特征。

反制要点：尽量使用浏览器内建防护，减少扩展 web-accessible resources。API hook 要 native-like：`Function.prototype.toString`、property descriptor、异常行为都要一致。不同 API 不要出现不一致噪声。

### 16. 自动化 / Headless / VM 指纹

潜在信号：`navigator.webdriver`、CDP artifacts、permissions 行为、plugin/mimeTypes 异常、SwiftShader、missing fonts、固定屏幕尺寸、无 battery/media devices、人类输入历史缺失、timing 太稳定、iframe/worker 不一致。

反制要点：使用真实浏览器 profile，避免 headless，保持字体、GPU、media devices、permissions、screen、timezone 一致。不要只 patch `navigator.webdriver`。

### 17. 行为指纹

潜在信号：鼠标轨迹、scroll 曲线、touch events、pointer pressure、输入节奏、点击间隔、tab visibility、focus/blur、copy/paste、停留时间、首次交互延迟、IME composition。

反制要点：从隐私角度，更合理的是减少第三方脚本可见行为面，而不是伪造真人行为。可审计高频监听 `mousemove`、`pointermove`、`keydown`、`visibilitychange`。

### 18. 存储 / 缓存 / 历史状态

潜在信号：localStorage 容量、IndexedDB quota、Cache API、Service Worker、HSTS、ETag、HTTP cache timing、storage partition、cookie / CHIPS / third-party cookie、private browsing quota 差异。

反制要点：First-party isolation / container、定期清理、阻断 third-party storage、禁用第三方 cookie、统一 quota。storage 永远不可用也会显得异常；按站点隔离比全局清空更合理。

## 当前模块的直接反制矩阵

| 当前模块 | 可反制技术 | 关键点 |
| --- | --- | --- |
| Navigator language / UA / platform | JS hook + 请求头统一 + UA-CH 控制 | 不能只改 `navigator.userAgent` |
| Intl locale / timezone | patch `Intl.DateTimeFormat().resolvedOptions()` + Date 系列 | `Intl`、Date offset、IP 国家必须一致 |
| Date timezone offset | patch Date prototype / 浏览器时区设置 | 日期格式、DST、Intl 也要对齐 |
| Screen / viewport | letterboxing / 固定窗口分桶 / DPR 标准化 | 窗口尺寸是高熵信号 |
| Canvas hash | readback noise / block export / per-site farbling | 不要每次真随机；按站点稳定 |
| Emoji rendering | 标准化 emoji font / canvas 输出统一 | 台湾旗、CJK fallback、彩色 emoji 是强信号 |
| Font availability | 限制字体枚举 / 标准字体集 / patch measureText | 字体是地区和 OS 强信号 |
| WebGL | 禁用 / 屏蔽 debug renderer / 标准化 limits/extensions | WebGL、Canvas、WebGPU 要一起处理 |
| AudioContext | 禁用 OfflineAudioContext / 音频 farbling | 单独随机音频会暴露反制工具 |
| Storage quota | partition / quota 标准化 / 清理历史 | 隐私模式 quota 本身也是信号 |
| WebRTC candidates | 禁用 IP 泄露 / mDNS / block RTCPeerConnection | 防止本地 IP 泄露 |
| Optional IP API probe | VPN/Tor/代理 + 阻断 geo-IP endpoint | 扩展能拦截 endpoint，但不能改变真实出口 IP |

## 浏览器扩展 vs 油猴脚本边界

### 油猴适合

- patch `navigator.*`
- patch `Intl.*`
- patch `Date.*`
- patch Canvas / WebGL / Audio / WebRTC
- 记录页面调用了哪些高风险 API

限制：需要 `document-start`，很多脚本运行在 sandbox，需要注入 page context；worker、iframe、sandbox iframe、service worker 覆盖不完整；改不了 TLS、IP、HTTP/2、大多数真实请求头。

### 浏览器扩展适合

- 拦截/修改请求头的一部分
- 阻断第三方 fingerprinting 脚本
- 对 iframe / worker 做更系统注入
- DNR 阻断已知 IP/GeoIP endpoint
- API 调用审计面板
- 按站点使用不同 profile policy

限制：MV3 动态拦截能力有限；很多 JS API 仍需注入 main world；不能改变 TLS 指纹和真实出口 IP；不能完美伪造 OS/GPU/driver 层行为。

## 最重要的反制原则

### 不要乱随机，要统一画像

错误画像示例：

- UA 是 Windows
- timezone 是 Asia/Shanghai
- IP 是英国
- Accept-Language 是 en-US
- 字体像 macOS
- GPU 像 SwiftShader
- WebRTC 暴露内网
- Canvas 每次刷新都变

这比不反制还明显。

更合理的方式：

- 选择一个稳定 persona。
- IP、timezone、locale、language、UA、UA-CH、fonts、screen、GPU、WebRTC 全部对齐。
- 每个站点可以不同，但同一站点内要稳定。
- 随机化应是 per-site seeded，而不是每次调用真随机。

## 建议的“盾”系统架构

### Detector

审计页面是否调用高风险 API：Canvas、WebGL、WebGPU、AudioContext、Intl、Date timezone、Font probing、MediaDevices、Permissions、WebRTC、Battery、NetworkInformation、Sensors、Gamepad、Keyboard layout、Geolocation。

### Policy Engine

按站点选择策略：`allow`、`block`、`spoof`、`normalize`、`farble`、`prompt`、`log-only`。

### Persona Manager

维护一致画像：country、timezone、locale、languages、UA、UA-CH、platform、screen bucket、fonts、GPU class、audio/canvas seed、WebRTC policy、IP/proxy profile。

### API Shield

执行 JS 层 hook：navigator、Intl、Date、Canvas、WebGL、WebGPU、Audio、WebRTC、MediaDevices、Permissions、Sensors、Storage quota。

### Network Shield

执行网络层控制：header rewrite、block GeoIP endpoints、block known fingerprinting scripts、block third-party storage、block tracking pixels、proxy/VPN profile binding。

## 后续实现优先级

### 检测侧

1. UA Client Hints / HTTP headers
2. WebGPU
3. MediaDevices
4. Permissions API
5. WebAssembly + timing benchmark
6. 更深 WebGL shader/timing
7. CSS media features / viewport / letterboxing 检测
8. Keyboard layout / IME
9. Sensor APIs
10. 自动化/headless/VM 检测
11. 行为指纹
12. 存储/cache/history 状态
13. 扩展/反指纹工具检测
14. TLS/HTTP2/QUIC 服务端指纹

### 反制侧

1. 统一 persona，而不是局部 spoof
2. 请求头 + JS API 同步
3. timezone / locale / IP 三者一致
4. WebRTC leak 控制
5. Canvas/WebGL/Audio/WebGPU 同步 farbling
6. 字体标准化
7. screen letterboxing
8. 权限最小化
9. MediaDevices 空/通用化
10. timer precision 降低
11. per-site seed 随机化
12. worker/iframe 同步注入
13. 阻断第三方 fingerprinting 脚本
14. 日志审计：记录谁调用了高风险 API
15. profile/container 隔离

## 开发

```bash
pnpm install
pnpm dev
pnpm build
```

## 发布 / npm

仓库已经准备 GitHub Actions + npm Trusted Publishing。正常后续发版不需要在 GitHub Secrets 放 `NPM_TOKEN`。

但 npm Trusted Publishing 对全新包的首次发布有限制：如果 `mainlander` 还不存在，需要维护者先用临时 token 或 `npm login` 手动发布一次 `0.1.0`。首次发布后，在 npm package settings 添加 Trusted Publisher：

- Provider: GitHub Actions
- Repository: `bkmashiro/mainlander`
- Workflow file: `publish-npm.yml`
- Environment: 留空，除非 workflow 后续显式加 GitHub environment

之后可以通过 GitHub Actions 手动触发 **Publish npm**，或 push `v*.*.*` tag 自动发布。

## 参考

- MDN：NavigatorUAData / Client Hints
- MDN：WebGPU `requestAdapter()`
- MDN：WebAssembly
- MDN：MediaDevices / Permissions / Geolocation / DeviceMotion / Keyboard / Battery / Gamepad
- Tor Browser fingerprinting protections
- Brave fingerprint randomization
- DrawnApart GPU fingerprinting research
- WebGPU / WebAssembly fingerprinting research
