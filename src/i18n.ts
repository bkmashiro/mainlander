export type Locale = "en" | "zh";

type Dict = Record<string, string>;

const dictionaries: Record<Locale, Dict> = {
  en: {
    title: "Mainlander Lab",
    eyebrow: "MAINLANDER LAB",
    heroTitle: "Browser country fingerprint detector",
    lede: "A static-first lab for the sharpest spear: locale, timezone, rendering, device, privacy, and optional network signals.",
    rerun: "Run local detector",
    running: "Running detector…",
    network: "Optional IP probe",
    probing: "Probing…",
    fineprint: "Local detector runs fully in this browser. IP/country from network cannot be checked by static frontend unless you call a third-party endpoint.",
    controlTitle: "Local detector and optional network probe",
    controlNote: "Local detection runs in your browser. The IP/GeoIP probe is hidden by default and only runs after you click the button to authorize third-party requests.",
    shieldDemoTitle: "Shield demo",
    shieldDemoNote: "Install/load the Mainlander Shield extension, then click this to trigger the APIs it normalizes or blocks: persona, canvas, WebGPU, WebRTC, permissions, and media devices.",
    shieldRun: "Run shield demo",
    shieldRunning: "Testing shield…",
    shieldResults: "Shield-observable surfaces",
    shieldPersonaHint: "With Shield enabled, these values should match the selected stable persona.",
    shieldCanvasHint: "Two same-content canvas samples should stay deterministic per site; compare against a no-extension run.",
    shieldWebGpuHint: "Shield can hide WebGPU; if present, WebGPU is still exposed.",
    shieldWebRtcOpen: "RTCPeerConnection can be created, so WebRTC is not blocked.",
    shieldWebRtcBlocked: "RTCPeerConnection was blocked or failed, which is expected with Shield WebRTC blocking.",
    shieldPermissionHint: "Shield returns conservative prompt-like states for high-risk permissions where possible.",
    shieldMediaHint: "Shield can make media device enumeration generic/empty unless explicitly allowed.",
    shieldInstallHint: "This page cannot install or control the extension. Load extension/ unpacked, choose a persona, then rerun this demo.",
    installTitle: "Install Mainlander Shield",
    installNote: "Chrome and Edge do not allow one-click installation for this unpacked research extension. Use Developer mode and load the unzipped package.",
    installDownload: "Download release",
    installStep1: "Download mainlander-shield-*.zip from the GitHub release, then unzip it.",
    installStep2: "Open chrome://extensions or edge://extensions.",
    installStep3: "Turn on Developer mode.",
    installStep4: "Click Load unpacked and select the unzipped folder that contains manifest.json.",
    installStep5: "Open the Shield popup, choose a persona, then reload or rerun this demo to compare surfaces.",
    installTrouble: "If settings do not appear on an already-open page, save again in the popup/options or refresh the page; the extension applies new settings to open tabs automatically.",
    openSourceTitle: "Open source and no uploads",
    openSourceNote: "This page is open source. Local detector results are not uploaded anywhere; the only network calls are the static site assets and the optional IP/GeoIP providers you explicitly trigger.",
    primaryGuess: "Primary guess",
    noStrongGuess: "No strong country guess",
    generated: "Generated {time}",
    signalSummary: "{signals} signals · {contradictions} contradictions",
    contradictions: "Contradictions",
    noContradictions: "No obvious cross-signal contradiction detected.",
    networkDisabled: "Network/IP probe is disabled until clicked.",
    networkProbes: "Optional network probes",
    geoConsensus: "GeoIP consensus",
    geoVotes: "{votes} votes",
    noGeoConsensus: "No GeoIP country field returned by successful providers.",
    publicIps: "Public IPs reported",
    ok: "ok",
    skipped: "skipped",
    failed: "failed",
    countryScore: "Country score",
    noCountrySignalMatched: "No country-weighted signal matched.",
    environmentHashes: "Environment hashes",
    hashNote: "Hashes are consistency probes, not country proof.",
    noCountrySignal: "no country signal",
    rawValue: "raw value",
    rawReport: "Raw report",
    langSwitch: "语言：中文",
  },
  zh: {
    title: "Mainlander 实验室",
    eyebrow: "MAINLANDER 实验室",
    heroTitle: "浏览器国家/地区指纹检测器",
    lede: "静态优先的“最锋利的矛”实验室：语言、时区、渲染、设备、隐私与可选网络信号。",
    rerun: "重新运行本地检测",
    running: "检测运行中…",
    network: "可选 IP 探测",
    probing: "探测中…",
    fineprint: "本地检测完全在当前浏览器内运行。纯静态前端无法直接检查 IP/国家，除非用户主动调用第三方 endpoint。",
    controlTitle: "本地检测与可选网络探测",
    controlNote: "本地检测只在你的浏览器内运行。IP/GeoIP 探测默认隐藏，只有点击按钮授权后才会请求第三方服务。",
    shieldDemoTitle: "Shield 插件演示",
    shieldDemoNote: "加载 Mainlander Shield 扩展后，点击这里主动触发它会标准化/阻断的 API：persona、canvas、WebGPU、WebRTC、permissions、media devices。",
    shieldRun: "运行 Shield 演示",
    shieldRunning: "Shield 测试中…",
    shieldResults: "Shield 可观察 API 面",
    shieldPersonaHint: "如果 Shield 启用，这些值应匹配所选稳定 persona。",
    shieldCanvasHint: "两次同内容 canvas 样本应按站点稳定；可和未安装扩展时对比。",
    shieldWebGpuHint: "Shield 可隐藏 WebGPU；如果仍显示 present，说明 WebGPU 仍暴露。",
    shieldWebRtcOpen: "RTCPeerConnection 可以创建，说明 WebRTC 没被阻断。",
    shieldWebRtcBlocked: "RTCPeerConnection 被阻断或失败，这是 Shield 阻断 WebRTC 时的预期结果。",
    shieldPermissionHint: "Shield 会尽量让高风险权限查询返回保守的 prompt 状态。",
    shieldMediaHint: "Shield 可让媒体设备枚举变成通用/空列表，除非显式允许。",
    shieldInstallHint: "页面不能安装或控制扩展。请把 extension/ 作为未打包扩展加载，选择 persona 后再跑本演示。",
    installTitle: "安装 Mainlander Shield 扩展",
    installNote: "Chrome / Edge 不支持对这个未打包研究扩展一键安装；需要打开开发者模式，加载解压后的扩展目录。",
    installDownload: "下载 Release",
    installStep1: "从 GitHub Release 下载 mainlander-shield-*.zip，并解压。",
    installStep2: "打开 chrome://extensions 或 edge://extensions。",
    installStep3: "开启 Developer mode / 开发者模式。",
    installStep4: "点击 Load unpacked / 加载已解压的扩展程序，选择包含 manifest.json 的解压目录。",
    installStep5: "打开 Shield 小窗口选择 persona，然后刷新或重新运行本页演示来对比 API 面。",
    installTrouble: "如果已打开页面没立刻变化，在小窗口/选项页再保存一次或刷新页面；扩展会自动把新设置应用到已打开 tab。",
    openSourceTitle: "开源且不上传检测结果",
    openSourceNote: "这个网页是开源的。本地检测结果不会上传到任何地方；除了静态资源，只有你明确点击触发的可选 IP/GeoIP provider 会产生网络请求。",
    primaryGuess: "主要猜测",
    noStrongGuess: "没有强国家/地区猜测",
    generated: "生成时间 {time}",
    signalSummary: "{signals} 个信号 · {contradictions} 个矛盾",
    contradictions: "矛盾信号",
    noContradictions: "没有发现明显跨信号矛盾。",
    networkDisabled: "网络/IP 探测默认关闭，点击后才会请求。",
    networkProbes: "可选网络探测",
    geoConsensus: "GeoIP 汇总",
    geoVotes: "{votes} 票",
    noGeoConsensus: "成功返回的 provider 没有给出 GeoIP 国家字段。",
    publicIps: "返回的公网 IP",
    ok: "成功",
    skipped: "已跳过",
    failed: "失败",
    countryScore: "国家/地区评分",
    noCountrySignalMatched: "没有命中国家/地区加权信号。",
    environmentHashes: "环境哈希",
    hashNote: "哈希用于一致性检查，不代表国家/地区证明。",
    noCountrySignal: "无国家/地区信号",
    rawValue: "原始值",
    rawReport: "原始报告",
    langSwitch: "Language: English",
  },
};

export function detectLocale(): Locale {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return languages.some((lang) => /^zh\b/i.test(lang)) ? "zh" : "en";
}

export function setDocumentLocale(locale: Locale): void {
  document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  document.title = dictionaries[locale].title;
}

export function t(locale: Locale, key: string, vars: Record<string, string | number> = {}): string {
  let value = dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
  for (const [name, replacement] of Object.entries(vars)) {
    value = value.replaceAll(`{${name}}`, String(replacement));
  }
  return value;
}

export function otherLocale(locale: Locale): Locale {
  return locale === "zh" ? "en" : "zh";
}
