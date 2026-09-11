#!/usr/bin/env node
// Validate authored sources with the same KaTeX dependency as the lesson renderer.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "frontend/package.json"));
const katex = require("katex");
const selected = new Set(process.argv.slice(2).map(Number));
const vault = path.join(root, "content/vault/10 Знания/DataPath v2");
const errors = [];
let lessons = 0;
let formulas = 0;

for (const directory of fs.readdirSync(vault).sort()) {
  const folder = path.join(vault, directory);
  if (!fs.statSync(folder).isDirectory()) continue;
  for (const name of fs.readdirSync(folder).sort()) {
    const number = Number(name.match(/^source-(\d+)/)?.[1]);
    if (!number || (selected.size && !selected.has(number))) continue;
    lessons += 1;
    const source = fs.readFileSync(path.join(folder, name), "utf8");
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(source)) {
      errors.push({
        lesson: number,
        error: "Unexpected control character in Markdown",
      });
    }
    const prose = source
      .replace(/^---\n[\s\S]*?\n---\n/, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]*`/g, "");
    const math =
      /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|\$([^$\n]+)\$/g;
    const outsideMath = prose.replace(
      math,
      (match, display, brackets, inline, dollars) => {
        const value = display ?? brackets ?? inline ?? dollars;
        try {
          katex.renderToString(value, { throwOnError: true, strict: "error" });
          formulas += 1;
        } catch (error) {
          errors.push({
            lesson: number,
            formula: value.trim(),
            error: error.message,
          });
        }
        return "";
      },
    );
    if (
      /\\(?:frac|cdot|times|sqrt|sum|partial|mathbb|sigma|mu|alpha|beta)\b/u.test(
        outsideMath,
      )
    ) {
      errors.push({
        lesson: number,
        error: "LaTeX command outside math delimiters",
      });
    }
  }
}

console.log(JSON.stringify({ lessons, formulas, errors }, null, 2));
process.exitCode = errors.length ? 1 : 0;
