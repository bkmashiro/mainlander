const DEFAULT_SETTINGS = {
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

if (!globalThis.__MAINLANDER_SHIELD_BRIDGE_INSTALLED__) {
  globalThis.__MAINLANDER_SHIELD_BRIDGE_INSTALLED__ = true;

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && Object.keys(changes).some((key) => key in DEFAULT_SETTINGS)) sendSettings();
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "MAINLANDER_REFRESH_SETTINGS") return false;
    sendSettings().then(() => sendResponse({ ok: true })).catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  });

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.data?.source !== "mainlander-shield") return;
    if (event.data?.type === "request-settings") {
      sendSettings();
      return;
    }
    if (event.data?.type !== "audit") return;
    chrome.runtime.sendMessage({ type: "MAINLANDER_AUDIT_EVENT", event: event.data.event }).catch(() => undefined);
  });
}

sendSettings();

async function sendSettings() {
  try {
    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    window.postMessage({ source: "mainlander-shield", type: "settings", settings }, "*");
  } catch {
    window.postMessage({ source: "mainlander-shield", type: "settings", settings: DEFAULT_SETTINGS }, "*");
  }
}
