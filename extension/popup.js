const personaSelect = document.querySelector("#personaId");
const savedEl = document.querySelector("#saved");
let currentSettings = null;

loadStatus();
personaSelect.addEventListener("change", async () => {
  if (!currentSettings) return;
  await saveSettings({ ...currentSettings, personaId: personaSelect.value });
});
document.querySelector("#options").addEventListener("click", () => chrome.runtime.openOptionsPage());

async function loadStatus() {
  const status = await chrome.runtime.sendMessage({ type: "MAINLANDER_GET_STATUS" });
  document.querySelector("#status").textContent = status.ok ? "Active" : `Error: ${status.error}`;
  currentSettings = status.settings;
  personaSelect.value = status.settings?.personaId ?? "gb";
  document.querySelector("#audit-count").textContent = String(status.auditCount ?? 0);
  document.querySelector("#network-rules").textContent = String(status.networkRuleCount ?? 0);
  renderEvents(status.recentEvents ?? []);
}

async function saveSettings(settings) {
  personaSelect.disabled = true;
  savedEl.textContent = "Applying…";
  const result = await chrome.runtime.sendMessage({ type: "MAINLANDER_UPDATE_SETTINGS", settings });
  personaSelect.disabled = false;
  if (!result.ok) {
    savedEl.textContent = `Error: ${result.error}`;
    return;
  }
  currentSettings = result.settings;
  personaSelect.value = result.settings.personaId;
  savedEl.textContent = "Applied to open tabs";
  setTimeout(() => { savedEl.textContent = ""; }, 1600);
  await loadStatus();
}

function renderEvents(events) {
  const list = document.querySelector("#events");
  list.textContent = "";
  for (const event of events) {
    const li = document.createElement("li");
    li.textContent = `${event.surface} · ${new URL(event.url || "https://unknown.invalid").hostname}`;
    list.append(li);
  }
}
