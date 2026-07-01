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
for (const field of FIELDS) {
  document.querySelector(`#${field}`)?.addEventListener("change", () => {
    document.querySelector("#saved").textContent = "Unsaved change";
  });
}

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
  document.querySelector("#saved").textContent = "Applying…";
  const result = await chrome.runtime.sendMessage({ type: "MAINLANDER_UPDATE_SETTINGS", settings });
  if (!result.ok) {
    document.querySelector("#saved").textContent = `Error: ${result.error}`;
    return;
  }
  document.querySelector("#saved").textContent = "Saved and applied to open tabs";
  setTimeout(() => document.querySelector("#saved").textContent = "", 1800);
}
