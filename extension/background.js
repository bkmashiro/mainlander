import { DEFAULT_SETTINGS, normalizeSettings } from "./shared/personas.js";

const GEOIP_RULES = [
  "*://www.cloudflare.com/cdn-cgi/trace*",
  "*://api.ipify.org/*",
  "*://api64.ipify.org/*",
  "*://ipapi.co/*",
  "*://freeipapi.com/*",
  "*://api.bigdatacloud.net/data/client-ip*",
  "*://ip-api.com/json*"
].map((urlFilter, index) => ({
  id: 10_000 + index,
  priority: 1,
  action: { type: "block" },
  condition: { urlFilter, resourceTypes: ["xmlhttprequest", "sub_frame", "main_frame", "script"] }
}));

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  const settings = normalizeSettings(current);
  await chrome.storage.sync.set(settings);
  await applyNetworkShield(settings.networkShield);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  if (changes.networkShield) applyNetworkShield(Boolean(changes.networkShield.newValue));
  if (Object.keys(changes).some((key) => key in DEFAULT_SETTINGS)) refreshOpenTabs();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "MAINLANDER_AUDIT_EVENT") {
    recordAuditEvent({
      ...message.event,
      tabId: sender.tab?.id ?? null,
      url: sender.url ?? sender.tab?.url ?? null,
      receivedAt: new Date().toISOString()
    }).then(() => sendResponse({ ok: true })).catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message?.type === "MAINLANDER_GET_STATUS") {
    getStatus().then(sendResponse).catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message?.type === "MAINLANDER_UPDATE_SETTINGS") {
    updateSettings(message.settings).then(sendResponse).catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message?.type === "MAINLANDER_APPLY_NETWORK_SHIELD") {
    applyNetworkShield(Boolean(message.enabled)).then(() => sendResponse({ ok: true })).catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  return false;
});

async function applyNetworkShield(enabled) {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing.filter((rule) => rule.id >= 10_000 && rule.id < 11_000).map((rule) => rule.id);
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules: enabled ? GEOIP_RULES : []
  });
}

async function recordAuditEvent(event) {
  const { auditEvents = [] } = await chrome.storage.local.get({ auditEvents: [] });
  auditEvents.unshift(event);
  await chrome.storage.local.set({ auditEvents: auditEvents.slice(0, 200) });
}

async function updateSettings(nextSettings = {}) {
  const settings = normalizeSettings({ ...(await chrome.storage.sync.get(DEFAULT_SETTINGS)), ...nextSettings });
  await chrome.storage.sync.set(settings);
  await applyNetworkShield(settings.networkShield);
  await refreshOpenTabs();
  return { ok: true, settings };
}

async function refreshOpenTabs() {
  const tabs = await chrome.tabs.query({});
  await Promise.allSettled(tabs.map(async (tab) => {
    if (!tab.id || !isInjectableUrl(tab.url)) return;
    try {
      await chrome.tabs.sendMessage(tab.id, { type: "MAINLANDER_REFRESH_SETTINGS" });
    } catch {
      await injectShield(tab.id);
    }
  }));
}

async function injectShield(tabId) {
  await chrome.scripting.executeScript({ target: { tabId }, files: ["main-world.js"], world: "MAIN" });
  await chrome.scripting.executeScript({ target: { tabId }, files: ["content-bridge.js"], world: "ISOLATED" });
}

function isInjectableUrl(url = "") {
  return /^(https?|file):/i.test(url);
}

async function getStatus() {
  const settings = normalizeSettings(await chrome.storage.sync.get(DEFAULT_SETTINGS));
  const { auditEvents = [] } = await chrome.storage.local.get({ auditEvents: [] });
  const dynamicRules = await chrome.declarativeNetRequest.getDynamicRules();
  return {
    ok: true,
    settings,
    auditCount: auditEvents.length,
    recentEvents: auditEvents.slice(0, 10),
    networkRuleCount: dynamicRules.filter((rule) => rule.id >= 10_000 && rule.id < 11_000).length
  };
}
