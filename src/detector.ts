export type RiskLevel = "low" | "medium" | "high" | "info";

export interface Signal {
  id: string;
  label: string;
  category: string;
  value: unknown;
  weight: number;
  score: number;
  countries: string[];
  level: RiskLevel;
  notes?: string;
}

export interface DetectionReport {
  generatedAt: string;
  userAgent: string;
  primaryCountryGuess: string | null;
  countryScores: Record<string, number>;
  contradictions: string[];
  signals: Signal[];
  hashes: Record<string, string>;
  optionalNetwork?: NetworkProbeResult[];
}

export interface NetworkProbeResult {
  ok: boolean;
  provider: string;
  endpoint: string;
  value?: unknown;
  error?: string;
  skipped?: boolean;
}

export interface NetworkGeoCountryVote {
  country: string;
  label: string;
  votes: number;
  providers: string[];
}

export interface NetworkGeoSummary {
  publicIps: string[];
  countryVotes: NetworkGeoCountryVote[];
  providerCount: number;
  okCount: number;
  failedCount: number;
  topCountry: string | null;
}

type Candidate = {
  country: string;
  reason: string;
  score?: number;
};

const LANGUAGE_COUNTRIES: Record<string, string[]> = {
  "zh-cn": ["CN"],
  "zh-hans": ["CN", "SG"],
  "zh-sg": ["SG", "CN"],
  "zh-hk": ["HK"],
  "zh-mo": ["MO"],
  "zh-tw": ["TW"],
  "zh-hant": ["TW", "HK", "MO"],
  "ja": ["JP"],
  "ja-jp": ["JP"],
  "ko": ["KR"],
  "ko-kr": ["KR"],
  "en-us": ["US"],
  "en-gb": ["GB"],
  "en-ca": ["CA"],
  "en-au": ["AU"],
  "fr-fr": ["FR"],
  "de-de": ["DE"],
  "es-es": ["ES"],
  "ru-ru": ["RU"],
  "pt-br": ["BR"],
};

const TIMEZONE_COUNTRIES: Record<string, string[]> = {
  "Asia/Shanghai": ["CN"],
  "Asia/Chongqing": ["CN"],
  "Asia/Harbin": ["CN"],
  "Asia/Urumqi": ["CN"],
  "Asia/Beijing": ["CN"],
  "Asia/Hong_Kong": ["HK"],
  "Asia/Macau": ["MO"],
  "Asia/Taipei": ["TW"],
  "Asia/Tokyo": ["JP"],
  "Asia/Seoul": ["KR"],
  "Asia/Singapore": ["SG"],
  "Asia/Bangkok": ["TH"],
  "Asia/Jakarta": ["ID"],
  "Asia/Kolkata": ["IN"],
  "Europe/London": ["GB"],
  "Europe/Paris": ["FR"],
  "Europe/Berlin": ["DE"],
  "Europe/Madrid": ["ES"],
  "Europe/Moscow": ["RU"],
  "America/New_York": ["US"],
  "America/Chicago": ["US"],
  "America/Denver": ["US"],
  "America/Los_Angeles": ["US"],
  "America/Toronto": ["CA"],
  "America/Sao_Paulo": ["BR"],
  "Australia/Sydney": ["AU"],
};

const OFFSET_COUNTRIES: Record<number, string[]> = {
  [-480]: ["CN", "HK", "MO", "TW", "SG"],
  [-540]: ["JP", "KR"],
  [0]: ["GB", "PT"],
  [-60]: ["GB", "PT", "FR", "DE", "ES"],
  [-120]: ["FR", "DE", "ES"],
  [300]: ["US", "CA"],
  [240]: ["US", "CA"],
  [480]: ["US", "CA"],
  [420]: ["US", "CA"],
};

const CHINESE_FONTS = [
  "Microsoft YaHei",
  "SimSun",
  "SimHei",
  "DengXian",
  "FangSong",
  "KaiTi",
  "PingFang SC",
  "Hiragino Sans GB",
  "Heiti SC",
  "Noto Sans CJK SC",
  "Source Han Sans SC",
  "WenQuanYi Micro Hei",
  "HarmonyOS Sans",
  "Alibaba PuHuiTi",
  "方正小标宋简体",
  "小标宋体",
  "仿宋_GB2312",
];

const COUNTRY_NAMES: Record<string, string> = {
  CN: "Mainland China",
  HK: "Hong Kong",
  MO: "Macau",
  TW: "Taiwan",
  JP: "Japan",
  KR: "South Korea",
  SG: "Singapore",
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  FR: "France",
  DE: "Germany",
  ES: "Spain",
  RU: "Russia",
  BR: "Brazil",
  IN: "India",
  TH: "Thailand",
  ID: "Indonesia",
  PT: "Portugal",
};

export function countryLabel(code: string): string {
  return COUNTRY_NAMES[code] ? `${code} · ${COUNTRY_NAMES[code]}` : code;
}

export function summarizeNetworkGeo(results: NetworkProbeResult[]): NetworkGeoSummary {
  const publicIps: string[] = [];
  const countries = new Map<string, { country: string; providers: string[] }>();
  let okCount = 0;

  for (const result of results) {
    if (!result.ok) continue;
    okCount++;
    const value = asRecord(result.value);
    if (!value) continue;

    const ip = firstString(value.ip, value.ipAddress, value.query);
    if (ip && !publicIps.includes(ip)) publicIps.push(ip);

    const country = normalizeCountryCode(firstString(value.country, value.countryCode, value.loc));
    if (!country) continue;
    const vote = countries.get(country) ?? { country, providers: [] };
    vote.providers.push(result.provider);
    countries.set(country, vote);
  }

  const countryVotes = [...countries.values()]
    .map((vote) => ({
      country: vote.country,
      label: countryLabel(vote.country),
      votes: vote.providers.length,
      providers: vote.providers,
    }))
    .sort((a, b) => b.votes - a.votes || a.country.localeCompare(b.country));

  return {
    publicIps,
    countryVotes,
    providerCount: results.length,
    okCount,
    failedCount: results.length - okCount,
    topCountry: countryVotes[0]?.country ?? null,
  };
}

export async function runLocalDetector(): Promise<DetectionReport> {
  const signals: Signal[] = [];
  const hashes: Record<string, string> = {};

  addSignal(signals, languageSignal());
  addSignal(signals, intlSignal());
  addSignal(signals, dateOffsetSignal());
  addSignal(signals, navigatorSignal());
  addSignal(signals, screenSignal());
  addSignal(signals, storageSignal());

  const canvas = canvasSignal();
  hashes.canvas = canvas.hash;
  addSignal(signals, canvas.signal);

  addSignal(signals, emojiSignal());
  addSignal(signals, fontSignal());

  const webgl = webglSignal();
  hashes.webgl = webgl.hash;
  addSignal(signals, webgl.signal);

  const audio = await audioSignal();
  hashes.audio = audio.hash;
  addSignal(signals, audio.signal);

  const webrtc = await webRtcSignal();
  addSignal(signals, webrtc);

  const countryScores = scoreCountries(signals);
  const primaryCountryGuess = Object.entries(countryScores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const contradictions = findContradictions(signals, countryScores);

  return {
    generatedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    primaryCountryGuess,
    countryScores,
    contradictions,
    signals,
    hashes,
  };
}

export async function runNetworkProbe(): Promise<NetworkProbeResult[]> {
  const providers: Array<{ provider: string; endpoint: string; parser?: (res: Response) => Promise<unknown> }> = [
    {
      provider: "Cloudflare trace",
      endpoint: "https://www.cloudflare.com/cdn-cgi/trace",
      parser: async (res) => {
        const text = await res.text();
        return Object.fromEntries(text.trim().split("\n").map((line) => {
          const idx = line.indexOf("=");
          return idx === -1 ? [line, ""] : [line.slice(0, idx), line.slice(idx + 1)];
        }));
      },
    },
    { provider: "ipify IPv4", endpoint: "https://api.ipify.org?format=json" },
    { provider: "ipify IPv6/auto", endpoint: "https://api64.ipify.org?format=json" },
    { provider: "ipapi.co", endpoint: "https://ipapi.co/json/" },
    { provider: "freeipapi.com", endpoint: "https://freeipapi.com/api/json" },
    { provider: "BigDataCloud client-ip", endpoint: "https://api.bigdatacloud.net/data/client-ip" },
    // ip-api's no-key tier is HTTP-only. It works on local http demos, but browsers block it from HTTPS pages.
    { provider: "ip-api.com free", endpoint: "http://ip-api.com/json/" },
  ];

  return Promise.all(providers.map(async (probe) => {
    if (location.protocol === "https:" && probe.endpoint.startsWith("http://")) {
      return { ok: false, provider: probe.provider, endpoint: probe.endpoint, skipped: true, error: "Skipped on HTTPS page to avoid mixed-content blocking." };
    }
    try {
      const res = await fetchWithTimeout(probe.endpoint, 4500);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const value = probe.parser ? await probe.parser(res) : await res.json();
      return { ok: true, provider: probe.provider, endpoint: probe.endpoint, value };
    } catch (err) {
      return { ok: false, provider: probe.provider, endpoint: probe.endpoint, error: err instanceof Error ? err.message : String(err) };
    }
  }));
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { cache: "no-store", signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

function addSignal(signals: Signal[], signal: Signal | null | undefined): void {
  if (signal) signals.push(signal);
}

function mkSignal(input: Omit<Signal, "level">): Signal {
  const level: RiskLevel = input.score >= 3 ? "high" : input.score >= 1.5 ? "medium" : input.score > 0 ? "low" : "info";
  return { ...input, level };
}

function languageSignal(): Signal {
  const languages = [...(navigator.languages?.length ? navigator.languages : [navigator.language])].filter(Boolean);
  const candidates = languages.flatMap((lang, index) => languageCandidates(lang, index === 0 ? 2 : 1));
  return mkSignal({
    id: "navigator.languages",
    label: "Navigator languages",
    category: "locale",
    value: { language: navigator.language, languages },
    weight: 2,
    score: candidates.length ? 2 : 0,
    countries: unique(candidates.flatMap((c) => c.country)),
    notes: candidates.map((c) => c.reason).join("; ") || "No country-specific language tag matched.",
  });
}

function languageCandidates(lang: string, score = 1): Candidate[] {
  const normalized = lang.toLowerCase();
  const direct = LANGUAGE_COUNTRIES[normalized];
  if (direct) return direct.map((country) => ({ country, score, reason: `${lang} -> ${country}` }));
  const primary = normalized.split("-")[0];
  const fallback = LANGUAGE_COUNTRIES[primary];
  return fallback ? fallback.map((country) => ({ country, score: score * 0.6, reason: `${lang} primary subtag -> ${country}` })) : [];
}

function intlSignal(): Signal {
  const date = new Intl.DateTimeFormat().resolvedOptions();
  const number = new Intl.NumberFormat().resolvedOptions();
  const collator = new Intl.Collator().resolvedOptions();
  const tzCountries = date.timeZone ? (TIMEZONE_COUNTRIES[date.timeZone] ?? []) : [];
  const localeCandidates = [date.locale, number.locale, collator.locale].flatMap((loc) => languageCandidates(loc, 0.75));
  const countries = unique([...tzCountries, ...localeCandidates.map((c) => c.country)]);
  return mkSignal({
    id: "intl.resolvedOptions",
    label: "Intl locale and timezone",
    category: "locale",
    value: { date, number, collator },
    weight: 2.5,
    score: countries.length ? 2.5 : 0,
    countries,
    notes: date.timeZone ? `${date.timeZone} -> ${(tzCountries.length ? tzCountries : ["unknown"]).join(", ")}` : "Intl timezone unavailable.",
  });
}

function dateOffsetSignal(): Signal {
  const offset = new Date().getTimezoneOffset();
  const countries = OFFSET_COUNTRIES[offset] ?? [];
  return mkSignal({
    id: "date.timezoneOffset",
    label: "Date timezone offset",
    category: "timezone",
    value: { getTimezoneOffset: offset, utcOffsetHours: -offset / 60 },
    weight: 1,
    score: countries.length ? 1 : 0,
    countries,
    notes: countries.length ? `Offset maps broadly to ${countries.join(", ")}` : "Offset is too broad or unmapped.",
  });
}

function navigatorSignal(): Signal {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string; brands?: unknown; mobile?: boolean }; deviceMemory?: number };
  const value = {
    platform: navigator.platform,
    userAgent: navigator.userAgent,
    vendor: navigator.vendor,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: nav.deviceMemory,
    maxTouchPoints: navigator.maxTouchPoints,
    userAgentData: nav.userAgentData,
  };
  const notes: string[] = [];
  if (/MicroMessenger|QQBrowser|UCBrowser|Huawei|HarmonyOS|MiuiBrowser|HeyTapBrowser/i.test(navigator.userAgent)) notes.push("UA contains China-market browser/device token.");
  const countries = notes.length ? ["CN"] : [];
  return mkSignal({
    id: "navigator.identity",
    label: "Navigator platform and UA",
    category: "device",
    value,
    weight: 1.5,
    score: countries.length ? 1.5 : 0,
    countries,
    notes: notes.join(" ") || "No obvious country-specific UA token.",
  });
}

function screenSignal(): Signal {
  return mkSignal({
    id: "screen.metrics",
    label: "Screen and viewport metrics",
    category: "device",
    value: {
      screen: pick(screen, ["width", "height", "availWidth", "availHeight", "colorDepth", "pixelDepth"]),
      inner: { width: innerWidth, height: innerHeight, devicePixelRatio },
      orientation: screen.orientation ? { type: screen.orientation.type, angle: screen.orientation.angle } : null,
    },
    weight: 0.25,
    score: 0,
    countries: [],
    notes: "Useful for cross-signal consistency, weak by itself.",
  });
}

function storageSignal(): Signal {
  const value: Record<string, unknown> = {};
  try { value.localStorage = !!window.localStorage; } catch { value.localStorage = false; }
  try { value.sessionStorage = !!window.sessionStorage; } catch { value.sessionStorage = false; }
  return mkSignal({
    id: "storage.availability",
    label: "Storage availability",
    category: "privacy",
    value,
    weight: 0.25,
    score: 0,
    countries: [],
    notes: "Privacy modes and anti-fingerprint tools often change this surface.",
  });
}

function canvasSignal(): { signal: Signal; hash: string } {
  const canvas = document.createElement("canvas");
  canvas.width = 420;
  canvas.height = 120;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { hash: "unavailable", signal: mkSignal({ id: "canvas.hash", label: "Canvas hash", category: "rendering", value: null, weight: 0.5, score: 0, countries: [], notes: "Canvas unavailable." }) };
  }
  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f97316";
  ctx.font = "32px Arial, sans-serif";
  ctx.fillText("mainlander 祖国人 🇨🇳 🇹🇼 日本 한국", 12, 48);
  ctx.fillStyle = "rgba(59, 130, 246, 0.67)";
  ctx.rotate(0.03);
  ctx.fillText("fingerprint lab", 70, 92);
  const data = canvas.toDataURL();
  const hash = fnv1a(data);
  return {
    hash,
    signal: mkSignal({
      id: "canvas.hash",
      label: "Canvas rendering hash",
      category: "rendering",
      value: { hash, length: data.length },
      weight: 0.5,
      score: 0,
      countries: [],
      notes: "Canvas hashes help link environments but should not imply country alone.",
    }),
  };
}

function emojiSignal(): Signal {
  const probes = ["🇹🇼", "🇭🇰", "🇨🇳", "🏳️‍🌈", "🧑‍💻"];
  const results = probes.map((emoji) => analyzeEmoji(emoji));
  const taiwan = results.find((r) => r.emoji === "🇹🇼");
  const mainlandLike = !!taiwan?.isMono;
  return mkSignal({
    id: "emoji.rendering",
    label: "Emoji rendering probe",
    category: "rendering",
    value: results,
    weight: 1.5,
    score: mainlandLike ? 1.5 : 0,
    countries: mainlandLike ? ["CN"] : [],
    notes: mainlandLike ? "Taiwan flag appears monochrome/missing, a known Mainland China device/browser signal." : "No Mainland-specific emoji suppression detected.",
  });
}

function analyzeEmoji(emoji: string): { emoji: string; colors: number; isMono: boolean; nonTransparent: number } {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { emoji, colors: 0, isMono: false, nonTransparent: 0 };
  ctx.font = "72px sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(emoji, 4, 4);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const colors = new Set<string>();
  let nonTransparent = 0;
  let isMono = true;
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a > 0) {
      nonTransparent++;
      colors.add(`${r},${g},${b}`);
      if (r !== g || g !== b) isMono = false;
    }
  }
  return { emoji, colors: colors.size, isMono, nonTransparent };
}

function fontSignal(): Signal {
  const hits = CHINESE_FONTS.filter(isFontAvailable);
  return mkSignal({
    id: "fonts.chinese",
    label: "Chinese font availability",
    category: "rendering",
    value: { hits, tested: CHINESE_FONTS },
    weight: 2,
    score: hits.length ? Math.min(2, 0.5 + hits.length * 0.25) : 0,
    countries: hits.length ? ["CN", "TW", "HK", "SG"] : [],
    notes: hits.length ? `Detected ${hits.length} CJK/Chinese fonts.` : "No tested Chinese fonts detected.",
  });
}

function isFontAvailable(font: string): boolean {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  const sample = "mmmmmmmmmmlli中文测试国國骨曜";
  return ["monospace", "sans-serif", "serif"].some((base) => {
    ctx.font = `72px ${base}`;
    const baseWidth = ctx.measureText(sample).width;
    ctx.font = `72px "${font}", ${base}`;
    const fontWidth = ctx.measureText(sample).width;
    return Math.abs(fontWidth - baseWidth) > 0.01;
  });
}

function webglSignal(): { signal: Signal; hash: string } {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl") as WebGLRenderingContext | null;
  if (!gl) return { hash: "unavailable", signal: mkSignal({ id: "webgl.renderer", label: "WebGL renderer", category: "rendering", value: null, weight: 0.5, score: 0, countries: [], notes: "WebGL unavailable." }) };
  const debug = gl.getExtension("WEBGL_debug_renderer_info");
  const value = {
    vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
    renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    version: gl.getParameter(gl.VERSION),
    shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
  };
  const hash = fnv1a(JSON.stringify(value));
  return { hash, signal: mkSignal({ id: "webgl.renderer", label: "WebGL vendor/renderer", category: "rendering", value, weight: 0.5, score: 0, countries: [], notes: "Useful for device consistency; not a country signal alone." }) };
}

async function audioSignal(): Promise<{ signal: Signal; hash: string }> {
  try {
    const Offline = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
    if (!Offline) throw new Error("OfflineAudioContext unavailable");
    const ctx = new Offline(1, 4410, 44100);
    const osc = ctx.createOscillator();
    const compressor = ctx.createDynamicsCompressor();
    osc.type = "triangle";
    osc.frequency.value = 10000;
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;
    osc.connect(compressor);
    compressor.connect(ctx.destination);
    osc.start(0);
    const buffer = await ctx.startRendering();
    const channel = buffer.getChannelData(0);
    let sum = 0;
    for (let i = 0; i < channel.length; i += 100) sum += Math.abs(channel[i]);
    const hash = fnv1a(String(sum));
    return { hash, signal: mkSignal({ id: "audio.fingerprint", label: "AudioContext fingerprint", category: "rendering", value: { hash, sample: Number(sum.toFixed(8)) }, weight: 0.5, score: 0, countries: [], notes: "Detects environment consistency and anti-fingerprint noise, not country alone." }) };
  } catch (err) {
    return { hash: "unavailable", signal: mkSignal({ id: "audio.fingerprint", label: "AudioContext fingerprint", category: "rendering", value: null, weight: 0.5, score: 0, countries: [], notes: err instanceof Error ? err.message : String(err) }) };
  }
}

async function webRtcSignal(): Promise<Signal> {
  const RTCPeerConnectionCtor = window.RTCPeerConnection || (window as unknown as { webkitRTCPeerConnection?: typeof RTCPeerConnection }).webkitRTCPeerConnection;
  if (!RTCPeerConnectionCtor) {
    return mkSignal({ id: "webrtc.candidates", label: "WebRTC candidates", category: "network-local", value: null, weight: 0.25, score: 0, countries: [], notes: "WebRTC unavailable." });
  }
  const candidates: string[] = [];
  try {
    const pc = new RTCPeerConnectionCtor({ iceServers: [] });
    pc.createDataChannel("mainlander");
    pc.onicecandidate = (event) => {
      if (event.candidate?.candidate) candidates.push(event.candidate.candidate);
    };
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await new Promise((resolve) => setTimeout(resolve, 800));
    pc.close();
    return mkSignal({ id: "webrtc.candidates", label: "WebRTC local candidates", category: "network-local", value: candidates, weight: 0.25, score: 0, countries: [], notes: candidates.some((c) => c.includes(".local")) ? "mDNS masking is active." : "May expose local network candidates depending on browser policy." });
  } catch (err) {
    return mkSignal({ id: "webrtc.candidates", label: "WebRTC local candidates", category: "network-local", value: candidates, weight: 0.25, score: 0, countries: [], notes: err instanceof Error ? err.message : String(err) });
  }
}

function scoreCountries(signals: Signal[]): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const signal of signals) {
    if (!signal.countries.length || signal.score <= 0) continue;
    const share = signal.score / signal.countries.length;
    for (const country of signal.countries) scores[country] = Number(((scores[country] ?? 0) + share).toFixed(3));
  }
  return Object.fromEntries(Object.entries(scores).sort((a, b) => b[1] - a[1]));
}

function findContradictions(signals: Signal[], scores: Record<string, number>): string[] {
  const contradictions: string[] = [];
  const lang = signals.find((s) => s.id === "navigator.languages");
  const intl = signals.find((s) => s.id === "intl.resolvedOptions");
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (top.length >= 2 && top[0][1] - top[1][1] < 1) contradictions.push(`Top country scores are close: ${top.map(([c, s]) => `${c}=${s}`).join(", ")}.`);
  if (lang?.countries.length && intl?.countries.length && !lang.countries.some((c) => intl.countries.includes(c))) {
    contradictions.push(`Navigator language (${lang.countries.join("/")}) conflicts with Intl timezone/locale (${intl.countries.join("/")}).`);
  }
  if (signals.find((s) => s.id === "fonts.chinese" && s.countries.length) && !Object.keys(scores).some((c) => ["CN", "TW", "HK", "MO", "SG"].includes(c))) {
    contradictions.push("Chinese fonts detected without a Chinese/Singapore locale/timezone score.");
  }
  return contradictions;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function normalizeCountryCode(value: string | null): string | null {
  if (!value) return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return Object.fromEntries(keys.map((k) => [k, obj[k]])) as Pick<T, K>;
}

function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
