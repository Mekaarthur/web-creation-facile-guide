#!/usr/bin/env node
/**
 * PostToolUse hook — auto-format after Edit/Write
 * Receives tool context on stdin as JSON.
 * Runs Prettier then ESLint --fix on the modified file.
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { resolve, extname } from "path";
import { readFileSync } from "fs";

const PRETTIER_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".json"]);
const ESLINT_EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const SKIP_PATTERNS = [/node_modules/, /dist\//, /public\//, /\.min\./];

function shouldSkip(filePath) {
  return SKIP_PATTERNS.some((re) => re.test(filePath));
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let filePath;
  try {
    const ctx = JSON.parse(raw);
    filePath = ctx?.tool_input?.file_path;
  } catch {
    process.exit(0);
  }

  if (!filePath) process.exit(0);

  const abs = resolve(filePath);
  const ext = extname(abs);

  if (shouldSkip(abs) || !existsSync(abs)) process.exit(0);

  const root = resolve(".");
  const prettier = resolve(root, "node_modules/.bin/prettier");
  const eslint = resolve(root, "node_modules/.bin/eslint");

  if (PRETTIER_EXTS.has(ext) && existsSync(prettier)) {
    try {
      execSync(`"${prettier}" --write "${abs}"`, { stdio: "pipe" });
    } catch {
      // ne pas bloquer si Prettier échoue
    }
  }

  if (ESLINT_EXTS.has(ext) && existsSync(eslint)) {
    try {
      execSync(`"${eslint}" --fix "${abs}"`, { stdio: "pipe" });
    } catch {
      // ne pas bloquer si ESLint signale des erreurs non auto-fixables
    }
  }

  process.exit(0);
});
