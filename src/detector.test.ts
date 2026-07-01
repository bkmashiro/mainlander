import { describe, expect, it } from "vitest";
import { classifyMarketAppHints, countryLabel, summarizeNetworkGeo, type NetworkProbeResult } from "./index";

describe("public library API", () => {
  it("labels known countries without hiding the ISO code", () => {
    expect(countryLabel("CN")).toBe("CN · Mainland China");
    expect(countryLabel("ZZ")).toBe("ZZ");
  });

  it("summarizes GeoIP country consensus from heterogeneous providers", () => {
    const probes: NetworkProbeResult[] = [
      { ok: true, provider: "Cloudflare trace", endpoint: "https://www.cloudflare.com/cdn-cgi/trace", value: { ip: "203.0.113.9", loc: "GB" } },
      { ok: true, provider: "ipapi.co", endpoint: "https://ipapi.co/json/", value: { ip: "203.0.113.9", country: "GB", country_name: "United Kingdom", asn: "AS64500" } },
      { ok: true, provider: "freeipapi.com", endpoint: "https://freeipapi.com/api/json", value: { ipAddress: "203.0.113.9", countryCode: "FR", countryName: "France" } },
      { ok: false, provider: "blocked", endpoint: "https://example.invalid", error: "blocked" },
    ];

    expect(summarizeNetworkGeo(probes)).toEqual({
      publicIps: ["203.0.113.9"],
      countryVotes: [
        { country: "GB", label: "GB · United Kingdom", votes: 2, providers: ["Cloudflare trace", "ipapi.co"] },
        { country: "FR", label: "FR · France", votes: 1, providers: ["freeipapi.com"] },
      ],
      providerCount: 4,
      okCount: 3,
      failedCount: 1,
      topCountry: "GB",
    });
  });

  it("classifies country-market app and embedded browser hints", () => {
    expect(classifyMarketAppHints("Mozilla/5.0 MicroMessenger/8.0.48 miniProgram NetType/WIFI")).toEqual([
      { country: "CN", family: "WeChat embedded browser", token: "MicroMessenger", confidence: 2.5 },
      { country: "CN", family: "WeChat mini program", token: "miniProgram", confidence: 2 },
    ]);
    expect(classifyMarketAppHints("Mozilla/5.0 Line/14.0 KAKAOTALK 10.2").map((hit) => hit.country).sort()).toEqual(["JP", "KR"]);
    expect(classifyMarketAppHints("Mozilla/5.0 Chrome/120 Safari/537.36")).toEqual([]);
  });
});
