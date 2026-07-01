(() => {
  const PERSONAS = {
    gb: { locale: "en-GB", languages: ["en-GB", "en"], timeZone: "Europe/London", timezoneOffset: 0, platform: "MacIntel", webglVendor: "Intel Inc.", webglRenderer: "Intel Iris OpenGL Engine", maxTextureSize: 16384, seed: "mainlander-gb" },
    us: { locale: "en-US", languages: ["en-US", "en"], timeZone: "America/New_York", timezoneOffset: 240, platform: "Win32", webglVendor: "Google Inc. (Intel)", webglRenderer: "ANGLE (Intel, Intel UHD Graphics Direct3D11)", maxTextureSize: 16384, seed: "mainlander-us" },
    cnLite: { locale: "zh-CN", languages: ["zh-CN", "zh", "en"], timeZone: "Asia/Shanghai", timezoneOffset: -480, platform: "Win32", webglVendor: "Google Inc. (Intel)", webglRenderer: "ANGLE (Intel, Intel UHD Graphics Direct3D11)", maxTextureSize: 16384, seed: "mainlander-cn-lite" }
  };
  const DEFAULT_SETTINGS = { enableShield: true, personaId: "gb", blockWebRTC: true, blockWebGPU: true, genericMediaDevices: true, conservativePermissions: true, farbleCanvas: true, farbleAudio: true };
  let settings = { ...DEFAULT_SETTINGS };

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.data?.source !== "mainlander-shield" || event.data?.type !== "settings") return;
    settings = { ...DEFAULT_SETTINGS, ...(event.data.settings || {}) };
  });

  const persona = () => PERSONAS[settings.personaId] || PERSONAS.gb;
  const enabled = () => settings.enableShield !== false;
  const audit = (surface, detail = {}) => {
    window.postMessage({ source: "mainlander-shield", type: "audit", event: { surface, detail, at: new Date().toISOString(), host: location.hostname } }, "*");
  };
  const defineGetter = (target, property, getter) => {
    try { Object.defineProperty(target, property, { configurable: true, get: getter }); } catch { /* ignore non-configurable surfaces */ }
  };
  const navLanguageGetter = Object.getOwnPropertyDescriptor(Navigator.prototype, "language")?.get;
  const navLanguagesGetter = Object.getOwnPropertyDescriptor(Navigator.prototype, "languages")?.get;
  const navPlatformGetter = Object.getOwnPropertyDescriptor(Navigator.prototype, "platform")?.get;

  defineGetter(Navigator.prototype, "language", () => enabled() ? persona().locale : navLanguageGetter?.call(navigator));
  defineGetter(Navigator.prototype, "languages", () => enabled() ? [...persona().languages] : navLanguagesGetter?.call(navigator));
  defineGetter(Navigator.prototype, "platform", () => enabled() ? persona().platform : navPlatformGetter?.call(navigator));

  if (typeof NavigatorUAData !== "undefined" && NavigatorUAData?.prototype?.getHighEntropyValues) {
    const original = NavigatorUAData.prototype.getHighEntropyValues;
    NavigatorUAData.prototype.getHighEntropyValues = function patchedHighEntropyValues(hints) {
      audit("navigator.userAgentData.getHighEntropyValues", { hints });
      return original.call(this, hints).then((value) => enabled() ? { ...value, platform: persona().platform.includes("Win") ? "Windows" : "macOS", mobile: false } : value);
    };
  }

  patchIntlConstructor("DateTimeFormat", (locales, options = {}) => [locales || persona().locale, { ...options, timeZone: options.timeZone || persona().timeZone }], (value) => ({ ...value, locale: persona().locale, timeZone: persona().timeZone }));
  patchIntlConstructor("NumberFormat", (locales, options = {}) => [locales || persona().locale, options], (value) => ({ ...value, locale: persona().locale }));
  patchIntlConstructor("Collator", (locales, options = {}) => [locales || persona().locale, options], (value) => ({ ...value, locale: persona().locale }));

  const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
  Date.prototype.getTimezoneOffset = function patchedTimezoneOffset() {
    audit("Date.getTimezoneOffset");
    return enabled() ? persona().timezoneOffset : originalGetTimezoneOffset.call(this);
  };

  patchWebGL(window.WebGLRenderingContext);
  patchWebGL(window.WebGL2RenderingContext);
  patchCanvas();
  patchAudio();
  patchWebRTC();
  patchPermissions();
  patchMediaDevices();
  patchWebGPU();

  function patchIntlConstructor(name, argsForPersona, resolvedForPersona) {
    const Original = Intl[name];
    if (typeof Original !== "function") return;
    const originalResolvedOptions = Original.prototype?.resolvedOptions;
    const Patched = function patchedIntlConstructor(locales, options = {}) {
      audit(`Intl.${name}`, { locales });
      if (enabled()) return Reflect.construct(Original, argsForPersona(locales, options), new.target || Original);
      return Reflect.construct(Original, [locales, options], new.target || Original);
    };
    Object.defineProperty(Patched, "name", { value: name, configurable: true });
    Patched.prototype = Original.prototype;
    Object.setPrototypeOf(Patched, Original);
    if (Original.supportedLocalesOf) Patched.supportedLocalesOf = Original.supportedLocalesOf.bind(Original);
    Intl[name] = Patched;
    if (typeof originalResolvedOptions === "function") {
      Original.prototype.resolvedOptions = function patchedResolvedOptions() {
        const value = originalResolvedOptions.call(this);
        return enabled() ? resolvedForPersona(value) : value;
      };
    }
  }

  function patchWebGL(Ctor) {
    if (!Ctor?.prototype?.getParameter) return;
    const original = Ctor.prototype.getParameter;
    Ctor.prototype.getParameter = function patchedGetParameter(parameter) {
      audit("WebGL.getParameter", { parameter });
      if (!enabled()) return original.call(this, parameter);
      const gl = this;
      const debug = gl.getExtension?.("WEBGL_debug_renderer_info");
      if (debug && parameter === debug.UNMASKED_VENDOR_WEBGL) return persona().webglVendor;
      if (debug && parameter === debug.UNMASKED_RENDERER_WEBGL) return persona().webglRenderer;
      if (parameter === gl.MAX_TEXTURE_SIZE) return persona().maxTextureSize;
      return original.call(this, parameter);
    };
  }

  function patchCanvas() {
    const proto = HTMLCanvasElement.prototype;
    const originalToDataURL = proto.toDataURL;
    const originalToBlob = proto.toBlob;
    proto.toDataURL = function patchedToDataURL(...args) {
      audit("canvas.toDataURL", { width: this.width, height: this.height });
      if (enabled() && settings.farbleCanvas !== false) farbleCanvas(this);
      return originalToDataURL.apply(this, args);
    };
    proto.toBlob = function patchedToBlob(callback, ...args) {
      audit("canvas.toBlob", { width: this.width, height: this.height });
      if (enabled() && settings.farbleCanvas !== false) farbleCanvas(this);
      return originalToBlob.call(this, callback, ...args);
    };
    const ctxProto = CanvasRenderingContext2D?.prototype;
    if (ctxProto?.getImageData) {
      const originalGetImageData = ctxProto.getImageData;
      ctxProto.getImageData = function patchedGetImageData(...args) {
        audit("canvas.getImageData");
        const image = originalGetImageData.apply(this, args);
        if (enabled() && settings.farbleCanvas !== false) perturbPixels(image.data, seeded(location.hostname + persona().seed), 3);
        return image;
      };
    }
    if (ctxProto?.measureText) {
      const originalMeasureText = ctxProto.measureText;
      ctxProto.measureText = function patchedMeasureText(text) {
        audit("canvas.measureText", { font: this.font });
        if (enabled() && persona().locale !== "zh-CN" && isCjkFontProbe(this.font)) {
          const previous = this.font;
          try {
            this.font = fallbackFont(previous);
            return originalMeasureText.call(this, text);
          } finally {
            this.font = previous;
          }
        }
        return originalMeasureText.call(this, text);
      };
    }
  }

  function isCjkFontProbe(fontValue) {
    return /Microsoft YaHei|SimSun|SimHei|DengXian|FangSong|KaiTi|PingFang SC|Hiragino Sans GB|Heiti SC|Noto Sans CJK SC|Source Han Sans SC|WenQuanYi|HarmonyOS Sans|Alibaba PuHuiTi|方正|小标宋|仿宋_GB2312/i.test(fontValue);
  }

  function fallbackFont(fontValue) {
    const sizeMatch = fontValue.match(/(?:^|\s)(\d+(?:\.\d+)?px(?:\/\d+(?:\.\d+)?px)?)/);
    const size = sizeMatch?.[1] || "72px";
    const base = /monospace/i.test(fontValue) ? "monospace" : /serif/i.test(fontValue) && !/sans-serif/i.test(fontValue) ? "serif" : "sans-serif";
    return `${size} ${base}`;
  }

  function farbleCanvas(canvas) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx || !canvas.width || !canvas.height) return;
    const rng = seeded(location.hostname + persona().seed);
    const x = Math.floor(rng() * Math.min(canvas.width, 16));
    const y = Math.floor(rng() * Math.min(canvas.height, 16));
    const image = ctx.getImageData(x, y, 1, 1);
    perturbPixels(image.data, rng, 2);
    ctx.putImageData(image, x, y);
  }

  function patchAudio() {
    if (!AudioBuffer?.prototype?.getChannelData) return;
    const original = AudioBuffer.prototype.getChannelData;
    AudioBuffer.prototype.getChannelData = function patchedGetChannelData(channel) {
      audit("AudioBuffer.getChannelData", { channel });
      const data = original.call(this, channel);
      if (!enabled() || settings.farbleAudio === false) return data;
      const rng = seeded(location.hostname + persona().seed + "audio" + channel);
      for (let i = 0; i < data.length; i += 97) data[i] += (rng() - 0.5) * 1e-7;
      return data;
    };
  }

  function patchWebRTC() {
    if (!settings.blockWebRTC) return;
    const Original = window.RTCPeerConnection || window.webkitRTCPeerConnection;
    if (!Original) return;
    window.RTCPeerConnection = function blockedRTCPeerConnection(...args) {
      audit("RTCPeerConnection.blocked");
      if (enabled() && settings.blockWebRTC) throw new DOMException("Blocked by Mainlander Shield", "SecurityError");
      return new Original(...args);
    };
  }

  function patchPermissions() {
    if (!navigator.permissions?.query) return;
    const original = navigator.permissions.query.bind(navigator.permissions);
    navigator.permissions.query = (descriptor) => {
      audit("permissions.query", descriptor);
      const highRisk = ["geolocation", "camera", "microphone", "midi", "clipboard-read", "local-fonts", "idle-detection"];
      if (enabled() && settings.conservativePermissions !== false && highRisk.includes(descriptor?.name)) {
        return Promise.resolve({ state: "prompt", onchange: null });
      }
      return original(descriptor);
    };
  }

  function patchMediaDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const original = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
    navigator.mediaDevices.enumerateDevices = () => {
      audit("mediaDevices.enumerateDevices");
      if (enabled() && settings.genericMediaDevices) return Promise.resolve([]);
      return original();
    };
  }

  function patchWebGPU() {
    if (!("gpu" in navigator)) return;
    audit("navigator.gpu.present");
    if (settings.blockWebGPU) defineGetter(Navigator.prototype, "gpu", () => enabled() ? undefined : navigator.gpu);
  }

  function seeded(seedText) {
    let state = 0x811c9dc5;
    for (let i = 0; i < seedText.length; i++) state = Math.imul(state ^ seedText.charCodeAt(i), 0x01000193) >>> 0;
    return () => {
      state += 0x6D2B79F5;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function perturbPixels(data, rng, stride) {
    for (let i = 0; i < data.length; i += 4 * stride) {
      data[i] = clamp(data[i] + Math.round(rng() * 2 - 1));
      data[i + 1] = clamp(data[i + 1] + Math.round(rng() * 2 - 1));
      data[i + 2] = clamp(data[i + 2] + Math.round(rng() * 2 - 1));
    }
  }

  function clamp(value) {
    return Math.max(0, Math.min(255, value));
  }
})();
