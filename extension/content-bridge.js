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

sendSettings();
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && Object.keys(changes).some((key) => key in DEFAULT_SETTINGS)) sendSettings();
});

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.source !== "mainlander-shield" || event.data?.type !== "audit") return;
  chrome.runtime.sendMessage({ type: "MAINLANDER_AUDIT_EVENT", event: event.data.event }).catch(() => undefined);
});

async function sendSettings() {
  try {
    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    window.postMessage({ source: "mainlander-shield", type: "settings", settings }, "*");
  } catch {
    window.postMessage({ source: "mainlander-shield", type: "settings", settings: DEFAULT_SETTINGS }, "*");
  }
}
