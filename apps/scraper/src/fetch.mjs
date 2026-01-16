import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fetch } from "undici";

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

export async function fetchText(url, { cachePath } = {}) {
  if (cachePath && existsSync(cachePath)) {
    return readFileSync(cachePath, "utf-8");
  }

  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "accept-language": "es-ES,es;q=0.9,ca;q=0.8,en;q=0.7"
    }
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