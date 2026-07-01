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
