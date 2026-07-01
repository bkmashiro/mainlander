# Mainlander Shield

Mainlander Shield is a defensive Manifest V3 browser extension companion for the Mainlander detector. It reduces and audits high-risk fingerprint surfaces for privacy research.

## Install unpacked

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable Developer mode.
3. Click **Load unpacked**.
4. Select this `extension/` directory.

## What it does

- Injects page-visible hooks at `document_start` using `world: "MAIN"`.
- Applies a stable persona instead of per-call random values.
- Normalizes/audits selected JS-visible surfaces:
  - `navigator.language`, `navigator.languages`, `navigator.platform`, selected UA-CH high entropy fields
  - `Intl.DateTimeFormat` locale/timezone
  - `Date.prototype.getTimezoneOffset`
  - selected WebGL vendor/renderer/limit parameters
  - deterministic per-site canvas and audio farbling
  - optional WebRTC blocking
  - conservative Permissions API answers for high-risk permissions
  - optional generic/empty `mediaDevices.enumerateDevices()`
  - optional WebGPU hiding
- Stores recent audit events locally in `chrome.storage.local`.
- Can block known IP/GeoIP probe endpoints used by the demo through DNR dynamic rules.

## What it cannot do

- It cannot change your real public IP.
- It cannot change TLS / JA3 / HTTP2 / QUIC fingerprints.
- MV3 request-header rewriting is limited and not a complete network persona system.
- It cannot perfectly emulate OS, GPU driver, hardware, or browser engine behavior.
- It may break sites that require WebRTC, WebGPU, camera/microphone enumeration, or exact canvas/audio outputs.

## Privacy stance

The extension stores audit events locally only. It does not upload page content or audit logs. DNR blocking is local browser policy.

## Validation

From the repo root:

```bash
pnpm validate:extension
```

Then load the extension unpacked and visit the Mainlander demo. Use the page's **Shield demo** panel to trigger persona, canvas, WebGPU, WebRTC, permissions, and media-device probes.

## Design principle

Do not randomly spoof every call. Use a stable per-site/persona model. Inconsistent combinations such as UK IP + China timezone + US `Accept-Language` + SwiftShader GPU are more suspicious than a coherent common browser profile.
