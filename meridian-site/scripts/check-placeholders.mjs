// Runs before `npm run build`. Warns (never fails) about events still on a
// placeholder date, and counts the other SCREAMING_SNAKE placeholders left.
import { readFileSync, readdirSync } from "node:fs";

const events = readFileSync(new URL("../content/events.ts", import.meta.url), "utf8");
const blocks = events.split(/\n\s*\{\s*\n/).slice(1);
const undated = blocks
  .filter((b) => /date:\s*"DATE_HERE"/.test(b))
  .map((b) => (b.match(/id:\s*"([^"]+)"/) ?? [])[1] ?? "(no id)");

const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
if (undated.length) {
  console.warn(yellow("\n!!! events with a placeholder date (DATE_HERE) !!!"));
  for (const id of undated) console.warn(yellow(`    - ${id}`));
  console.warn(yellow("    these show on /past-shows with no date until fixed.\n"));
} else {
  console.log("placeholder check: no events on DATE_HERE.");
}

const counts = {};
for (const file of readdirSync(new URL("../content/", import.meta.url))) {
  const text = readFileSync(new URL(`../content/${file}`, import.meta.url), "utf8");
  for (const [m] of text.matchAll(/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_(?:HERE|CONFIRM)\b/g)) {
    counts[m] = (counts[m] ?? 0) + 1;
  }
}
const left = Object.entries(counts).map(([k, v]) => `${k} x${v}`).join(", ");
if (left) console.warn(yellow(`placeholders still in /content: ${left}\n`));
