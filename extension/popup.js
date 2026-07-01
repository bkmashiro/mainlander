chrome.runtime.sendMessage({ type: "MAINLANDER_GET_STATUS" }).then((status) => {
  document.querySelector("#status").textContent = status.ok ? "Active" : `Error: ${status.error}`;
  document.querySelector("#persona").textContent = status.settings?.personaId ?? "unknown";
  document.querySelector("#audit-count").textContent = String(status.auditCount ?? 0);
  document.querySelector("#network-rules").textContent = String(status.networkRuleCount ?? 0);
  const events = document.querySelector("#events");
  events.textContent = "";
  for (const event of status.recentEvents ?? []) {
    const li = document.createElement("li");
    li.textContent = `${event.surface} · ${new URL(event.url || "https://unknown.invalid").hostname}`;
    events.append(li);
  }
});

document.querySelector("#options").addEventListener("click", () => chrome.runtime.openOptionsPage());
