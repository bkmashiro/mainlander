import "./styles.css";
import { countryLabel, runLocalDetector, runNetworkProbe, summarizeNetworkGeo, type DetectionReport, type NetworkProbeResult, type Signal } from "./detector.ts";
import { detectLocale, otherLocale, setDocumentLocale, t, type Locale } from "./i18n.ts";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app missing");

let locale: Locale = detectLocale();
setDocumentLocale(locale);

app.innerHTML = `
  <main class="shell">
    <section class="hero">
      <div class="topbar">
        <div class="eyebrow" data-i18n="eyebrow"></div>
        <button id="language" class="ghost"></button>
      </div>
      <h1 data-i18n="heroTitle"></h1>
      <p class="lede" data-i18n="lede"></p>
      <p class="fineprint" data-i18n="fineprint"></p>
    </section>

    <section id="summary" class="panel loading"></section>
    <section id="controls" class="panel controls">
      <div>
        <h2 data-i18n="controlTitle"></h2>
        <p class="subtle" data-i18n="controlNote"></p>
      </div>
      <div class="actions">
        <button id="rerun" class="primary"></button>
        <button id="network" class="secondary"></button>
      </div>
      <div id="network-output" class="network-output hidden"></div>
    </section>
    <section id="shield-demo" class="panel shield-demo">
      <div>
        <h2 data-i18n="shieldDemoTitle"></h2>
        <p class="subtle" data-i18n="shieldDemoNote"></p>
      </div>
      <button id="shield-run" class="secondary"></button>
      <div id="shield-output" class="shield-output hidden"></div>
    </section>
    <section class="panel open-source">
      <h2 data-i18n="openSourceTitle"></h2>
      <p class="subtle" data-i18n="openSourceNote"></p>
      <a href="https://github.com/bkmashiro/mainlander" target="_blank" rel="noreferrer">github.com/bkmashiro/mainlander</a>
    </section>
    <section id="contradictions" class="panel"></section>
    <section class="grid">
      <div id="scores" class="panel"></div>
      <div id="hashes" class="panel"></div>
    </section>
    <section id="signals" class="signals"></section>
    <section id="raw" class="panel raw"></section>
  </main>
`;

const rerunBtn = document.querySelector<HTMLButtonElement>("#rerun")!;
const networkBtn = document.querySelector<HTMLButtonElement>("#network")!;
const languageBtn = document.querySelector<HTMLButtonElement>("#language")!;
const shieldRunBtn = document.querySelector<HTMLButtonElement>("#shield-run")!;
const summaryEl = document.querySelector<HTMLElement>("#summary")!;
const contradictionsEl = document.querySelector<HTMLElement>("#contradictions")!;
const scoresEl = document.querySelector<HTMLElement>("#scores")!;
const hashesEl = document.querySelector<HTMLElement>("#hashes")!;
const signalsEl = document.querySelector<HTMLElement>("#signals")!;
const rawEl = document.querySelector<HTMLElement>("#raw")!;
const networkOutputEl = document.querySelector<HTMLElement>("#network-output")!;
const shieldOutputEl = document.querySelector<HTMLElement>("#shield-output")!;

let currentReport: DetectionReport | null = null;

renderShellText();

languageBtn.addEventListener("click", () => {
  locale = otherLocale(locale);
  setDocumentLocale(locale);
  renderShellText();
  if (currentReport) render(currentReport);
});

rerunBtn.addEventListener("click", () => runAndRender());
shieldRunBtn.addEventListener("click", async () => {
  shieldRunBtn.disabled = true;
  shieldRunBtn.textContent = t(locale, "shieldRunning");
  const results = await runShieldDemo();
  shieldOutputEl.innerHTML = shieldDemoBlock(results);
  shieldOutputEl.classList.remove("hidden");
  shieldRunBtn.disabled = false;
  shieldRunBtn.textContent = t(locale, "shieldRun");
});
networkBtn.addEventListener("click", async () => {
  networkBtn.disabled = true;
  networkBtn.textContent = t(locale, "probing");
  const results = await runNetworkProbe();
  if (currentReport) {
    currentReport.optionalNetwork = results;
    render(currentReport);
  } else {
    renderNetworkOnly(results);
  }
  networkOutputEl.classList.remove("hidden");
  networkBtn.disabled = false;
  networkBtn.textContent = t(locale, "network");
});

await runAndRender();

function renderShellText() {
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    if (key) node.textContent = t(locale, key);
  });
  rerunBtn.textContent = t(locale, "rerun");
  networkBtn.textContent = networkBtn.disabled ? t(locale, "probing") : t(locale, "network");
  shieldRunBtn.textContent = shieldRunBtn.disabled ? t(locale, "shieldRunning") : t(locale, "shieldRun");
  languageBtn.textContent = t(locale, "langSwitch");
}

async function runAndRender() {
  summaryEl.className = "panel loading";
  summaryEl.textContent = t(locale, "running");
  currentReport = await runLocalDetector();
  render(currentReport);
}

function render(report: DetectionReport) {
  const top = Object.entries(report.countryScores)[0];
  summaryEl.className = "panel summary";
  summaryEl.innerHTML = `
    <div>
      <div class="label">${escapeHtml(t(locale, "primaryGuess"))}</div>
      <div class="guess">${top ? escapeHtml(countryLabel(top[0])) : escapeHtml(t(locale, "noStrongGuess"))}</div>
      <div class="subtle">${escapeHtml(t(locale, "generated", { time: new Date(report.generatedAt).toLocaleString(locale === "zh" ? "zh-CN" : "en") }))}</div>
    </div>
    <div class="pill ${report.contradictions.length ? "warn" : "ok"}">${escapeHtml(t(locale, "signalSummary", { signals: report.signals.length, contradictions: report.contradictions.length }))}</div>
  `;

  contradictionsEl.innerHTML = `
    <h2>${escapeHtml(t(locale, "contradictions"))}</h2>
    ${report.contradictions.length ? `<ul>${report.contradictions.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>` : `<p class="subtle">${escapeHtml(t(locale, "noContradictions"))}</p>`}
  `;
  if (report.optionalNetwork) {
    networkOutputEl.innerHTML = networkBlock(report.optionalNetwork);
    networkOutputEl.classList.remove("hidden");
  }

  scoresEl.innerHTML = `
    <h2>${escapeHtml(t(locale, "countryScore"))}</h2>
    ${Object.entries(report.countryScores).length ? Object.entries(report.countryScores).map(([country, score]) => scoreRow(country, score, maxScore(report))).join("") : `<p class="subtle">${escapeHtml(t(locale, "noCountrySignalMatched"))}</p>`}
  `;

  hashesEl.innerHTML = `
    <h2>${escapeHtml(t(locale, "environmentHashes"))}</h2>
    ${Object.entries(report.hashes).map(([k, v]) => `<div class="kv"><span>${escapeHtml(k)}</span><code>${escapeHtml(v)}</code></div>`).join("")}
    <p class="subtle">${escapeHtml(t(locale, "hashNote"))}</p>
  `;

  signalsEl.innerHTML = report.signals.map(signalCard).join("");
  rawEl.innerHTML = `<h2>${escapeHtml(t(locale, "rawReport"))}</h2><pre>${escapeHtml(JSON.stringify(report, null, 2))}</pre>`;
}

function renderNetworkOnly(results: NetworkProbeResult[]) {
  networkOutputEl.innerHTML = networkBlock(results);
  networkOutputEl.classList.remove("hidden");
}

function networkBlock(results: NetworkProbeResult[]): string {
  const geo = summarizeNetworkGeo(results);
  return `
    <div class="network">
      <h3>${escapeHtml(t(locale, "networkProbes"))}</h3>
      <div class="geo-summary">
        <div class="label">${escapeHtml(t(locale, "geoConsensus"))}</div>
        ${geo.countryVotes.length ? geo.countryVotes.map((vote) => `
          <div class="score-row compact">
            <div><strong>${escapeHtml(vote.label)}</strong><span>${escapeHtml(t(locale, "geoVotes", { votes: vote.votes }))}</span></div>
            <p class="subtle">${escapeHtml(vote.providers.join(", "))}</p>
          </div>
        `).join("") : `<p class="subtle">${escapeHtml(t(locale, "noGeoConsensus"))}</p>`}
        ${geo.publicIps.length ? `<p class="subtle">${escapeHtml(t(locale, "publicIps"))}: ${escapeHtml(geo.publicIps.join(", "))}</p>` : ""}
      </div>
      ${results.map((result) => `
        <details class="probe" ${result.ok ? "open" : ""}>
          <summary>${escapeHtml(result.provider)} · ${escapeHtml(t(locale, result.ok ? "ok" : result.skipped ? "skipped" : "failed"))}</summary>
          <div class="subtle">${escapeHtml(result.endpoint)}</div>
          <pre>${escapeHtml(JSON.stringify(result.value ?? result.error, null, 2))}</pre>
        </details>
      `).join("")}
    </div>
  `;
}

function scoreRow(country: string, score: number, max: number): string {
  const pct = max > 0 ? Math.max(4, (score / max) * 100) : 0;
  return `
    <div class="score-row">
      <div><strong>${escapeHtml(countryLabel(country))}</strong><span>${score.toFixed(2)}</span></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
    </div>
  `;
}

function maxScore(report: DetectionReport): number {
  return Math.max(0, ...Object.values(report.countryScores));
}

function signalCard(signal: Signal): string {
  return `
    <article class="signal ${signal.level}">
      <header>
        <div>
          <div class="category">${escapeHtml(signal.category)}</div>
          <h3>${escapeHtml(signal.label)}</h3>
        </div>
        <div class="pill ${signal.level}">${signal.score.toFixed(2)}</div>
      </header>
      <p>${escapeHtml(signal.notes ?? "")}</p>
      <div class="countries">${signal.countries.length ? signal.countries.map((c) => `<span>${escapeHtml(countryLabel(c))}</span>`).join("") : `<span>${escapeHtml(t(locale, "noCountrySignal"))}</span>`}</div>
      <details>
        <summary>${escapeHtml(t(locale, "rawValue"))}</summary>
        <pre>${escapeHtml(JSON.stringify(signal.value, null, 2))}</pre>
      </details>
    </article>
  `;
}

type ShieldDemoResult = {
  label: string;
  status: "ok" | "warn" | "info";
  value: unknown;
  hint: string;
};

async function runShieldDemo(): Promise<ShieldDemoResult[]> {
  const results: ShieldDemoResult[] = [];
  results.push({
    label: "Navigator / Intl persona",
    status: "info",
    value: {
      language: navigator.language,
      languages: navigator.languages,
      platform: navigator.platform,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      numberLocale: Intl.NumberFormat().resolvedOptions().locale,
      collatorLocale: Intl.Collator().resolvedOptions().locale,
      timezoneOffset: new Date().getTimezoneOffset(),
    },
    hint: t(locale, "shieldPersonaHint"),
  });

  results.push({
    label: "Canvas deterministic farbling",
    status: "info",
    value: { sampleA: await canvasSample(), sampleB: await canvasSample() },
    hint: t(locale, "shieldCanvasHint"),
  });

  results.push({
    label: "WebGPU",
    status: "gpu" in navigator ? "warn" : "ok",
    value: { navigatorGpuPresent: "gpu" in navigator },
    hint: t(locale, "shieldWebGpuHint"),
  });

  results.push({
    label: "WebRTC",
    ...(await probeWebRtc()),
  });

  results.push({
    label: "Permissions API",
    ...(await probePermission()),
  });

  results.push({
    label: "MediaDevices",
    ...(await probeMediaDevices()),
  });

  return results;
}

function shieldDemoBlock(results: ShieldDemoResult[]): string {
  return `
    <div class="shield-results">
      <h3>${escapeHtml(t(locale, "shieldResults"))}</h3>
      ${results.map((result) => `
        <article class="shield-result ${result.status}">
          <div>
            <strong>${escapeHtml(result.label)}</strong>
            <p class="subtle">${escapeHtml(result.hint)}</p>
          </div>
          <pre>${escapeHtml(JSON.stringify(result.value, null, 2))}</pre>
        </article>
      `).join("")}
      <p class="subtle">${escapeHtml(t(locale, "shieldInstallHint"))}</p>
    </div>
  `;
}

async function canvasSample(): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 180;
  canvas.height = 42;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "no-2d-context";
  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fbbf24";
  ctx.font = "18px sans-serif";
  ctx.fillText("mainlander 🛡️ 乡", 12, 27);
  const bytes = new TextEncoder().encode(canvas.toDataURL());
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].slice(0, 10).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function probeWebRtc(): Promise<Omit<ShieldDemoResult, "label">> {
  try {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.close();
    return { status: "warn", value: { created: true }, hint: t(locale, "shieldWebRtcOpen") };
  } catch (error) {
    return { status: "ok", value: { blocked: true, error: String(error) }, hint: t(locale, "shieldWebRtcBlocked") };
  }
}

async function probePermission(): Promise<Omit<ShieldDemoResult, "label">> {
  try {
    const result = await navigator.permissions?.query({ name: "geolocation" as PermissionName });
    return { status: result?.state === "prompt" ? "ok" : "info", value: { geolocation: result?.state ?? "unsupported" }, hint: t(locale, "shieldPermissionHint") };
  } catch (error) {
    return { status: "info", value: { error: String(error) }, hint: t(locale, "shieldPermissionHint") };
  }
}

async function probeMediaDevices(): Promise<Omit<ShieldDemoResult, "label">> {
  try {
    const devices = await navigator.mediaDevices?.enumerateDevices();
    return { status: devices?.length === 0 ? "ok" : "info", value: { count: devices?.length ?? "unsupported", kinds: devices?.map((device) => device.kind) ?? [] }, hint: t(locale, "shieldMediaHint") };
  } catch (error) {
    return { status: "ok", value: { error: String(error) }, hint: t(locale, "shieldMediaHint") };
  }
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
