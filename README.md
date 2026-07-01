# mainlander

Browser country/region fingerprint detector lab: a static-first demo for comparing locale, timezone, rendering, device, and optional network signals.

## Scope

- **Static/local detector:** runs fully in the browser and does not require a backend.
- **Optional network probe:** can call public endpoints to reveal what a third-party service sees, including IP-derived country. This is strictly user-initiated: no IP/geolocation endpoint is contacted until the user clicks the probe button.
- **No uploads:** local detector results are rendered in the browser and are not uploaded anywhere by this app.
- **Research/demo only:** signals are heuristic and should not be used as sole proof of nationality, residence, or eligibility.

Source code: <https://github.com/bkmashiro/mainlander>

## Library usage

The detector is also packaged as a browser-oriented npm library.

```bash
npm install mainlander
```

```ts
import {
  countryLabel,
  runLocalDetector,
  runNetworkProbe,
  summarizeNetworkGeo,
} from "mainlander";

const report = await runLocalDetector();
console.log(report.primaryCountryGuess, report.countryScores);

// Only call this after explicit user consent/click.
const network = await runNetworkProbe();
console.log(summarizeNetworkGeo(network));
console.log(countryLabel("GB")); // GB · United Kingdom
```

`runLocalDetector()` touches browser fingerprinting surfaces only inside the current page. `runNetworkProbe()` performs third-party requests and should stay behind an explicit click/consent gate.

## Development

```bash
pnpm install
pnpm dev
pnpm build
```

## Current detector modules

- Navigator language/platform/user-agent
- Intl locale/timezone/number/date/collator
- Date timezone offset
- Screen and device characteristics
- Canvas text/canvas hash
- Emoji rendering probe
- Font availability probe
- WebGL vendor/renderer/limits
- AudioContext fingerprint
- Storage quota
- WebRTC candidate probe
- Optional IP API probe
