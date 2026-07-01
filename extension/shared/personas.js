export const PERSONAS = {
  gb: {
    id: "gb",
    label: "United Kingdom / English",
    locale: "en-GB",
    languages: ["en-GB", "en"],
    timeZone: "Europe/London",
    timezoneOffset: 0,
    platform: "MacIntel",
    userAgentData: { platform: "macOS", mobile: false },
    webgl: { vendor: "Intel Inc.", renderer: "Intel Iris OpenGL Engine", maxTextureSize: 16384 },
    screen: { width: 1440, height: 900, devicePixelRatio: 2 },
    seed: "mainlander-gb"
  },
  us: {
    id: "us",
    label: "United States / English",
    locale: "en-US",
    languages: ["en-US", "en"],
    timeZone: "America/New_York",
    timezoneOffset: 240,
    platform: "Win32",
    userAgentData: { platform: "Windows", mobile: false },
    webgl: { vendor: "Google Inc. (Intel)", renderer: "ANGLE (Intel, Intel UHD Graphics Direct3D11)", maxTextureSize: 16384 },
    screen: { width: 1920, height: 1080, devicePixelRatio: 1 },
    seed: "mainlander-us"
  },
  cnLite: {
    id: "cnLite",
    label: "Mainland China lite / Simplified Chinese",
    locale: "zh-CN",
    languages: ["zh-CN", "zh", "en"],
    timeZone: "Asia/Shanghai",
    timezoneOffset: -480,
    platform: "Win32",
    userAgentData: { platform: "Windows", mobile: false },
    webgl: { vendor: "Google Inc. (Intel)", renderer: "ANGLE (Intel, Intel UHD Graphics Direct3D11)", maxTextureSize: 16384 },
    screen: { width: 1920, height: 1080, devicePixelRatio: 1 },
    seed: "mainlander-cn-lite"
  }
};

export const DEFAULT_SETTINGS = {
  enableShield: true,
  personaId: "gb",
  networkShield: true,
  blockWebRTC: true,
  blockWebGPU: true,
  genericMediaDevices: true,
  conservativePermissions: true,
  farbleCanvas: true,
  farbleAudio: true
};

export function normalizeSettings(input = {}) {
  const settings = { ...DEFAULT_SETTINGS, ...input };
  if (!PERSONAS[settings.personaId]) settings.personaId = DEFAULT_SETTINGS.personaId;
  return settings;
}
