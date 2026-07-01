import "./styles.css";
import { countryLabel, runLocalDetector, runNetworkProbe, type DetectionReport, type NetworkProbeResult, type Signal } from "./detector.ts";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app missing");

app.innerHTML = `
  <main class="shell">
    <section class="hero">
      <div class="eyebrow">MAINLANDER LAB</div>
      <h1>Browser country fingerprint detector</h1>
      <p class="lede">A static-first lab for the sharpest spear: locale, timezone, rendering, device, privacy, and optional network signals.</p>
      <div class="actions">
        <button id="rerun" class="primary">Run local detector</button>
        <button id="network" class="secondary">Optional IP probe</button>
      </div>
      <p class="fineprint">Local detector runs fully in this browser. IP/country from network cannot be checked by static frontend unless you call a third-party endpoint.</p>
    </section>

    <section id="summary" class="panel loading">Running detector…</section>
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
const summaryEl = document.querySelector<HTMLElement>("#summary")!;
const contradictionsEl = document.querySelector<HTMLElement>("#contradictions")!;
const scoresEl = document.querySelector<HTMLElement>("#scores")!;
const hashesEl = document.querySelector<HTMLElement>("#hashes")!;
const signalsEl = document.querySelector<HTMLElement>("#signals")!;
const rawEl = document.querySelector<HTMLElement>("#raw")!;

let currentReport: DetectionReport | null = null;

rerunBtn.addEventListener("click", () => runAndRender());
networkBtn.addEventListener("click", async () => {
  networkBtn.disabled = true;
  networkBtn.textContent = "Probing…";
  const result = await runNetworkProbe();
  if (currentReport) {
    currentReport.optionalNetwork = result;
    render(currentReport);
  } else {
    renderNetworkOnly(result);
  }
  networkBtn.disabled = false;
  networkBtn.textContent = "Optional IP probe";
});

await runAndRender();

async function runAndRender() {
  summaryEl.className = "panel loading";
  summaryEl.textContent = "Running detector…";
  currentReport = await runLocalDetector();
  render(currentReport);
}

function render(report: DetectionReport) {
  const top = Object.entries(report.countryScores)[0];
  summaryEl.className = "panel summary";
  summaryEl.innerHTML = `
    <div>
      <div class="label">Primary guess</div>
      <div class="guess">${top ? escapeHtml(countryLabel(top[0])) : "No strong country guess"}</div>
      <div class="subtle">Generated ${escapeHtml(new Date(report.generatedAt).toLocaleString())}</div>
    </div>
    <div class="pill ${report.contradictions.length ? "warn" : "ok"}">${report.signals.length} signals · ${report.contradictions.length} contradictions</div>
  `;

  contradictionsEl.innerHTML = `
    <h2>Contradictions</h2>
    ${report.contradictions.length ? `<ul>${report.contradictions.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>` : `<p class="subtle">No obvious cross-signal contradiction detected.</p>`}
    ${report.optionalNetwork ? networkBlock(report.optionalNetwork) : `<p class="subtle">Network/IP probe is disabled until clicked.</p>`}
  `;

  scoresEl.innerHTML = `
    <h2>Country score</h2>
    ${Object.entries(report.countryScores).length ? Object.entries(report.countryScores).map(([country, score]) => scoreRow(country, score, maxScore(report))).join("") : `<p class="subtle">No country-weighted signal matched.</p>`}
  `;

  hashesEl.innerHTML = `
    <h2>Environment hashes</h2>
    ${Object.entries(report.hashes).map(([k, v]) => `<div class="kv"><span>${escapeHtml(k)}</span><code>${escapeHtml(v)}</code></div>`).join("")}
    <p class="subtle">Hashes are consistency probes, not country proof.</p>
  `;

  signalsEl.innerHTML = report.signals.map(signalCard).join("");
  rawEl.innerHTML = `<h2>Raw report</h2><pre>${escapeHtml(JSON.stringify(report, null, 2))}</pre>`;
}

function renderNetworkOnly(result: NetworkProbeResult) {
  contradictionsEl.innerHTML = networkBlock(result);
}

function networkBlock(result: NetworkProbeResult): string {
  return `
    <div class="network ${result.ok ? "" : "error"}">
      <h3>Optional network probe · ${escapeHtml(result.provider)}</h3>
      <pre>${escapeHtml(JSON.stringify(result.value ?? result.error, null, 2))}</pre>
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
      <div class="countries">${signal.countries.length ? signal.countries.map((c) => `<span>${escapeHtml(countryLabel(c))}</span>`).join("") : `<span>no country signal</span>`}</div>
      <details>
        <summary>raw value</summary>
        <pre>${escapeHtml(JSON.stringify(signal.value, null, 2))}</pre>
      </details>
    </article>
  `;
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
