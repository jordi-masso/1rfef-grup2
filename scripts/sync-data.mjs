import { mkdirSync, readdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const srcDir = join(process.cwd(), "data");
const dstDir = join(process.cwd(), "apps", "web", "public", "data");

mkdirSync(dstDir, { recursive: true });

const files = readdirSync(srcDir).filter((f) => f.endsWith(".json"));

if (files.length === 0) {
  console.log("No JSON files found in /data");
  process.exit(0);
}

for (const file of files) {
  copyFileSync(join(srcDir, file), join(dstDir, file));
  console.log(`Copied ${file} -> apps/web/public/data/${file}`);
}

