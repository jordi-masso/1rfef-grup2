import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { fetch } from "undici";

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

export async function fetchText(url, { cachePath } = {}) {
  const noCache = process.env.NO_CACHE === "true";

  if (!noCache && cachePath && existsSync(cachePath)) {
    return readFileSync(cachePath, "utf-8");
  }

  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "accept-language": "ca-ES,ca;q=0.9,es-ES;q=0.8,es;q=0.7,en;q=0.6",
      "referer": "https://www.transfermarkt.com/",
      "connection": "keep-alive",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }

  const text = await res.text();

  if (cachePath) {
    ensureDir(dirname(cachePath));
    writeFileSync(cachePath, text, "utf-8");
  }

  return text;
}