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
const FIELDS = Object.keys(DEFAULT_SETTINGS);

load();
document.querySelector("#save").addEventListener("click", save);

async function load() {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  for (const field of FIELDS) {
    const el = document.querySelector(`#${field}`);
    if (!el) continue;
    if (el.type === "checkbox") el.checked = Boolean(settings[field]);
    else el.value = settings[field];
  }
}

async function save() {
  const settings = {};
  for (const field of FIELDS) {
    const el = document.querySelector(`#${field}`);
    settings[field] = el.type === "checkbox" ? el.checked : el.value;
  }
  await chrome.storage.sync.set(settings);
  await chrome.runtime.sendMessage({ type: "MAINLANDER_APPLY_NETWORK_SHIELD", enabled: settings.networkShield });
  document.querySelector("#saved").textContent = "Saved";
  setTimeout(() => document.querySelector("#saved").textContent = "", 1600);
}
