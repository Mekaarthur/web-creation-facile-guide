import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, existsSync } from "fs";

// Charger .env.local depuis la racine du projet (deux niveaux au-dessus de scripts/mcp-gsc/)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../../.env.local");
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key && !process.env[key]) process.env[key] = value;
  }
}

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { google } from "googleapis";

// ── Credentials ──────────────────────────────────────────────────────────────

const GSC_CLIENT_ID     = process.env.GSC_CLIENT_ID;
const GSC_CLIENT_SECRET = process.env.GSC_CLIENT_SECRET;
const GSC_REFRESH_TOKEN = process.env.GSC_REFRESH_TOKEN;
const GSC_SITE_URL      = process.env.GSC_SITE_URL || "sc-domain:bikawo.com";

if (!GSC_CLIENT_ID || !GSC_CLIENT_SECRET || !GSC_REFRESH_TOKEN) {
  process.stderr.write(
    "[mcp-gsc] ERREUR : credentials manquants. Copie .env.local.example en .env.local et remplis GSC_CLIENT_ID, GSC_CLIENT_SECRET, GSC_REFRESH_TOKEN.\n"
  );
  process.exit(1);
}

// ── Auth Google ───────────────────────────────────────────────────────────────

function getAuth() {
  const auth = new google.auth.OAuth2(GSC_CLIENT_ID, GSC_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: GSC_REFRESH_TOKEN });
  return auth;
}

function gscClient() {
  return google.searchconsole({ version: "v1", auth: getAuth() });
}

// ── Helpers dates ─────────────────────────────────────────────────────────────

function isoDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

// ── Requêtes GSC ─────────────────────────────────────────────────────────────

async function querySearchAnalytics(requestBody) {
  const client = gscClient();
  const res = await client.searchanalytics.query({
    siteUrl: GSC_SITE_URL,
    requestBody,
  });
  return res.data.rows || [];
}

// ── Outils MCP ────────────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "gsc_performance_summary",
    description:
      "Résumé des performances du site sur les 28 derniers jours : clics totaux, impressions, CTR moyen, position moyenne.",
    inputSchema: {
      type: "object",
      properties: {
        days: {
          type: "number",
          description: "Nombre de jours à analyser (défaut : 28).",
        },
      },
    },
  },
  {
    name: "gsc_top_pages",
    description:
      "Top N pages par clics sur la période. Utile pour identifier les pages les plus performantes.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Nombre de pages à retourner (défaut : 20)." },
        days:  { type: "number", description: "Nombre de jours (défaut : 28)." },
        sortBy: {
          type: "string",
          enum: ["clicks", "impressions", "position"],
          description: "Critère de tri (défaut : clicks).",
        },
      },
    },
  },
  {
    name: "gsc_low_ctr_queries",
    description:
      "Requêtes avec une bonne position (≤ 20) mais un CTR faible (< seuil). Ce sont les opportunités de rewrite de meta tags.",
    inputSchema: {
      type: "object",
      properties: {
        maxPosition:  { type: "number", description: "Position max à considérer (défaut : 20)." },
        maxCtr:       { type: "number", description: "CTR max en % (défaut : 3)." },
        minImpressions: { type: "number", description: "Impressions minimum pour filtrer le bruit (défaut : 50)." },
        days:         { type: "number", description: "Nombre de jours (défaut : 28)." },
        limit:        { type: "number", description: "Nombre de résultats (défaut : 25)." },
      },
    },
  },
  {
    name: "gsc_page_queries",
    description:
      "Toutes les requêtes qui envoient du trafic vers une URL spécifique, avec clics, impressions, CTR et position.",
    inputSchema: {
      type: "object",
      required: ["page"],
      properties: {
        page: { type: "string", description: "URL complète de la page (ex: https://bikawo.com/bika-kids)." },
        days: { type: "number", description: "Nombre de jours (défaut : 28)." },
        limit: { type: "number", description: "Nombre de résultats (défaut : 20)." },
      },
    },
  },
  {
    name: "gsc_declining_pages",
    description:
      "Pages qui perdent des clics entre deux périodes consécutives. Utile pour détecter les contenus en recul.",
    inputSchema: {
      type: "object",
      properties: {
        periodDays: { type: "number", description: "Durée de chaque période en jours (défaut : 28)." },
        minDrop:    { type: "number", description: "Baisse minimale en % pour apparaître (défaut : 15)." },
        limit:      { type: "number", description: "Nombre de résultats (défaut : 20)." },
      },
    },
  },
  {
    name: "gsc_zero_click_pages",
    description:
      "Pages indexées (impressions > 0) mais sans aucun clic sur la période. Candidates au rewrite de meta ou à la suppression.",
    inputSchema: {
      type: "object",
      properties: {
        days:           { type: "number", description: "Nombre de jours (défaut : 28)." },
        minImpressions: { type: "number", description: "Impressions minimum (défaut : 10)." },
        limit:          { type: "number", description: "Nombre de résultats (défaut : 30)." },
      },
    },
  },
];

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handlePerformanceSummary({ days = 28 }) {
  const rows = await querySearchAnalytics({
    startDate: isoDate(-days),
    endDate:   isoDate(-1),
    dimensions: [],
    rowLimit:   1,
  });
  if (!rows.length) return "Aucune donnée disponible pour cette période.";
  const r = rows[0];
  return JSON.stringify({
    site:        GSC_SITE_URL,
    periode:     `${isoDate(-days)} → ${isoDate(-1)}`,
    clics:       r.clicks,
    impressions: r.impressions,
    ctr_pct:     ((r.ctr || 0) * 100).toFixed(2),
    position_moy: (r.position || 0).toFixed(1),
  }, null, 2);
}

async function handleTopPages({ limit = 20, days = 28, sortBy = "clicks" }) {
  const rows = await querySearchAnalytics({
    startDate:  isoDate(-days),
    endDate:    isoDate(-1),
    dimensions: ["page"],
    rowLimit:   limit,
    orderBy:    [{ fieldName: sortBy, sortOrder: "DESCENDING" }],
  });
  const data = rows.map(r => ({
    page:        r.keys[0],
    clics:       r.clicks,
    impressions: r.impressions,
    ctr_pct:     ((r.ctr || 0) * 100).toFixed(2),
    position:    (r.position || 0).toFixed(1),
  }));
  return JSON.stringify(data, null, 2);
}

async function handleLowCtrQueries({ maxPosition = 20, maxCtr = 3, minImpressions = 50, days = 28, limit = 25 }) {
  const rows = await querySearchAnalytics({
    startDate:  isoDate(-days),
    endDate:    isoDate(-1),
    dimensions: ["query"],
    rowLimit:   500,
    dimensionFilterGroups: [{
      filters: [{
        dimension: "query",
        operator:  "notContains",
        expression: "bikawo",
      }],
    }],
  });
  const filtered = rows
    .filter(r => r.position <= maxPosition && (r.ctr * 100) < maxCtr && r.impressions >= minImpressions)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit)
    .map(r => ({
      requete:     r.keys[0],
      position:    (r.position || 0).toFixed(1),
      ctr_pct:     ((r.ctr || 0) * 100).toFixed(2),
      impressions: r.impressions,
      clics:       r.clicks,
      opportunite: r.impressions > 200 ? "🔥 HAUTE" : r.impressions > 100 ? "⚡ MOYENNE" : "📌 FAIBLE",
    }));
  return JSON.stringify(filtered, null, 2);
}

async function handlePageQueries({ page, days = 28, limit = 20 }) {
  const rows = await querySearchAnalytics({
    startDate:  isoDate(-days),
    endDate:    isoDate(-1),
    dimensions: ["query"],
    rowLimit:   limit,
    dimensionFilterGroups: [{
      filters: [{ dimension: "page", operator: "equals", expression: page }],
    }],
    orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }],
  });
  const data = rows.map(r => ({
    requete:     r.keys[0],
    clics:       r.clicks,
    impressions: r.impressions,
    ctr_pct:     ((r.ctr || 0) * 100).toFixed(2),
    position:    (r.position || 0).toFixed(1),
  }));
  return JSON.stringify({ page, data }, null, 2);
}

async function handleDecliningPages({ periodDays = 28, minDrop = 15, limit = 20 }) {
  const [rowsNew, rowsOld] = await Promise.all([
    querySearchAnalytics({
      startDate:  isoDate(-periodDays),
      endDate:    isoDate(-1),
      dimensions: ["page"],
      rowLimit:   200,
    }),
    querySearchAnalytics({
      startDate:  isoDate(-periodDays * 2),
      endDate:    isoDate(-periodDays - 1),
      dimensions: ["page"],
      rowLimit:   200,
    }),
  ]);

  const oldMap = new Map(rowsOld.map(r => [r.keys[0], r.clicks]));
  const declining = rowsNew
    .map(r => {
      const page      = r.keys[0];
      const clicksNow = r.clicks;
      const clicksOld = oldMap.get(page) || 0;
      if (!clicksOld) return null;
      const dropPct = ((clicksOld - clicksNow) / clicksOld) * 100;
      return dropPct >= minDrop ? { page, clicksOld, clicksNow, baisse_pct: dropPct.toFixed(1) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.baisse_pct - a.baisse_pct)
    .slice(0, limit);

  return JSON.stringify(declining, null, 2);
}

async function handleZeroClickPages({ days = 28, minImpressions = 10, limit = 30 }) {
  const rows = await querySearchAnalytics({
    startDate:  isoDate(-days),
    endDate:    isoDate(-1),
    dimensions: ["page"],
    rowLimit:   500,
  });
  const data = rows
    .filter(r => r.clicks === 0 && r.impressions >= minImpressions)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit)
    .map(r => ({
      page:        r.keys[0],
      impressions: r.impressions,
      position:    (r.position || 0).toFixed(1),
    }));
  return JSON.stringify(data, null, 2);
}

// ── Serveur MCP ───────────────────────────────────────────────────────────────

const server = new Server(
  { name: "gsc-bikawo", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  try {
    let text;
    switch (name) {
      case "gsc_performance_summary": text = await handlePerformanceSummary(args); break;
      case "gsc_top_pages":           text = await handleTopPages(args);            break;
      case "gsc_low_ctr_queries":     text = await handleLowCtrQueries(args);       break;
      case "gsc_page_queries":        text = await handlePageQueries(args);         break;
      case "gsc_declining_pages":     text = await handleDecliningPages(args);      break;
      case "gsc_zero_click_pages":    text = await handleZeroClickPages(args);      break;
      default: throw new Error(`Outil inconnu : ${name}`);
    }
    return { content: [{ type: "text", text }] };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Erreur : ${err.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
