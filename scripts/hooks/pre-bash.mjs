#!/usr/bin/env node
/**
 * PreToolUse hook — block destructive Bash commands
 * Receives tool context on stdin as JSON.
 * Exit 1 + message → Claude Code blocks the command.
 * Exit 0 → command runs normally.
 */

const ALLOWED_RM = [
  /rm\s+-[rf]+\s+(["']?)node_modules\1\s*$/,
  /rm\s+-[rf]+\s+(["']?)dist\1\s*$/,
  /rm\s+-[rf]+\s+(["']?)\.next\1\s*$/,
  /rm\s+-[rf]+\s+(["']?)coverage\1\s*$/,
  /rm\s+-[rf]+\s+\/tmp\//,
  /rm\s+-[rf]+\s+\/var\/folders\//,
];

const BLOCKED = [
  {
    pattern: /rm\s+-[^\s]*r[^\s]*f|rm\s+-[^\s]*f[^\s]*r/i,
    reason: "rm -rf détecté — vérifie la cible avant d'exécuter",
    allowIf: ALLOWED_RM,
  },
  {
    pattern: />\s*\/etc\//,
    reason: "Écriture dans /etc/ bloquée",
  },
  {
    pattern: /chmod\s+[0-9]*7[0-9][0-9]\b|chmod\s+[0-9]*[0-9]7[0-9]\b|chmod\s+[0-9]*[0-9][0-9]7\b/,
    reason: "chmod avec permissions trop larges (777/775/…) bloqué",
  },
  {
    pattern: /git\s+push\s+(--force|-f)\b/,
    reason: "git push --force bloqué — utilise --force-with-lease ou confirme manuellement",
  },
  {
    pattern: /git\s+push\s+[^\n]*\bmain\b.*--force|git\s+push\s+[^\n]*\bmaster\b.*--force/i,
    reason: "Force-push vers main/master bloqué",
  },
  {
    pattern: /DROP\s+TABLE/i,
    reason: "DROP TABLE bloqué — opération irréversible",
  },
  {
    pattern: /DELETE\s+FROM\s+\w+\s*;/i,
    reason: "DELETE sans clause WHERE bloqué",
  },
  {
    pattern: /supabase\s+db\s+reset/i,
    reason: "supabase db reset bloqué — efface toute la base",
  },
  {
    pattern: /npx\s+prisma\s+migrate\s+reset/i,
    reason: "prisma migrate reset bloqué — efface toute la base",
  },
  {
    pattern: /truncate\s+table/i,
    reason: "TRUNCATE TABLE bloqué — opération irréversible",
  },
];

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let command = "";
  try {
    const ctx = JSON.parse(raw);
    command = ctx?.tool_input?.command ?? "";
  } catch {
    process.exit(0);
  }

  if (!command) process.exit(0);

  for (const rule of BLOCKED) {
    if (!rule.pattern.test(command)) continue;

    // Vérifier les exceptions autorisées
    if (rule.allowIf?.some((allowed) => allowed.test(command))) continue;

    process.stderr.write(`\n🚫 BLOQUÉ : ${rule.reason}\n   Commande : ${command.slice(0, 120)}\n\n`);
    process.exit(1);
  }

  process.exit(0);
});
