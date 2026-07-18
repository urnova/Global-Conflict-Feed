"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  alerts: () => alerts,
  apiKeys: () => apiKeys,
  briefings: () => briefings,
  insertAlertSchema: () => insertAlertSchema,
  insertApiKeySchema: () => insertApiKeySchema
});
var import_pg_core, import_drizzle_zod, alerts, briefings, apiKeys, insertAlertSchema, insertApiKeySchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    import_pg_core = require("drizzle-orm/pg-core");
    import_drizzle_zod = require("drizzle-zod");
    alerts = (0, import_pg_core.pgTable)("alerts", {
      id: (0, import_pg_core.serial)("id").primaryKey(),
      title: (0, import_pg_core.text)("title").notNull(),
      description: (0, import_pg_core.text)("description").notNull(),
      lat: (0, import_pg_core.text)("lat").notNull(),
      lng: (0, import_pg_core.text)("lng").notNull(),
      country: (0, import_pg_core.text)("country"),
      countryCode: (0, import_pg_core.text)("country_code"),
      source: (0, import_pg_core.text)("source"),
      type: (0, import_pg_core.text)("type").notNull(),
      // see types above
      category: (0, import_pg_core.text)("category"),
      // MILITARY | POLITICAL | HUMANITARIAN | GEOPOLITICAL
      sourceType: (0, import_pg_core.text)("source_type"),
      // GDELT | RSS | FIRMS | TELEGRAM | MANUAL
      severity: (0, import_pg_core.text)("severity").notNull(),
      // low | medium | high | critical
      status: (0, import_pg_core.text)("status").notNull().default("active"),
      // active | resolved
      // Origin coordinates — where the missile/strike was LAUNCHED FROM (aggressor position)
      originLat: (0, import_pg_core.text)("origin_lat"),
      // nullable — only set for missile/airstrike
      originLng: (0, import_pg_core.text)("origin_lng"),
      // nullable
      timestamp: (0, import_pg_core.timestamp)("timestamp").defaultNow(),
      // Ferrari V3 fields
      fingerprint: (0, import_pg_core.text)("fingerprint").unique(),
      // SHA-256 for persistent dedup
      severityScore: (0, import_pg_core.integer)("severity_score").default(1),
      // 1-10 granular score
      isActive: (0, import_pg_core.boolean)("is_active").default(true),
      eventStart: (0, import_pg_core.timestamp)("event_start"),
      // actual event time (from pubDate / fetch time)
      // V4 — AI verification
      aiVerified: (0, import_pg_core.boolean)("ai_verified"),
      // null=pending, true=confirmed, false=filtered
      aiLabel: (0, import_pg_core.text)("ai_label")
      // French AI-generated label e.g. "Frappe aérienne au Liban"
    });
    briefings = (0, import_pg_core.pgTable)("briefings", {
      id: (0, import_pg_core.serial)("id").primaryKey(),
      text: (0, import_pg_core.text)("text").notNull(),
      // Texte markdown du briefing
      generatedAt: (0, import_pg_core.timestamp)("generated_at").defaultNow(),
      alertCount: (0, import_pg_core.integer)("alert_count").default(0),
      topCountries: (0, import_pg_core.text)("top_countries")
      // JSON stringified string[]
    });
    apiKeys = (0, import_pg_core.pgTable)("api_keys", {
      id: (0, import_pg_core.serial)("id").primaryKey(),
      key: (0, import_pg_core.text)("key").notNull().unique(),
      name: (0, import_pg_core.text)("name").notNull(),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
    });
    insertAlertSchema = (0, import_drizzle_zod.createInsertSchema)(alerts).omit({ id: true, timestamp: true });
    insertApiKeySchema = (0, import_drizzle_zod.createInsertSchema)(apiKeys).omit({ id: true, createdAt: true });
  }
});

// server/db.ts
async function runMigrations() {
  let client;
  try {
    client = await pool.connect();
  } catch (connErr) {
    console.error("[db] Cannot connect to database \u2014 migrations skipped:", connErr);
    return;
  }
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "alerts" (
        "id"           SERIAL PRIMARY KEY,
        "title"        TEXT NOT NULL,
        "description"  TEXT NOT NULL,
        "lat"          TEXT NOT NULL,
        "lng"          TEXT NOT NULL,
        "country"      TEXT,
        "country_code" TEXT,
        "source"       TEXT,
        "type"         TEXT NOT NULL DEFAULT 'conflict',
        "category"     TEXT,
        "source_type"  TEXT,
        "severity"     TEXT NOT NULL DEFAULT 'medium',
        "status"       TEXT NOT NULL DEFAULT 'active',
        "timestamp"    TIMESTAMP DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "api_keys" (
        "id"         SERIAL PRIMARY KEY,
        "name"       TEXT NOT NULL,
        "key"        TEXT NOT NULL UNIQUE,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);
    const addCols = [
      // Timestamps
      `ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "timestamp"    TIMESTAMP DEFAULT NOW()`,
      `ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "event_start"  TIMESTAMP`,
      // Geo origin (for missile arcs) — TEXT to match schema
      `ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "origin_lat"   TEXT`,
      `ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "origin_lng"   TEXT`,
      // Dedup + scoring
      `ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "fingerprint"  TEXT UNIQUE`,
      `ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "severity_score" INTEGER DEFAULT 1`,
      `ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "is_active"    BOOLEAN DEFAULT TRUE`,
      // V4 — AI verification
      `ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "ai_verified"  BOOLEAN`,
      `ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "ai_label"     TEXT`
    ];
    for (const sql of addCols) {
      await client.query(sql).catch((e) => {
        if (!e.message?.includes("already exists")) console.warn("[db] col migration warning:", e.message);
      });
    }
    await client.query(`
      CREATE TABLE IF NOT EXISTS "briefings" (
        "id"           SERIAL PRIMARY KEY,
        "text"         TEXT NOT NULL,
        "generated_at" TIMESTAMP DEFAULT NOW(),
        "alert_count"  INTEGER DEFAULT 0,
        "top_countries" TEXT
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "discord_webhooks" (
        "id"         SERIAL PRIMARY KEY,
        "name"       TEXT NOT NULL,
        "url"        TEXT NOT NULL UNIQUE,
        "active"     BOOLEAN DEFAULT TRUE,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("[db] Migrations OK");
  } catch (err) {
    console.error("[db] Migration error:", err);
  } finally {
    client?.release();
  }
}
var import_node_postgres, import_pg, Pool, pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    import_node_postgres = require("drizzle-orm/node-postgres");
    import_pg = __toESM(require("pg"), 1);
    init_schema();
    ({ Pool } = import_pg.default);
    if (!process.env.DATABASE_URL) {
      console.error("[db] WARNING: DATABASE_URL is not set. DB operations will fail at query time.");
      process.env.DATABASE_URL = "postgresql://missing:missing@localhost:5432/missing";
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Neon serverless databases can take 5-15s to resume from suspend
      // Use ssl:true for Neon compatibility (honors sslmode=require in connection string)
      ssl: true ? true : false,
      max: 2,
      idleTimeoutMillis: 2e4,
      connectionTimeoutMillis: 25e3
    });
    db = (0, import_node_postgres.drizzle)(pool, { schema: schema_exports });
  }
});

// api/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => handler
});
module.exports = __toCommonJS(index_exports);
var import_express2 = __toESM(require("express"), 1);
var import_http = require("http");

// server/storage.ts
init_db();
var import_drizzle_orm = require("drizzle-orm");
init_schema();
var import_drizzle_orm2 = require("drizzle-orm");
var import_crypto = require("crypto");
var DatabaseStorage = class {
  async getAlerts() {
    return await db.select().from(alerts).orderBy((0, import_drizzle_orm2.desc)(alerts.timestamp));
  }
  async getAlertsAfter(id) {
    return await db.select().from(alerts).where((0, import_drizzle_orm.gt)(alerts.id, id)).orderBy(alerts.id);
  }
  async getAlert(id) {
    const [alert] = await db.select().from(alerts).where((0, import_drizzle_orm2.eq)(alerts.id, id));
    return alert;
  }
  async getAlertsByCountry(countryCode) {
    return await db.select().from(alerts).where((0, import_drizzle_orm2.eq)(alerts.countryCode, countryCode)).orderBy((0, import_drizzle_orm2.desc)(alerts.timestamp));
  }
  async createAlert(alert) {
    const [newAlert] = await db.insert(alerts).values(alert).returning();
    return newAlert;
  }
  async createAlertIfNew(alert) {
    const result = await db.insert(alerts).values(alert).onConflictDoNothing().returning();
    return result[0] ?? null;
  }
  async findRecentSimilar(countryCode, type, withinMinutes) {
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1e3);
    const [found] = await db.select().from(alerts).where((0, import_drizzle_orm.and)((0, import_drizzle_orm2.eq)(alerts.countryCode, countryCode), (0, import_drizzle_orm2.eq)(alerts.type, type), (0, import_drizzle_orm.gte)(alerts.timestamp, cutoff))).orderBy((0, import_drizzle_orm2.desc)(alerts.timestamp)).limit(1);
    return found ?? null;
  }
  async updateAlert(id, updates) {
    const [updated] = await db.update(alerts).set(updates).where((0, import_drizzle_orm2.eq)(alerts.id, id)).returning();
    return updated;
  }
  async deleteAlert(id) {
    await db.delete(alerts).where((0, import_drizzle_orm2.eq)(alerts.id, id));
  }
  async deleteOldAlerts(hoursOld) {
    const cutoff = new Date(Date.now() - hoursOld * 60 * 60 * 1e3);
    const result = await db.delete(alerts).where((0, import_drizzle_orm.lt)(alerts.timestamp, cutoff)).returning({ id: alerts.id });
    return result.length;
  }
  async getApiKeys() {
    return await db.select().from(apiKeys);
  }
  async createApiKey(keyReq) {
    const key = keyReq.key || `astral_${(0, import_crypto.randomBytes)(16).toString("hex")}`;
    const [newKey] = await db.insert(apiKeys).values({ ...keyReq, key }).returning();
    return newKey;
  }
  async deleteApiKey(id) {
    await db.delete(apiKeys).where((0, import_drizzle_orm2.eq)(apiKeys.id, id));
  }
  async validateApiKey(key) {
    const [found] = await db.select().from(apiKeys).where((0, import_drizzle_orm2.eq)(apiKeys.key, key));
    return !!found;
  }
  // ── Briefings ────────────────────────────────────────────────────────────────
  async getLatestBriefing() {
    const [b] = await db.select().from(briefings).orderBy((0, import_drizzle_orm2.desc)(briefings.generatedAt)).limit(1);
    return b ?? null;
  }
  async getAllBriefings() {
    return await db.select().from(briefings).orderBy((0, import_drizzle_orm2.desc)(briefings.generatedAt)).limit(168);
  }
  async saveBriefing(data) {
    const [b] = await db.insert(briefings).values({
      text: data.text,
      alertCount: data.alertCount,
      topCountries: JSON.stringify(data.topCountries)
    }).returning();
    return b;
  }
};
var storage = new DatabaseStorage();

// shared/routes.ts
var import_zod = require("zod");
init_schema();
var errorSchemas = {
  validation: import_zod.z.object({
    message: import_zod.z.string(),
    field: import_zod.z.string().optional()
  }),
  notFound: import_zod.z.object({
    message: import_zod.z.string()
  }),
  internal: import_zod.z.object({
    message: import_zod.z.string()
  }),
  unauthorized: import_zod.z.object({
    message: import_zod.z.string()
  })
};
var api = {
  alerts: {
    list: {
      method: "GET",
      path: "/api/alerts",
      responses: {
        200: import_zod.z.array(import_zod.z.custom())
      }
    },
    get: {
      method: "GET",
      path: "/api/alerts/:id",
      responses: {
        200: import_zod.z.custom(),
        404: errorSchemas.notFound
      }
    },
    create: {
      method: "POST",
      path: "/api/alerts",
      input: insertAlertSchema,
      responses: {
        201: import_zod.z.custom(),
        400: errorSchemas.validation
      }
    },
    update: {
      method: "PUT",
      path: "/api/alerts/:id",
      input: insertAlertSchema.partial(),
      responses: {
        200: import_zod.z.custom(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound
      }
    },
    delete: {
      method: "DELETE",
      path: "/api/alerts/:id",
      responses: {
        204: import_zod.z.void(),
        404: errorSchemas.notFound
      }
    }
  },
  keys: {
    list: {
      method: "GET",
      path: "/api/keys",
      responses: {
        200: import_zod.z.array(import_zod.z.custom())
      }
    },
    create: {
      method: "POST",
      path: "/api/keys",
      input: insertApiKeySchema,
      responses: {
        201: import_zod.z.custom(),
        400: errorSchemas.validation
      }
    },
    delete: {
      method: "DELETE",
      path: "/api/keys/:id",
      responses: {
        204: import_zod.z.void(),
        404: errorSchemas.notFound
      }
    }
  }
};
var ws = {
  send: {},
  receive: {
    alertCreated: import_zod.z.custom()
  }
};

// server/routes.ts
var import_zod2 = require("zod");

// server/ws.ts
var import_ws = require("ws");
var wss = null;
function broadcast(type, payload) {
  if (!wss) return;
  const msg = JSON.stringify({ type, payload });
  wss.clients.forEach((client) => {
    if (client.readyState === import_ws.WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

// server/sse.ts
var clients = /* @__PURE__ */ new Set();
function addSseClient(res) {
  clients.add(res);
}
function removeSseClient(res) {
  clients.delete(res);
}
function broadcastSse(type, payload, eventId) {
  if (clients.size === 0) return;
  const idLine = eventId != null ? `id: ${eventId}
` : "";
  const data = JSON.stringify({ type, payload });
  clients.forEach((res) => {
    try {
      res.write(`${idLine}data: ${data}

`);
    } catch {
      clients.delete(res);
    }
  });
}

// server/services/gdelt.ts
var import_adm_zip = __toESM(require("adm-zip"), 1);
var import_crypto2 = require("crypto");
var GDELT_LASTUPDATE_URL = "http://data.gdeltproject.org/gdeltv2/lastupdate.txt";
var CONFLICT_ROOTS = /* @__PURE__ */ new Set(["14", "17", "18", "19", "20"]);
var COL = {
  SQLDATE: 1,
  // YYYYMMDD — actual event date
  ACTOR1_NAME: 6,
  ACTOR2_NAME: 16,
  EVENT_CODE: 26,
  QUAD_CLASS: 29,
  GOLDSTEIN: 30,
  NUM_ARTICLES: 33,
  AVG_TONE: 34,
  ACTION_GEO_FULLNAME: 52,
  ACTION_GEO_COUNTRY: 53,
  ACTION_GEO_LAT: 56,
  ACTION_GEO_LONG: 57,
  SOURCE_URL: 60
};
var COUNTRY_NAMES = {
  US: "\xC9tats-Unis",
  RU: "Russie",
  CN: "Chine",
  UA: "Ukraine",
  IR: "Iran",
  IL: "Isra\xEBl",
  PS: "Palestine",
  SY: "Syrie",
  IQ: "Irak",
  AF: "Afghanistan",
  YE: "Y\xE9men",
  LY: "Libye",
  SD: "Soudan",
  ET: "\xC9thiopie",
  SO: "Somalie",
  ML: "Mali",
  NG: "Nig\xE9ria",
  PK: "Pakistan",
  IN: "Inde",
  MM: "Myanmar",
  FR: "France",
  DE: "Allemagne",
  GB: "Royaume-Uni",
  TR: "Turquie",
  SA: "Arabie Saoudite",
  EG: "\xC9gypte",
  KP: "Cor\xE9e du Nord",
  KR: "Cor\xE9e du Sud",
  JP: "Japon",
  TW: "Ta\xEFwan",
  VN: "Vietnam",
  PH: "Philippines",
  ID: "Indon\xE9sie",
  MX: "Mexique",
  BR: "Br\xE9sil",
  VE: "Venezuela",
  CO: "Colombie",
  HT: "Ha\xEFti",
  CD: "RD Congo",
  CF: "Centrafrique",
  SS: "Soudan du Sud",
  KE: "Kenya",
  MZ: "Mozambique",
  ZW: "Zimbabwe",
  ZA: "Afrique du Sud",
  MA: "Maroc",
  DZ: "Alg\xE9rie",
  TN: "Tunisie",
  LB: "Liban",
  JO: "Jordanie",
  AZ: "Azerba\xEFdjan",
  AM: "Arm\xE9nie",
  GE: "G\xE9orgie",
  BY: "Bi\xE9lorussie",
  PL: "Pologne",
  RS: "Serbie",
  XK: "Kosovo",
  BA: "Bosnie",
  MK: "Mac\xE9doine du Nord"
};
function getActionLabel(code) {
  const n = parseInt(code);
  if (n >= 203) return "G\xE9nocide signal\xE9";
  if (n >= 201) return "Massacre de masse";
  if (n >= 200) return "Violence de masse";
  if (n >= 196) return "Violation de cessez-le-feu";
  if (n >= 195) return "Frappe a\xE9rienne";
  if (n >= 194) return "Bombardement d'artillerie";
  if (n >= 193) return "Combat \xE0 l'arme l\xE9g\xE8re";
  if (n >= 192) return "Occupation de territoire";
  if (n >= 191) return "Blocus naval";
  if (n >= 190) return "Op\xE9ration militaire";
  if (n >= 183) return "Attentat \xE0 l'explosif";
  if (n >= 182) return "Agression physique";
  if (n >= 181) return "Prise d'otage";
  if (n >= 180) return "Assaut arm\xE9";
  if (n >= 174) return "Arrestation forc\xE9e";
  if (n >= 172) return "Boycott / Embargo";
  if (n >= 170) return "Coercition signal\xE9e";
  if (n >= 145) return "\xC9meute violente";
  if (n >= 143) return "Manifestation arm\xE9e";
  if (n >= 140) return "Manifestation violente";
  return "Incident de s\xE9curit\xE9";
}
function getAlertType(code) {
  const n = parseInt(code);
  if (n >= 200) return "massacre";
  if (n === 195 || n >= 193 && n <= 196) return "airstrike";
  if (n === 194 || n === 193) return "artillery";
  if (n === 191) return "naval";
  if (n >= 190) return "missile";
  if (n === 183) return "explosion";
  if (n >= 180) return "conflict";
  if (n >= 172 && n <= 174) return "sanctions";
  if (n >= 170) return "terrorism";
  if (n >= 145) return "protest";
  if (n >= 140) return "warning";
  return "warning";
}
function getCategory(type) {
  const map = {
    missile: "MILITARY",
    airstrike: "MILITARY",
    artillery: "MILITARY",
    naval: "MILITARY",
    conflict: "MILITARY",
    explosion: "MILITARY",
    chemical: "MILITARY",
    nuclear: "MILITARY",
    cyber: "MILITARY",
    massacre: "HUMANITARIAN",
    terrorism: "HUMANITARIAN",
    coup: "POLITICAL",
    sanctions: "POLITICAL",
    protest: "GEOPOLITICAL",
    warning: "GEOPOLITICAL"
  };
  return map[type] ?? "GEOPOLITICAL";
}
function fingerprint(input) {
  return (0, import_crypto2.createHash)("sha256").update(input).digest("hex").slice(0, 32);
}
function getSeverity(goldstein, numArticles) {
  const abs = Math.abs(goldstein);
  if (abs >= 9 || numArticles >= 80) return "critical";
  if (abs >= 7 || numArticles >= 25) return "high";
  if (abs >= 4 || numArticles >= 8) return "medium";
  return "low";
}
function getSeverityScore(goldstein, numArticles, type) {
  if (type === "nuclear" || type === "chemical") return 10;
  if (type === "missile") return 9;
  if (type === "massacre") return 9;
  if (type === "airstrike") return 8;
  if (type === "explosion" || type === "terrorism") return 7;
  if (type === "naval" || type === "artillery") return 6;
  if (type === "conflict") return Math.abs(goldstein) >= 7 ? 6 : 5;
  if (type === "coup") return 5;
  if (type === "sanctions") return 4;
  if (type === "protest") return 3;
  return Math.max(1, Math.min(4, Math.round(Math.abs(goldstein) / 2.5)));
}
function buildTitle(code, location) {
  const action = getActionLabel(code);
  const place = location?.split(",")[0]?.trim() || "Position inconnue";
  return `${action} \u2014 ${place}`;
}
function buildDescription(actor1, actor2, location, goldstein) {
  const parts = [];
  if (actor1 && actor1 !== "UNKNOWN" && actor1.length > 1) parts.push(actor1);
  if (actor2 && actor2 !== "UNKNOWN" && actor2.length > 1 && actor2 !== actor1) parts.push(actor2);
  const actors = parts.length > 0 ? `Acteurs impliqu\xE9s: ${parts.join(" / ")}. ` : "";
  const loc = location ? `Secteur: ${location}. ` : "";
  const tension = `Indice Goldstein: ${goldstein.toFixed(1)}/10.`;
  return actors + loc + tension;
}
var lastProcessedFileUrl = "";
async function fetchGdeltEvents() {
  try {
    const listResp = await fetch(GDELT_LASTUPDATE_URL, {
      signal: AbortSignal.timeout(15e3)
    });
    if (!listResp.ok) throw new Error(`GDELT list: HTTP ${listResp.status}`);
    const listText = await listResp.text();
    const exportLine = listText.trim().split("\n").find((l) => l.includes(".export.CSV.zip"));
    if (!exportLine) {
      console.log("[gdelt] No export CSV in update list");
      return 0;
    }
    const parts = exportLine.trim().split(/\s+/);
    const fileUrl = parts[2];
    if (!fileUrl) return 0;
    if (fileUrl === lastProcessedFileUrl) {
      console.log("[gdelt] No new data (same file)");
      return 0;
    }
    console.log(`[gdelt] Downloading: ${fileUrl}`);
    const zipResp = await fetch(fileUrl, {
      signal: AbortSignal.timeout(45e3)
    });
    if (!zipResp.ok) throw new Error(`GDELT zip: HTTP ${zipResp.status}`);
    const zipBuf = Buffer.from(await zipResp.arrayBuffer());
    const zip = new import_adm_zip.default(zipBuf);
    const entries = zip.getEntries();
    if (entries.length === 0) throw new Error("Empty GDELT ZIP");
    const csv = entries[0].getData().toString("utf8");
    const lines = csv.split("\n");
    console.log(`[gdelt] Parsing ${lines.length} event rows`);
    const existing = await storage.getAlerts();
    const seenSources = new Set(existing.map((a) => a.source).filter(Boolean));
    let added = 0;
    for (const line of lines) {
      const cols = line.split("	");
      if (cols.length < 61) continue;
      const eventCode = cols[COL.EVENT_CODE]?.trim();
      if (!eventCode) continue;
      const root = eventCode.substring(0, 2);
      if (!CONFLICT_ROOTS.has(root)) continue;
      const sqldate = cols[COL.SQLDATE]?.trim();
      let eventDate = /* @__PURE__ */ new Date();
      if (sqldate && sqldate.length === 8) {
        const y = parseInt(sqldate.slice(0, 4));
        const m = parseInt(sqldate.slice(4, 6)) - 1;
        const d = parseInt(sqldate.slice(6, 8));
        eventDate = new Date(Date.UTC(y, m, d));
        const ageDays = (Date.now() - eventDate.getTime()) / 864e5;
        if (ageDays > 3) continue;
      }
      const quadClass = parseInt(cols[COL.QUAD_CLASS]);
      const goldstein = parseFloat(cols[COL.GOLDSTEIN]);
      if (quadClass !== 4 && goldstein > -3.5) continue;
      const lat = parseFloat(cols[COL.ACTION_GEO_LAT]);
      const lng = parseFloat(cols[COL.ACTION_GEO_LONG]);
      if (isNaN(lat) || isNaN(lng)) continue;
      if (lat === 0 && lng === 0) continue;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
      const location = cols[COL.ACTION_GEO_FULLNAME]?.trim() ?? "";
      const countryCode = cols[COL.ACTION_GEO_COUNTRY]?.trim() ?? "";
      const actor1 = cols[COL.ACTOR1_NAME]?.trim() ?? "";
      const actor2 = cols[COL.ACTOR2_NAME]?.trim() ?? "";
      const numArticles = parseInt(cols[COL.NUM_ARTICLES]) || 1;
      const sourceUrl = cols[COL.SOURCE_URL]?.trim() ?? "";
      if (sourceUrl && seenSources.has(sourceUrl)) continue;
      const severity = getSeverity(goldstein, numArticles);
      if (severity === "low" && existing.length > 300) continue;
      const type = getAlertType(eventCode);
      const category = getCategory(type);
      const fp = fingerprint(sourceUrl || `${eventCode}|${location}|${lat}|${lng}`);
      const DEDUP_TYPES = /* @__PURE__ */ new Set(["missile", "airstrike", "artillery", "explosion", "nuclear", "chemical", "massacre", "terrorism", "naval"]);
      if (DEDUP_TYPES.has(type) && countryCode) {
        const similar = await storage.findRecentSimilar(countryCode, type, 90);
        if (similar) continue;
      }
      const inserted = await storage.createAlertIfNew({
        title: buildTitle(eventCode, location),
        description: buildDescription(actor1, actor2, location, goldstein),
        lat: lat.toString(),
        lng: lng.toString(),
        country: COUNTRY_NAMES[countryCode] || countryCode || "Inconnu",
        countryCode,
        source: sourceUrl || null,
        type,
        category,
        sourceType: "GDELT",
        severity,
        status: "active",
        fingerprint: fp,
        severityScore: getSeverityScore(goldstein, numArticles, type),
        eventStart: eventDate
      });
      if (!inserted) continue;
      if (sourceUrl) seenSources.add(sourceUrl);
      added++;
      if (added >= 60) break;
    }
    lastProcessedFileUrl = fileUrl;
    console.log(`[gdelt] \u2713 Added ${added} new conflict alerts`);
    return added;
  } catch (err) {
    console.error("[gdelt] Fetch error:", err);
    return 0;
  }
}

// server/services/rss.ts
var import_crypto3 = require("crypto");

// shared/aggressor-detection.ts
var COUNTRY_COORDS = {
  RU: { lat: 55.75, lng: 37.62, name: "Russie" },
  // Moscow
  UA: { lat: 50.45, lng: 30.52, name: "Ukraine" },
  // Kyiv
  IL: { lat: 31.77, lng: 35.21, name: "Isra\xEBl" },
  // Jerusalem
  PS: { lat: 31.52, lng: 34.46, name: "Gaza" },
  // Gaza City
  IR: { lat: 35.69, lng: 51.39, name: "Iran" },
  // Tehran
  YE: { lat: 15.37, lng: 44.19, name: "Y\xE9men (Houthis)" },
  // Sanaa
  SA: { lat: 24.69, lng: 46.72, name: "Arabie Saoudite" },
  // Riyadh
  SY: { lat: 33.51, lng: 36.29, name: "Syrie" },
  // Damascus
  LB: { lat: 33.89, lng: 35.5, name: "Liban (Hezbollah)" },
  // Beirut
  KP: { lat: 39.03, lng: 125.75, name: "Cor\xE9e du Nord" },
  // Pyongyang
  CN: { lat: 39.91, lng: 116.39, name: "Chine" },
  // Beijing
  AF: { lat: 34.52, lng: 69.18, name: "Afghanistan" },
  // Kabul
  PK: { lat: 33.72, lng: 73.06, name: "Pakistan" },
  // Islamabad
  IN: { lat: 28.61, lng: 77.21, name: "Inde" },
  // New Delhi
  US: { lat: 38.9, lng: -77.04, name: "\xC9tats-Unis" },
  // Washington
  MM: { lat: 19.74, lng: 96.08, name: "Myanmar (junta)" },
  // Naypyidaw
  AZ: { lat: 40.41, lng: 49.87, name: "Azerba\xEFdjan" },
  // Baku
  AM: { lat: 40.18, lng: 44.51, name: "Arm\xE9nie" },
  // Yerevan
  ET: { lat: 9.02, lng: 38.75, name: "\xC9thiopie" },
  // Addis Ababa
  SO: { lat: 2.05, lng: 45.34, name: "Somalie (Al-Shabaab)" },
  ML: { lat: 12.65, lng: -8, name: "Mali" }
};
var AGGRESSOR_KEYWORDS = [
  { pattern: /\b(russia|russian|kremlin|moscow|putin)\b/i, code: "RU" },
  { pattern: /\b(ukraine|ukrainian|kyiv|zelensky|uaf)\b/i, code: "UA" },
  { pattern: /\b(israel|idf|israeli)\b/i, code: "IL" },
  { pattern: /\b(hamas|gaza|islamic jihad)\b/i, code: "PS" },
  { pattern: /\b(hezbollah|lebanon|lebanese)\b/i, code: "LB" },
  { pattern: /\b(iran|iranian|irgc|tehran)\b/i, code: "IR" },
  { pattern: /\b(houthi|houthis|ansar allah|yemen|sanaa)\b/i, code: "YE" },
  { pattern: /\b(north korea|dprk|kim jong)\b/i, code: "KP" },
  { pattern: /\b(china|chinese|pla|beijing)\b/i, code: "CN" },
  { pattern: /\b(pakistan|pakistani|isi)\b/i, code: "PK" },
  { pattern: /\b(myanmar|junta|tatmadaw)\b/i, code: "MM" },
  { pattern: /\b(azerbaijan|azeri|baku)\b/i, code: "AZ" },
  { pattern: /\b(armenia|armenian|yerevan)\b/i, code: "AM" },
  { pattern: /\b(ethiopia|ethiopian|tigray)\b/i, code: "ET" },
  { pattern: /\b(al.?shabaab|somalia)\b/i, code: "SO" },
  { pattern: /\b(mali|malian)\b/i, code: "ML" },
  { pattern: /\b(syria|syrian|assad)\b/i, code: "SY" }
];
var THEATRE_AGGRESSORS = {
  UA: ["RU"],
  // Ukraine hit → Russia fired
  IL: ["PS", "LB", "IR", "YE"],
  // Israel hit → Gaza/Hezbollah/Iran/Houthis
  PS: ["IL"],
  // Gaza hit → Israel
  SA: ["YE", "IR"],
  // Saudi hit → Houthis/Iran
  IQ: ["IR", "US"],
  // Iraq → Iran-backed or US
  SY: ["IL", "RU", "US"],
  LB: ["IL"],
  IN: ["PK", "CN"],
  PK: ["IN"],
  KR: ["KP"],
  // South Korea hit → North Korea
  JP: ["KP", "CN"],
  TW: ["CN"],
  AM: ["AZ"],
  AZ: ["AM"],
  ET: ["SO"]
};
function detectAggressorCoords(title, description, impactCountryCode) {
  const text2 = `${title} ${description}`;
  for (const { pattern, code } of AGGRESSOR_KEYWORDS) {
    if (pattern.test(text2)) {
      const coords = COUNTRY_COORDS[code];
      if (coords && code !== impactCountryCode) {
        return coords;
      }
    }
  }
  if (impactCountryCode && THEATRE_AGGRESSORS[impactCountryCode]) {
    for (const aggressorCode of THEATRE_AGGRESSORS[impactCountryCode]) {
      const coords = COUNTRY_COORDS[aggressorCode];
      if (coords) return coords;
    }
  }
  return null;
}

// server/services/groq-classifier.ts
var GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
var VALID_TYPES = [
  // ── ALERTES (incidents réels, violence confirmée) ─────────────────────────
  "missile",
  "airstrike",
  "artillery",
  "naval",
  "conflict",
  "explosion",
  "chemical",
  "nuclear",
  "cyber",
  "coup",
  "massacre",
  "terrorism",
  // ── INFORMATIONS (pas d'incident actif, mais pertinent géopolitiquement) ──
  "diplomatic",
  // négociations, sommets, expulsions, accord/rupture
  "political",
  // élections, changement de gouvernement, déclaration officielle majeure
  "military-move",
  // déploiement, exercice militaire, mouvement de troupes sans combat
  "sanctions",
  // sanctions économiques, embargo, gel d'avoirs
  "protest",
  // manifestations, émeutes civiles
  "humanitarian",
  // crise humanitaire, réfugiés, aide internationale
  "breaking",
  // info urgente très récente, non encore confirmée
  "warning",
  // menace potentielle, alerte non confirmée
  "info"
  // fallback : info géopolitique qui ne rentre dans aucune autre case
];
var SYSTEM_PROMPT = `Tu es un analyste de renseignement g\xE9opolitique. Analyse cet article et r\xE9ponds UNIQUEMENT en JSON valide, sans texte autour.

\u2501\u2501\u2501 \xC9TAPE 1 \u2014 PERTINENCE \u2501\u2501\u2501
relevant: true si l'article traite d'un sujet g\xE9opolitique/militaire/diplomatique.
relevant: false pour : sport, culture, \xE9conomie g\xE9n\xE9rale non li\xE9e \xE0 un conflit, m\xE9t\xE9o, fait divers civil, pure opinion sans \xE9v\xE9nement, r\xE9trospective historique ancienne (>1 an).

\u2501\u2501\u2501 \xC9TAPE 2 \u2014 TYPE : INFO PAR D\xC9FAUT \u2501\u2501\u2501

\u26A0\uFE0F R\xC8GLE ABSOLUE DE PRIORIT\xC9 :
La cat\xE9gorie INFO est la cat\xE9gorie par d\xE9faut. Les types ALERTE ne s'utilisent QUE si l'\xE9v\xE9nement violent s'est produit dans les 15 derni\xE8res minutes et est actuellement en cours ou vient juste d'avoir lieu.

Si un \xE9v\xE9nement violent (tir de missile, frappe, attentat...) s'est pass\xE9 il y a plus de 30 minutes, hier, ou est mentionn\xE9 dans un contexte de bilan/analyse/contexte \u2192 utilise OBLIGATOIREMENT un type INFO.

\u2501\u2501 TYPES ALERTE (UNIQUEMENT si \xE9v\xE9nement <15 min, en cours maintenant) \u2501\u2501
\u2022 missile       \u2192 tir de missile EN COURS \xE0 l'instant (<15 min)
\u2022 airstrike     \u2192 frappe a\xE9rienne EN COURS \xE0 l'instant (<15 min)
\u2022 artillery     \u2192 bombardement actif EN COURS \xE0 l'instant (<15 min)
\u2022 naval         \u2192 combat naval EN COURS \xE0 l'instant (<15 min)
\u2022 conflict      \u2192 combat terrestre actif EN COURS \xE0 l'instant (<15 min)
\u2022 explosion     \u2192 explosion venant de se produire (<15 min)
\u2022 chemical      \u2192 usage d'arme chimique EN COURS ou confirm\xE9 <15 min
\u2022 nuclear       \u2192 essai nucl\xE9aire ou incident radiologique <15 min
\u2022 cyber         \u2192 cyberattaque active d\xE9tect\xE9e <15 min
\u2022 coup          \u2192 coup d'\xC9tat EN COURS \xE0 l'instant
\u2022 massacre      \u2192 tuerie de masse EN COURS \xE0 l'instant (<15 min)
\u2022 terrorism     \u2192 attentat EN COURS ou venant de se produire (<15 min)

\u2501\u2501 TYPES INFO (tout le reste \u2014 usage par d\xE9faut) \u2501\u2501
\u2022 humanitarian  \u2192 victimes, bilan de frappes pass\xE9es, r\xE9fugi\xE9s, aide humanitaire, g\xE9nocide rapport\xE9, massacre pass\xE9
\u2022 military-move \u2192 d\xE9ploiement, mouvement de troupes, exercice militaire, tir de missile pass\xE9 (>30 min), frappe pass\xE9e
\u2022 breaking      \u2192 information urgente tr\xE8s r\xE9cente (<2h), non confirm\xE9e mais cr\xE9dible
\u2022 diplomatic    \u2192 n\xE9gociation, sommet, accord, rupture diplomatique, expulsion, sanctions en pr\xE9paration
\u2022 political     \u2192 \xE9lection, changement de gouvernement, d\xE9claration politique majeure
\u2022 sanctions     \u2192 sanctions \xE9conomiques, embargo, gel d'avoirs annonc\xE9
\u2022 protest       \u2192 manifestation, \xE9meute, mouvement social
\u2022 warning       \u2192 menace, ultimatum, alerte non confirm\xE9e, risque potentiel
\u2022 info          \u2192 tout autre contenu g\xE9opolitique pertinent (fallback)

EXEMPLES CONCRETS :
- "Iran fires missiles at Israel" publi\xE9 maintenant \u2192 missile / high
- "Iran launched missiles yesterday" \u2192 military-move / medium
- "Analysis of last week's strikes in Gaza" \u2192 humanitarian / low
- "Genocide in Sudan kills thousands" (bilan) \u2192 humanitarian / high
- "Troops deployed near border" \u2192 military-move / low
- "North Korea test-fired a missile last month" \u2192 military-move / low
- "Ceasefire talks begin in Cairo" \u2192 diplomatic / medium
- "Breaking: explosion reported in Kyiv" (<2h, non confirm\xE9) \u2192 breaking / medium

\u2501\u2501\u2501 \xC9TAPE 3 \u2014 S\xC9V\xC9RIT\xC9 \u2501\u2501\u2501
\u2022 critical \u2192 frappe/attentat actif EN COURS avec nombreuses victimes, CBRN actif, coup r\xE9ussi en cours
\u2022 high     \u2192 bilan lourd (>10 morts), escalade majeure, frappe directe sur civils rapport\xE9e
\u2022 medium   \u2192 incident limit\xE9, mobilisation, breaking non confirm\xE9, menace cr\xE9dible
\u2022 low      \u2192 d\xE9claration, analyse, d\xE9placement diplomatique, information contextuelle

\u2501\u2501\u2501 \xC9TAPE 4 \u2014 LABEL \u2501\u2501\u2501
Phrase factuelle en fran\xE7ais, max 55 caract\xE8res, temps pr\xE9sent ou pass\xE9 selon le contexte r\xE9el.

\u2501\u2501\u2501 \xC9TAPE 5 \u2014 R\xC9SUM\xC9 \u2501\u2501\u2501
summary: R\xE9sum\xE9 factuel de l'\xE9v\xE9nement en fran\xE7ais, 1-2 phrases, max 200 caract\xE8res. D\xE9cris CE QUI S'EST PASS\xC9 concr\xE8tement : qui, quoi, o\xF9, cons\xE9quences si connues. Ne r\xE9p\xE8te pas le label.

Format : {"relevant":bool,"type":"...","severity":"...","label":"...","summary":"..."}`;
async function classifyAlert(title, description) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    console.warn("[groq] No API key \u2014 classification skipped");
    return null;
  }
  console.log(`[groq] Classifying: "${title.slice(0, 60)}\u2026"`);
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Titre: ${title}
Description: ${description?.slice(0, 600) ?? ""}` }
        ],
        response_format: { type: "json_object" },
        max_tokens: 220,
        temperature: 0.05
      }),
      signal: AbortSignal.timeout(8e3)
    });
    if (!res.ok) {
      console.warn(`[groq] API error ${res.status}`);
      return null;
    }
    const data = await res.json();
    const raw = JSON.parse(data.choices[0].message.content);
    const result = {
      relevant: !!raw.relevant,
      type: VALID_TYPES.includes(raw.type) ? raw.type : "warning",
      severity: ["low", "medium", "high", "critical"].includes(raw.severity) ? raw.severity : "medium",
      label: String(raw.label ?? title).slice(0, 100),
      summary: String(raw.summary ?? description ?? "").slice(0, 300)
    };
    console.log(`[groq] \u2192 ${result.relevant ? "\u2713" : "\u2717"} ${result.type}/${result.severity} "${result.label.slice(0, 40)}"`);
    return result;
  } catch (e) {
    console.warn("[groq] Classification failed:", e);
    return null;
  }
}

// server/services/rss.ts
function fingerprint2(input) {
  return (0, import_crypto3.createHash)("sha256").update(input).digest("hex").slice(0, 32);
}
function getSeverityScore2(text2, type) {
  const lower = text2.toLowerCase();
  if (type === "nuclear" || lower.includes("nuclear") || lower.includes("chemical weapon") || lower.includes("genocide")) return 10;
  if (type === "missile" || lower.includes("ballistic") || lower.includes("icbm")) return 9;
  if (type === "massacre" || lower.includes("mass kill") || lower.includes("mass murder")) return 9;
  if (type === "airstrike" || lower.includes("air strike") || lower.includes("bombing")) return 8;
  if (type === "explosion" || type === "terrorism" || lower.includes("dozens killed") || lower.includes("hundreds killed")) return 7;
  if (type === "naval" || type === "artillery") return 6;
  if (type === "conflict" || lower.includes("offensive") || lower.includes("combat")) return 5;
  if (type === "coup" || lower.includes("coup")) return 5;
  if (type === "breaking") return 4;
  if (type === "humanitarian" || lower.includes("killed") || lower.includes("casualties") || lower.includes("dead")) return 4;
  if (type === "military-move" || type === "sanctions" || type === "warning") return 3;
  if (type === "protest" || lower.includes("clashes") || lower.includes("unrest")) return 3;
  if (type === "diplomatic" || type === "political") return 2;
  if (lower.includes("tensions") || lower.includes("deployment")) return 2;
  return 1;
}
var RSS_FEEDS = [
  // ── Agences de presse classiques ──────────────────────────────────────────
  { name: "Reuters World", url: "https://feeds.reuters.com/reuters/worldNews", region: "global", sourceType: "RSS" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", region: "mideast", sourceType: "RSS" },
  { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml", region: "global", sourceType: "RSS" },
  { name: "AFP/World", url: "https://rss.app/feeds/v1/latest/8L1wD6p4Yp4qX6p4.xml", region: "global", sourceType: "RSS" },
  { name: "France24 EN", url: "https://www.france24.com/en/rss", region: "global", sourceType: "RSS" },
  { name: "DW World", url: "https://rss.dw.com/rdf/rss-en-all", region: "global", sourceType: "RSS" },
  // ── Canaux Telegram via RSSHub (temps réel, pas besoin de clé) ────────────
  // Alertes missiles & air raid (priorité maximale)
  { name: "UA Air Force", url: "https://rsshub.app/telegram/channel/kpszsu", region: "ukraine", sourceType: "TELEGRAM" },
  { name: "War Monitor", url: "https://rsshub.app/telegram/channel/war_monitor", region: "global", sourceType: "TELEGRAM" },
  { name: "ME Spectator", url: "https://rsshub.app/telegram/channel/Middle_East_Spectator", region: "mideast", sourceType: "TELEGRAM" },
  // Breaking news mondiales
  { name: "Conflict News", url: "https://rsshub.app/telegram/channel/conflict_news", region: "global", sourceType: "TELEGRAM" },
  { name: "WarMonitors", url: "https://rsshub.app/telegram/channel/WarMonitors", region: "global", sourceType: "TELEGRAM" },
  { name: "LiveUAMap", url: "https://rsshub.app/telegram/channel/liveuamap", region: "ukraine", sourceType: "TELEGRAM" },
  { name: "BNO News", url: "https://rsshub.app/telegram/channel/BNONews", region: "global", sourceType: "TELEGRAM" },
  // Validation & sources officielles
  { name: "Spectator Index", url: "https://rsshub.app/telegram/channel/spectatorindex", region: "global", sourceType: "TELEGRAM" },
  { name: "Acta World", url: "https://rsshub.app/telegram/channel/actaworldnews", region: "global", sourceType: "TELEGRAM" },
  // OSINT (surveillance - sources partisanes signalées)
  { name: "Intel Slava", url: "https://rsshub.app/telegram/channel/intelslava", region: "ukraine", sourceType: "TELEGRAM" },
  { name: "Rybar", url: "https://rsshub.app/telegram/channel/rybar", region: "ukraine", sourceType: "TELEGRAM" },
  // Canaux additionnels haute priorité
  { name: "Air Alert UA", url: "https://rsshub.app/telegram/channel/air_alert_ua", region: "ukraine", sourceType: "TELEGRAM" },
  { name: "Clash Report", url: "https://rsshub.app/telegram/channel/clashreport", region: "global", sourceType: "TELEGRAM" },
  { name: "Delta Hub", url: "https://rsshub.app/telegram/channel/DeIta_hub", region: "global", sourceType: "TELEGRAM" },
  { name: "RE Market News", url: "https://rsshub.app/telegram/channel/RE_MarketNews", region: "global", sourceType: "TELEGRAM" },
  // Twitter/X via Nitter RSS (AFP, Reuters, BNO)
  { name: "AFP via Nitter", url: "https://nitter.poast.org/AFP/rss", region: "global", sourceType: "RSS" },
  { name: "BNO via Nitter", url: "https://nitter.poast.org/BNONews/rss", region: "global", sourceType: "RSS" },
  { name: "Reuters via Nitter", url: "https://nitter.poast.org/Reuters/rss", region: "global", sourceType: "RSS" }
];
var TYPE_KEYWORDS = [
  { keywords: ["missile", "rocket", "ballistic", "icbm", "scud"], type: "missile", category: "MILITARY" },
  { keywords: ["airstrike", "air strike", "bombing", "bomb", "warplane", "jet", "drone strike", "aerial"], type: "airstrike", category: "MILITARY" },
  { keywords: ["artillery", "shelling", "mortar", "barrage", "cannon"], type: "artillery", category: "MILITARY" },
  { keywords: ["naval", "warship", "destroyer", "frigate", "submarine", "fleet", "sea battle"], type: "naval", category: "MILITARY" },
  { keywords: ["explosion", "blast", "explode", "detonation"], type: "explosion", category: "MILITARY" },
  { keywords: ["chemical weapon", "chlorine", "sarin", "nerve agent"], type: "chemical", category: "MILITARY" },
  { keywords: ["nuclear", "radioactive", "uranium", "plutonium", "warhead"], type: "nuclear", category: "MILITARY" },
  { keywords: ["cyberattack", "cyber attack", "hacked", "ransomware", "malware", "ddos"], type: "cyber", category: "MILITARY" },
  { keywords: ["coup", "putsch", "junta", "overthrow", "mutiny"], type: "coup", category: "POLITICAL" },
  { keywords: ["sanction", "embargo", "freeze", "asset"], type: "sanctions", category: "POLITICAL" },
  { keywords: ["massacre", "genocide", "ethnic cleansing", "mass killing", "atrocity"], type: "massacre", category: "HUMANITARIAN" },
  { keywords: ["terror", "terrorist", "attack", "suicide bomb", "isis", "al-qaeda", "boko haram"], type: "terrorism", category: "HUMANITARIAN" },
  { keywords: ["protest", "demonstration", "riot", "uprising", "clashes", "unrest"], type: "protest", category: "GEOPOLITICAL" },
  { keywords: ["troops", "military", "soldiers", "forces", "combat", "battle", "offensive", "frontline"], type: "conflict", category: "MILITARY" }
];
var COUNTRY_GEO = {
  ukraine: { code: "UA", name: "Ukraine", lat: 49, lng: 31 },
  russia: { code: "RU", name: "Russie", lat: 61.5, lng: 90 },
  gaza: { code: "PS", name: "Palestine", lat: 31.4, lng: 34.4 },
  palestine: { code: "PS", name: "Palestine", lat: 31.9, lng: 35.2 },
  israel: { code: "IL", name: "Isra\xEBl", lat: 31, lng: 35 },
  iran: { code: "IR", name: "Iran", lat: 32.4, lng: 53.7 },
  syria: { code: "SY", name: "Syrie", lat: 35, lng: 38 },
  iraq: { code: "IQ", name: "Irak", lat: 33.2, lng: 43.7 },
  yemen: { code: "YE", name: "Y\xE9men", lat: 15.5, lng: 47.5 },
  sudan: { code: "SD", name: "Soudan", lat: 15.6, lng: 32.5 },
  "north korea": { code: "KP", name: "Cor\xE9e du Nord", lat: 40, lng: 127 },
  taiwan: { code: "TW", name: "Ta\xEFwan", lat: 23.7, lng: 121 },
  china: { code: "CN", name: "Chine", lat: 35.9, lng: 104.2 },
  myanmar: { code: "MM", name: "Myanmar", lat: 19.2, lng: 96.7 },
  somalia: { code: "SO", name: "Somalie", lat: 5.2, lng: 46.2 },
  afghanistan: { code: "AF", name: "Afghanistan", lat: 33.9, lng: 67.7 },
  lebanon: { code: "LB", name: "Liban", lat: 33.9, lng: 35.5 },
  libya: { code: "LY", name: "Libye", lat: 26.3, lng: 17.2 },
  mali: { code: "ML", name: "Mali", lat: 17.6, lng: -2 },
  ethiopia: { code: "ET", name: "\xC9thiopie", lat: 9.1, lng: 40.5 },
  nigeria: { code: "NG", name: "Nig\xE9ria", lat: 9.1, lng: 8.7 },
  pakistan: { code: "PK", name: "Pakistan", lat: 30.4, lng: 69.3 },
  congo: { code: "CD", name: "RD Congo", lat: -4, lng: 21.8 },
  haiti: { code: "HT", name: "Ha\xEFti", lat: 19, lng: -72.3 },
  venezuela: { code: "VE", name: "Venezuela", lat: 6.4, lng: -66.6 },
  serbia: { code: "RS", name: "Serbie", lat: 44, lng: 21 },
  kosovo: { code: "XK", name: "Kosovo", lat: 42.6, lng: 20.9 },
  georgia: { code: "GE", name: "G\xE9orgie", lat: 42.3, lng: 43.4 },
  "south sudan": { code: "SS", name: "Soudan du Sud", lat: 7.8, lng: 29.7 },
  mozambique: { code: "MZ", name: "Mozambique", lat: -18.7, lng: 35 },
  azerbaijan: { code: "AZ", name: "Azerba\xEFdjan", lat: 40.1, lng: 47.6 },
  armenia: { code: "AM", name: "Arm\xE9nie", lat: 40.1, lng: 45 }
};
function detectTypeAndCategory(text2) {
  const lower = text2.toLowerCase();
  for (const { keywords, type, category } of TYPE_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return { type, category };
    }
  }
  return { type: "info", category: "INFO" };
}
function detectCountry(text2) {
  const lower = text2.toLowerCase();
  const entries = Object.entries(COUNTRY_GEO).sort((a, b) => b[0].length - a[0].length);
  for (const [keyword, geo] of entries) {
    if (lower.includes(keyword)) return geo;
  }
  return null;
}
function detectSeverity(text2) {
  const lower = text2.toLowerCase();
  if (lower.includes("nuclear") || lower.includes("genocide") || lower.includes("massacre") || lower.includes("chemical weapon") || lower.includes("ballistic") || lower.includes("mass kill")) {
    return "critical";
  }
  if (lower.includes("missile") || lower.includes("airstrike") || lower.includes("offensive") || lower.includes("dozens killed") || lower.includes("hundreds killed") || lower.includes("attack")) {
    return "high";
  }
  if (lower.includes("troops") || lower.includes("shelling") || lower.includes("explosion") || lower.includes("clashes") || lower.includes("fighting")) {
    return "medium";
  }
  return "low";
}
function parseRss(xml) {
  const items = [];
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const get = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i"));
      return m ? m[1].trim() : "";
    };
    const title = get("title");
    const description = get("description");
    const link = get("link") || get("guid");
    const pubDate = get("pubDate");
    if (title && link) items.push({ title, description, link, pubDate });
  }
  return items;
}
async function fetchRssAlerts() {
  let added = 0;
  const existing = await storage.getAlerts();
  const seenSources = new Set(existing.map((a) => a.source).filter(Boolean));
  for (const feed of RSS_FEEDS) {
    try {
      let items = [];
      try {
        const res = await fetch(feed.url, {
          signal: AbortSignal.timeout(12e3),
          headers: { "User-Agent": "AMC-ConflictMonitor/2.0" }
        });
        if (res.ok) {
          const xml = await res.text();
          items = parseRss(xml);
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch {
        const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
        const proxyRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(12e3) });
        if (proxyRes.ok) {
          const data = await proxyRes.json();
          if (data.status === "ok" && data.items) {
            items = data.items.map((i) => ({
              title: i.title,
              description: i.description ?? "",
              link: i.link || i.guid,
              pubDate: i.pubDate
            }));
          }
        }
        if (items.length === 0) {
          console.warn(`[rss] ${feed.name}: both direct and proxy failed`);
          continue;
        }
      }
      for (const item of items) {
        if (seenSources.has(item.link)) continue;
        if (item.pubDate) {
          const age = Date.now() - new Date(item.pubDate).getTime();
          const ttl = feed.sourceType === "TELEGRAM" ? 30 * 60 * 1e3 : 4 * 60 * 60 * 1e3;
          if (!isNaN(age) && age > ttl) continue;
        }
        const combined = `${item.title} ${item.description}`;
        const country = detectCountry(combined);
        if (!country) continue;
        const hasGroq = !!process.env.GROQ_API_KEY;
        const { type: kwType, category: kwCategory } = detectTypeAndCategory(combined);
        const kwSeverity = detectSeverity(combined);
        const type = hasGroq ? "info" : kwType;
        const category = hasGroq ? "INFO" : kwCategory;
        const severity = hasGroq ? "low" : kwSeverity;
        if (!hasGroq && kwSeverity === "low" && kwType === "info") continue;
        const cleanTitle = item.title.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/<[^>]+>/g, "");
        const cleanDesc = item.description.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/<[^>]+>/g, "").trim().slice(0, 300);
        const fp = fingerprint2(item.link);
        const eventStart = item.pubDate ? new Date(item.pubDate) : /* @__PURE__ */ new Date();
        const DEDUP_TYPES = /* @__PURE__ */ new Set(["missile", "airstrike", "artillery", "explosion", "nuclear", "chemical", "massacre", "terrorism", "naval"]);
        if (DEDUP_TYPES.has(kwType) && country.code) {
          const similar = await storage.findRecentSimilar(country.code, kwType, 90);
          if (similar) continue;
        }
        const inserted = await storage.createAlertIfNew({
          title: cleanTitle.slice(0, 200),
          description: cleanDesc || `Source: ${feed.name}`,
          lat: country.lat.toString(),
          lng: country.lng.toString(),
          country: country.name,
          countryCode: country.code,
          source: item.link,
          type,
          category,
          sourceType: feed.sourceType,
          severity,
          status: "active",
          fingerprint: fp,
          severityScore: hasGroq ? 1 : getSeverityScore2(combined, kwType),
          eventStart
          // originLat/originLng set only after AI confirms missile/airstrike
        });
        if (!inserted) continue;
        seenSources.add(item.link);
        added++;
        const alertId = inserted.id;
        classifyAlert(cleanTitle, cleanDesc).then(async (ai) => {
          if (!ai) {
            await storage.updateAlert(alertId, {
              aiVerified: true,
              aiLabel: cleanTitle.slice(0, 100),
              type: kwType,
              severity: kwSeverity,
              severityScore: getSeverityScore2(combined, kwType)
            }).catch(() => {
            });
            return;
          }
          if (!ai.relevant) {
            await storage.updateAlert(alertId, { aiVerified: false, isActive: false }).catch(() => {
            });
            return;
          }
          let originData = {};
          if (ai.type === "missile" || ai.type === "airstrike") {
            const origin = detectAggressorCoords(cleanTitle, cleanDesc, country.code);
            if (origin) {
              originData = { originLat: origin.lat.toString(), originLng: origin.lng.toString() };
            }
          }
          await storage.updateAlert(alertId, {
            aiVerified: true,
            aiLabel: ai.label,
            description: ai.summary || combined.slice(0, 300),
            // résumé FR généré par Groq
            type: ai.type,
            severity: ai.severity,
            severityScore: getSeverityScore2(combined, ai.type),
            ...originData
          }).catch(() => {
          });
        }).catch(() => {
        });
        if (added >= 60) break;
      }
    } catch (err) {
      console.error(`[rss] Error fetching ${feed.name}:`, err);
    }
  }
  console.log(`[rss] \u2713 Added ${added} RSS alerts`);
  return added;
}

// server/services/country-tension.ts
var GROQ_URL2 = "https://api.groq.com/openai/v1/chat/completions";
var tensionCache = null;
var CACHE_TTL = 60 * 60 * 1e3;
var STATIC_TENSIONS = {
  UA: { baseScore: 30, name: "Ukraine", reason: "Guerre russo-ukrainienne en cours", flag: "\u{1F1FA}\u{1F1E6}" },
  RU: { baseScore: 28, name: "Russie", reason: "Invasion de l'Ukraine, sanctions OTAN", flag: "\u{1F1F7}\u{1F1FA}" },
  PS: { baseScore: 30, name: "Palestine (Gaza)", reason: "Conflit Gaza \u2014 op\xE9ration IDF", flag: "\u{1F1F5}\u{1F1F8}" },
  IL: { baseScore: 26, name: "Isra\xEBl", reason: "Guerre \xE0 Gaza, tensions Hezbollah", flag: "\u{1F1EE}\u{1F1F1}" },
  SD: { baseScore: 28, name: "Soudan", reason: "Guerre civile SAF vs RSF", flag: "\u{1F1F8}\u{1F1E9}" },
  YE: { baseScore: 26, name: "Y\xE9men", reason: "Conflit Houthis \u2014 coalition saoudienne", flag: "\u{1F1FE}\u{1F1EA}" },
  MM: { baseScore: 25, name: "Myanmar", reason: "Guerre civile post-coup d'\xC9tat", flag: "\u{1F1F2}\u{1F1F2}" },
  SS: { baseScore: 24, name: "Soudan du Sud", reason: "Conflits arm\xE9s r\xE9currents", flag: "\u{1F1F8}\u{1F1F8}" },
  SO: { baseScore: 23, name: "Somalie", reason: "Al-Shabaab \u2014 AMISOM", flag: "\u{1F1F8}\u{1F1F4}" },
  AF: { baseScore: 23, name: "Afghanistan", reason: "Talibans \u2014 r\xE9sistance arm\xE9e", flag: "\u{1F1E6}\u{1F1EB}" },
  SY: { baseScore: 22, name: "Syrie", reason: "Conflit en cours \u2014 post-Assad", flag: "\u{1F1F8}\u{1F1FE}" },
  CD: { baseScore: 22, name: "RD Congo", reason: "M23, Rwanda, conflit Est-Congo", flag: "\u{1F1E8}\u{1F1E9}" },
  KP: { baseScore: 20, name: "Cor\xE9e du Nord", reason: "Essais missiles ICBM, troupes en Russie", flag: "\u{1F1F0}\u{1F1F5}" },
  IR: { baseScore: 20, name: "Iran", reason: "Programme nucl\xE9aire, tensions r\xE9gionales", flag: "\u{1F1EE}\u{1F1F7}" },
  IQ: { baseScore: 18, name: "Irak", reason: "Milices pro-iraniennes actives", flag: "\u{1F1EE}\u{1F1F6}" },
  LY: { baseScore: 18, name: "Libye", reason: "Conflit de basse intensit\xE9 \u2014 Est/Ouest", flag: "\u{1F1F1}\u{1F1FE}" },
  ML: { baseScore: 18, name: "Mali", reason: "Sahel, groupes arm\xE9s, djihadisme", flag: "\u{1F1F2}\u{1F1F1}" },
  CF: { baseScore: 18, name: "Centrafrique", reason: "Groupes arm\xE9s, instabilit\xE9", flag: "\u{1F1E8}\u{1F1EB}" },
  NG: { baseScore: 16, name: "Nig\xE9ria", reason: "Boko Haram, ISWAP, nord-est", flag: "\u{1F1F3}\u{1F1EC}" },
  ET: { baseScore: 16, name: "\xC9thiopie", reason: "Conflit Amhara, Oromo, s\xE9quelles Tigray", flag: "\u{1F1EA}\u{1F1F9}" },
  PK: { baseScore: 15, name: "Pakistan", reason: "TTP, tensions Afghanistan-Inde", flag: "\u{1F1F5}\u{1F1F0}" },
  HT: { baseScore: 15, name: "Ha\xEFti", reason: "Gangs, effondrement de l'\xC9tat", flag: "\u{1F1ED}\u{1F1F9}" },
  TW: { baseScore: 14, name: "Ta\xEFwan", reason: "Pression militaire chinoise croissante", flag: "\u{1F1F9}\u{1F1FC}" },
  CN: { baseScore: 12, name: "Chine", reason: "D\xE9troit de Ta\xEFwan, Mer de Chine Sud", flag: "\u{1F1E8}\u{1F1F3}" },
  LB: { baseScore: 12, name: "Liban", reason: "Post-conflit Hezbollah, reconstruction", flag: "\u{1F1F1}\u{1F1E7}" },
  AZ: { baseScore: 10, name: "Azerba\xEFdjan", reason: "Post-Karabakh, tensions Arm\xE9nie", flag: "\u{1F1E6}\u{1F1FF}" },
  AM: { baseScore: 10, name: "Arm\xE9nie", reason: "Pertes Karabakh, pression azerba\xEFdjane", flag: "\u{1F1E6}\u{1F1F2}" },
  MZ: { baseScore: 10, name: "Mozambique", reason: "Insurg\xE9s jihadistes Cabo Delgado", flag: "\u{1F1F2}\u{1F1FF}" },
  VE: { baseScore: 8, name: "Venezuela", reason: "Tensions frontali\xE8res Guyana/Colombie", flag: "\u{1F1FB}\u{1F1EA}" },
  BY: { baseScore: 7, name: "Bi\xE9lorussie", reason: "Sanctions UE/US, r\xE9gime Loukachenko", flag: "\u{1F1E7}\u{1F1FE}" },
  CU: { baseScore: 5, name: "Cuba", reason: "Embargo am\xE9ricain, sanctions", flag: "\u{1F1E8}\u{1F1FA}" },
  VN: { baseScore: 5, name: "Vietnam", reason: "Disputes Mer de Chine Sud", flag: "\u{1F1FB}\u{1F1F3}" },
  PH: { baseScore: 5, name: "Philippines", reason: "Incidents Mer de Chine Sud \u2014 Chine", flag: "\u{1F1F5}\u{1F1ED}" },
  RS: { baseScore: 6, name: "Serbie", reason: "Tensions Kosovo-Serbie", flag: "\u{1F1F7}\u{1F1F8}" },
  GE: { baseScore: 5, name: "G\xE9orgie", reason: "R\xE9gions occup\xE9es, tensions pro-EU", flag: "\u{1F1EC}\u{1F1EA}" }
};
var SEVERITY_WEIGHTS = {
  critical: 25,
  high: 12,
  medium: 5,
  low: 2
};
function scoreToStatus(score) {
  if (score >= 70) return "war";
  if (score >= 50) return "high";
  if (score >= 30) return "tension";
  if (score >= 15) return "watchlist";
  if (score >= 8) return "sanctions";
  return "stable";
}
async function classifyWithGroq(apiKey) {
  const allAlerts = await storage.getAlerts();
  const now = Date.now();
  const H48 = 48 * 60 * 60 * 1e3;
  const recent = allAlerts.filter((a) => !a.timestamp || now - new Date(a.timestamp).getTime() < H48).slice(0, 80);
  if (recent.length === 0) return null;
  const alertCounts = {};
  for (const a of recent) {
    if (a.countryCode) alertCounts[a.countryCode] = (alertCounts[a.countryCode] ?? 0) + 1;
  }
  const digest = recent.slice(0, 50).map((a) => `[${a.severity?.toUpperCase()}][${a.type}][${a.countryCode ?? "?"}] ${a.aiLabel ?? a.title}`).join("\n");
  const staticList = Object.entries(STATIC_TENSIONS).map(([code, d]) => `${code}: ${d.name} (baseline: ${d.baseScore})`).join(", ");
  const prompt = `Tu es un analyste de renseignement g\xE9opolitique pour le syst\xE8me ARGOS.

Donn\xE9es d'alertes mondiales des derni\xE8res 48h (${recent.length} \xE9v\xE9nements):
${digest}

Pays avec donn\xE9es g\xE9opolitiques statiques: ${staticList}

Classifie chaque pays actif par niveau de tension. Statuts:
- "war" = guerre active ouverte (score 70-100)
- "high" = conflit arm\xE9/tension critique (score 50-70)
- "tension" = tension notable/incidents (score 30-50)
- "sanctions" = pression \xE9conomique/diplomatique (score 15-30)
- "watchlist" = \xE0 surveiller, risque faible (score 8-15)
- "stable" = stable (score < 8)

R\xE9ponds UNIQUEMENT avec du JSON valide. Format exact:
[{"code":"XX","name":"Nom du pays","status":"war","score":85,"reason":"Raison courte en fran\xE7ais (max 60 chars)","activeAlerts":3}]

Inclure TOUS les pays avec score > 5 (max 35 pays). Pas d'explication, uniquement le JSON.`;
  const resp = await fetch(GROQ_URL2, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 2e3
    })
  });
  if (!resp.ok) {
    console.error("[tension] Groq API error:", resp.status, await resp.text());
    return null;
  }
  const json = await resp.json();
  const raw = json.choices?.[0]?.message?.content ?? "";
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) {
    console.error("[tension] No JSON array in Groq response");
    return null;
  }
  const parsed = JSON.parse(match[0]);
  return parsed.map((entry) => {
    const staticData = STATIC_TENSIONS[entry.code];
    return {
      code: entry.code,
      name: entry.name || staticData?.name || entry.code,
      status: entry.status,
      score: Math.min(100, Math.max(0, entry.score)),
      activeAlerts: entry.activeAlerts ?? alertCounts[entry.code] ?? 0,
      reason: entry.reason,
      flag: staticData?.flag ?? "\u{1F30D}"
    };
  }).sort((a, b) => b.score - a.score);
}
async function computeAlgorithmic() {
  const allAlerts = await storage.getAlerts();
  const now = Date.now();
  const cutoff7d = now - 7 * 24 * 60 * 60 * 1e3;
  const cutoff30d = now - 30 * 24 * 60 * 60 * 1e3;
  const recentAlerts = allAlerts.filter((a) => {
    const isUcdp = typeof a.source === "string" && a.source.startsWith("UCDP");
    const dateMs = isUcdp && a.eventStart ? new Date(a.eventStart).getTime() : a.timestamp ? new Date(a.timestamp).getTime() : 0;
    return dateMs > (isUcdp ? cutoff30d : cutoff7d);
  });
  const countryAlertMap = {};
  for (const a of recentAlerts) {
    if (!a.countryCode) continue;
    if (!countryAlertMap[a.countryCode]) countryAlertMap[a.countryCode] = { count: 0, boost: 0 };
    countryAlertMap[a.countryCode].count++;
    const isUcdp = typeof a.source === "string" && a.source.startsWith("UCDP");
    const boost = isUcdp && typeof a.severityScore === "number" ? a.severityScore * 3 : SEVERITY_WEIGHTS[a.severity] ?? 1;
    countryAlertMap[a.countryCode].boost += boost;
  }
  const results = [];
  for (const [code, staticData] of Object.entries(STATIC_TENSIONS)) {
    const dynamic = countryAlertMap[code] || { count: 0, boost: 0 };
    const score = Math.min(100, staticData.baseScore + Math.min(dynamic.boost, 75));
    if (dynamic.count === 0 && staticData.baseScore < 5) continue;
    results.push({
      code,
      name: staticData.name,
      status: scoreToStatus(score),
      score,
      activeAlerts: dynamic.count,
      reason: staticData.reason,
      flag: staticData.flag
    });
  }
  for (const [code, dynamic] of Object.entries(countryAlertMap)) {
    if (STATIC_TENSIONS[code]) continue;
    const alertForCountry = recentAlerts.find((a) => a.countryCode === code);
    const countryName = alertForCountry?.country || code;
    const score = Math.min(100, dynamic.boost);
    results.push({
      code,
      name: countryName,
      status: scoreToStatus(score),
      score,
      activeAlerts: dynamic.count,
      reason: `${dynamic.count} incident(s) d\xE9tect\xE9(s)`,
      flag: "\u{1F30D}"
    });
  }
  return results.sort((a, b) => b.score - a.score);
}
async function getCountryTension() {
  if (tensionCache && Date.now() - tensionCache.timestamp < CACHE_TTL) {
    return tensionCache.data;
  }
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (GROQ_API_KEY) {
    try {
      console.log("[tension] Running AI classification via Groq\u2026");
      const aiResult = await classifyWithGroq(GROQ_API_KEY);
      if (aiResult && aiResult.length > 0) {
        console.log(`[tension] AI classified ${aiResult.length} countries`);
        tensionCache = { data: aiResult, timestamp: Date.now() };
        return aiResult;
      }
    } catch (err) {
      console.error("[tension] AI classification failed, using algorithmic fallback:", err);
    }
  }
  const result = await computeAlgorithmic();
  tensionCache = { data: result, timestamp: Date.now() };
  return result;
}

// server/services/nasa-firms.ts
var import_crypto4 = require("crypto");
function fingerprint3(input) {
  return (0, import_crypto4.createHash)("sha256").update(input).digest("hex").slice(0, 32);
}
function getSeverityScore3(frp) {
  if (frp >= 500) return 9;
  if (frp >= 200) return 7;
  if (frp >= 100) return 5;
  return 4;
}
var FIRMS_BASE = "https://firms.modaps.eosdis.nasa.gov/api/area/csv";
var VIIRS_SOURCES = ["VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT"];
var CONFLICT_ZONES = [
  { name: "Ukraine", bbox: "22,44,40,52", country: "Ukraine", code: "UA" },
  { name: "Gaza/Isra\xEBl", bbox: "34,29,36,33", country: "Palestine", code: "PS" },
  { name: "Liban/Syrie", bbox: "35,33,42,37", country: "Liban", code: "LB" },
  { name: "Yemen", bbox: "42,12,54,18", country: "Y\xE9men", code: "YE" },
  { name: "Soudan", bbox: "21,7,40,23", country: "Soudan", code: "SD" },
  { name: "Irak", bbox: "38,29,48,37", country: "Irak", code: "IQ" },
  { name: "Afghanistan", bbox: "60,29,75,38", country: "Afghanistan", code: "AF" },
  { name: "Myanmar", bbox: "97,16,101,28", country: "Myanmar", code: "MM" },
  { name: "Mali/Sahel", bbox: "-6,10,5,23", country: "Mali", code: "ML" },
  { name: "Est Congo", bbox: "27,-5,30,2", country: "RD Congo", code: "CD" },
  { name: "Somalie", bbox: "40,0,51,12", country: "Somalie", code: "SO" }
];
var COL2 = { LAT: 0, LNG: 1, BRIGHTNESS: 2, CONFIDENCE: 8, FRP: 11 };
function parseConfidence(conf) {
  if (conf === "h") return 100;
  if (conf === "n") return 50;
  if (conf === "l") return 10;
  return parseInt(conf) || 0;
}
function getSeverityFromFirms(brightness, frp, confidence) {
  if (confidence < 50) return null;
  if (frp < 50) return null;
  if (frp >= 500 || brightness >= 380) return "critical";
  if (frp >= 200 || brightness >= 360) return "high";
  if (frp >= 100 || brightness >= 340) return "medium";
  return null;
}
var lastFirmsTimestamps = /* @__PURE__ */ new Set();
async function fetchFirmsAlerts() {
  const apiKey = process.env.FIRMS_API_KEY;
  if (!apiKey) {
    console.log("[firms] FIRMS_API_KEY not set \u2014 skipping");
    return 0;
  }
  let added = 0;
  for (const zone of CONFLICT_ZONES) {
    try {
      let csv = "";
      for (const src of VIIRS_SOURCES) {
        const url = `${FIRMS_BASE}/${apiKey}/${src}/${zone.bbox}/1`;
        const res = await fetch(url, { signal: AbortSignal.timeout(15e3) });
        if (!res.ok) {
          console.warn(`[firms] ${zone.name} (${src}): HTTP ${res.status}`);
          continue;
        }
        const body = await res.text();
        const lineCount = body.split("\n").length - 2;
        if (lineCount > 0) {
          csv = body;
          break;
        }
      }
      if (!csv) continue;
      const lines = csv.split("\n");
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",");
        if (cols.length < 12) continue;
        const lat = parseFloat(cols[COL2.LAT]);
        const lng = parseFloat(cols[COL2.LNG]);
        const brightness = parseFloat(cols[COL2.BRIGHTNESS]);
        const confidence = parseConfidence(cols[COL2.CONFIDENCE]?.trim());
        const frp = parseFloat(cols[COL2.FRP]);
        if (isNaN(lat) || isNaN(lng) || isNaN(brightness)) continue;
        const severity = getSeverityFromFirms(brightness, frp, confidence);
        if (!severity) continue;
        const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
        if (lastFirmsTimestamps.has(key)) continue;
        lastFirmsTimestamps.add(key);
        const existingSimilar = await storage.findRecentSimilar(zone.code, "explosion", 90);
        if (existingSimilar) continue;
        const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        const fp = fingerprint3(`firms|${lat.toFixed(2)}|${lng.toFixed(2)}|${dateStr}`);
        const inserted = await storage.createAlertIfNew({
          title: `Anomalie thermique satellite \u2014 ${zone.name}`,
          description: `D\xE9tect\xE9e par VIIRS/SNPP. Luminosit\xE9: ${brightness.toFixed(0)}K, FRP: ${frp.toFixed(0)} MW, Confiance: ${confidence}%. Possible impact/explosion.`,
          lat: lat.toString(),
          lng: lng.toString(),
          country: zone.country,
          countryCode: zone.code,
          source: "https://firms.modaps.eosdis.nasa.gov",
          type: "explosion",
          category: "MILITARY",
          sourceType: "FIRMS",
          severity,
          status: "active",
          fingerprint: fp,
          severityScore: getSeverityScore3(frp),
          eventStart: /* @__PURE__ */ new Date()
        });
        if (!inserted) continue;
        added++;
        if (added >= 20) break;
      }
    } catch (err) {
      console.error(`[firms] Error for zone ${zone.name}:`, err);
    }
  }
  if (lastFirmsTimestamps.size > 500) lastFirmsTimestamps = /* @__PURE__ */ new Set();
  console.log(`[firms] \u2713 Added ${added} thermal anomaly alerts`);
  return added;
}

// server/services/ai-summary.ts
var GROQ_URL3 = "https://api.groq.com/openai/v1/chat/completions";
async function getAiSummary() {
  const b = await storage.getLatestBriefing();
  if (!b) return null;
  return {
    text: b.text,
    generatedAt: b.generatedAt?.toISOString() ?? (/* @__PURE__ */ new Date()).toISOString(),
    alertCount: b.alertCount ?? 0,
    topCountries: (() => {
      try {
        return JSON.parse(b.topCountries ?? "[]");
      } catch {
        return [];
      }
    })()
  };
}
async function refreshAiSummary() {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return null;
  const allAlerts = await storage.getAlerts();
  const H24 = 24 * 60 * 60 * 1e3;
  const recent = allAlerts.filter((a) => a.aiVerified !== false && (!a.timestamp || Date.now() - new Date(a.timestamp).getTime() < H24)).slice(0, 60);
  if (recent.length === 0) return null;
  const countryCounts = {};
  for (const a of recent) {
    if (a.country) countryCounts[a.country] = (countryCounts[a.country] ?? 0) + 1;
  }
  const topCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c);
  const digest = recent.slice(0, 40).map((a) => `[${a.severity?.toUpperCase()}][${a.type}][${a.country ?? "?"}] ${a.aiLabel ?? a.title}`).join("\n");
  const prompt = `Tu es un analyste de renseignement strat\xE9gique. Voici les ${recent.length} \xE9v\xE9nements g\xE9opolitiques des derni\xE8res 24h d\xE9tect\xE9s par le syst\xE8me ARGOS :

${digest}

R\xE9dige un BRIEFING STRAT\xC9GIQUE en fran\xE7ais, structur\xE9 ainsi :
1. **Situation g\xE9n\xE9rale** (2-3 phrases synth\xE9tisant les foyers actifs)
2. **Foyers prioritaires** (liste des 3-4 zones les plus critiques avec 1 phrase chacune)
3. **Tendances \xE0 surveiller** (1-2 d\xE9veloppements \xE9mergents)

Style : concis, militaire, factuel. Maximum 200 mots. Pas de markdown superflu, que du contenu.`;
  try {
    const res = await fetch(GROQ_URL3, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.3
      }),
      signal: AbortSignal.timeout(15e3)
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error(`[ai-summary] Groq HTTP ${res.status}: ${errBody.slice(0, 200)}`);
      return null;
    }
    const data = await res.json();
    const text2 = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text2) return null;
    const saved = await storage.saveBriefing({ text: text2, alertCount: recent.length, topCountries });
    console.log(`[ai-summary] Saved briefing #${saved.id} (${recent.length} alerts, ${text2.length} chars)`);
    return {
      text: text2,
      generatedAt: saved.generatedAt?.toISOString() ?? (/* @__PURE__ */ new Date()).toISOString(),
      alertCount: recent.length,
      topCountries
    };
  } catch (e) {
    console.error("[ai-summary] Failed:", e?.message ?? e);
    return null;
  }
}

// server/services/ai-chat.ts
var GROQ_URL4 = "https://api.groq.com/openai/v1/chat/completions";
var SYSTEM_PROMPT2 = `Tu es ARGOS, un analyste de renseignement g\xE9opolitique militaire de niveau strat\xE9gique.
Tu as acc\xE8s en temps r\xE9el aux alertes de la base de donn\xE9es du syst\xE8me ARGOS Intelligence.

R\xE9ponds en fran\xE7ais, de fa\xE7on concise et factuelle. Style : militaire, professionnel.
- Structure ta r\xE9ponse en paragraphes distincts, un par zone g\xE9ographique ou sujet
- Commence chaque paragraphe par le nom du pays/zone en gras : **Ukraine**, **Gaza**, etc.
- Cite les donn\xE9es de la base quand pertinent
- Pour les questions hors g\xE9opolitique/s\xE9curit\xE9, r\xE9ponds bri\xE8vement
- Ne sp\xE9cule pas sur des informations non confirm\xE9es
- Limite : 300 mots maximum`;
var requestLog = [];
var RATE_LIMIT = 6;
function checkRateLimit() {
  const now = Date.now();
  const windowStart = now - 6e4;
  while (requestLog.length > 0 && requestLog[0] < windowStart) requestLog.shift();
  if (requestLog.length >= RATE_LIMIT) return false;
  requestLog.push(now);
  return true;
}
function nextAvailableIn() {
  if (requestLog.length < RATE_LIMIT) return 0;
  const oldest = requestLog[0];
  return Math.max(0, 6e4 - (Date.now() - oldest));
}
async function buildChatMessages(messages, countryFilter) {
  const allAlerts = await storage.getAlerts();
  const H24 = 24 * 60 * 60 * 1e3;
  let recent = allAlerts.filter((a) => a.aiVerified !== false && (!a.timestamp || Date.now() - new Date(a.timestamp).getTime() < H24)).slice(0, 50);
  if (countryFilter) {
    recent = recent.filter(
      (a) => a.countryCode === countryFilter || a.country?.toLowerCase().includes(countryFilter.toLowerCase())
    );
  }
  const digest = recent.length > 0 ? recent.slice(0, 35).map((a) => `[${a.severity?.toUpperCase()}][${a.type}][${a.country ?? "?"}] ${a.aiLabel ?? a.title}`).join("\n") : "Aucune alerte active.";
  return [
    { role: "system", content: SYSTEM_PROMPT2 },
    {
      role: "user",
      content: `=== DONN\xC9ES ARGOS TEMPS R\xC9EL (${recent.length} evt / 24h) ===
${digest}
=== FIN ===`
    },
    {
      role: "assistant",
      content: "Donn\xE9es re\xE7ues. Pr\xEAt."
    },
    ...messages
  ];
}
async function streamChatWithArgos(messages, write, end, countryFilter) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    write('data: {"error":"GROQ_API_KEY manquant"}\n\n');
    end();
    return;
  }
  if (!checkRateLimit()) {
    const wait = Math.ceil(nextAvailableIn() / 1e3);
    write(`data: {"error":"Limite atteinte. R\xE9essayez dans ${wait}s."}

`);
    end();
    return;
  }
  const fullMessages = await buildChatMessages(messages, countryFilter);
  try {
    const groqRes = await fetch(GROQ_URL4, {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: fullMessages,
        max_tokens: 600,
        temperature: 0.4,
        stream: true
      }),
      signal: AbortSignal.timeout(25e3)
    });
    if (!groqRes.ok || !groqRes.body) {
      write(`data: {"error":"Groq ${groqRes.status}"}

`);
      end();
      return;
    }
    const reader = groqRes.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      write(decoder.decode(value, { stream: true }));
    }
    end();
  } catch (e) {
    console.warn("[ai-chat] stream error:", e);
    write('data: {"error":"Erreur r\xE9seau"}\n\n');
    end();
  }
}

// server/routes.ts
init_db();
async function registerRoutes(httpServer2, app2) {
  await runMigrations();
  pool.query(`DELETE FROM alerts WHERE source_type = 'GDELT'`).then((r) => {
    if (r.rowCount) console.log(`[db] Purged ${r.rowCount} GDELT alerts`);
  }).catch(() => {
  });
  storage.deleteOldAlerts(72).catch(() => {
  });
  async function seedDatabase() {
    const existingAlerts = await storage.getAlerts();
    if (existingAlerts.length === 0) {
      console.log("Seeding database with initial alerts...");
      const seeds = [
        {
          title: "Frappe a\xE9rienne \u2014 Gaza City",
          description: "Acteurs: IL MIL / PS MIL. Secteur: Gaza City, Palestine. Indice Goldstein: -10.0/10.",
          lat: "31.5",
          lng: "34.4",
          country: "Palestine",
          countryCode: "PS",
          source: null,
          type: "airstrike",
          category: "MILITARY",
          sourceType: "MANUAL",
          severity: "critical",
          status: "active"
        },
        {
          title: "Bombardement d'artillerie \u2014 Kharkiv Oblast",
          description: "Acteurs: RU MILX / UA MIL. Secteur: Kharkiv, Ukraine. Indice Goldstein: -8.5/10.",
          lat: "50.0",
          lng: "36.2",
          country: "Ukraine",
          countryCode: "UA",
          source: null,
          type: "artillery",
          category: "MILITARY",
          sourceType: "MANUAL",
          severity: "critical",
          status: "active"
        },
        {
          title: "Op\xE9ration militaire \u2014 Pyongyang",
          description: "Acteurs: KP MILX. Secteur: Pyongyang, Cor\xE9e du Nord. Indice Goldstein: -9.0/10.",
          lat: "39.0",
          lng: "125.8",
          country: "Cor\xE9e du Nord",
          countryCode: "KP",
          source: null,
          type: "missile",
          category: "MILITARY",
          sourceType: "MANUAL",
          severity: "critical",
          status: "active"
        },
        {
          title: "Assaut arm\xE9 \u2014 D\xE9troit de Ta\xEFwan",
          description: "Man\u0153uvres militaires PLA \u2014 zone d'exclusion. Secteur: Taiwan Strait. Indice Goldstein: -7.0/10.",
          lat: "24.5",
          lng: "122.0",
          country: "Ta\xEFwan",
          countryCode: "TW",
          source: null,
          type: "conflict",
          category: "MILITARY",
          sourceType: "MANUAL",
          severity: "high",
          status: "active"
        },
        {
          title: "Coup d'\xC9tat \u2014 Bamako",
          description: "Junta militaire \u2014 dissolution du gouvernement. Secteur: Mali.",
          lat: "12.6",
          lng: "-8.0",
          country: "Mali",
          countryCode: "ML",
          source: null,
          type: "coup",
          category: "POLITICAL",
          sourceType: "MANUAL",
          severity: "high",
          status: "active"
        },
        {
          title: "Sanctions \xE9conomiques \u2014 Moscou",
          description: "Nouvelles sanctions OTAN contre le secteur \xE9nerg\xE9tique russe.",
          lat: "55.7",
          lng: "37.6",
          country: "Russie",
          countryCode: "RU",
          source: null,
          type: "sanctions",
          category: "POLITICAL",
          sourceType: "MANUAL",
          severity: "medium",
          status: "active"
        },
        {
          title: "Attaque terroriste \u2014 Mogadiscio",
          description: "Attentat Al-Shabaab dans le centre gouvernemental. Secteur: Mogadiscio, Somalie.",
          lat: "2.0",
          lng: "45.3",
          country: "Somalie",
          countryCode: "SO",
          source: null,
          type: "terrorism",
          category: "HUMANITARIAN",
          sourceType: "MANUAL",
          severity: "high",
          status: "active"
        },
        {
          title: "Massacre de masse \u2014 Darfour",
          description: "Violences RSF contre des civils. Secteur: Darfour, Soudan. Victimes report\xE9es.",
          lat: "13.5",
          lng: "25.0",
          country: "Soudan",
          countryCode: "SD",
          source: null,
          type: "massacre",
          category: "HUMANITARIAN",
          sourceType: "MANUAL",
          severity: "critical",
          status: "active"
        },
        {
          title: "Cyberattaque d'infrastructure \u2014 Kiev",
          description: "Attaque cybernetique sur le r\xE9seau \xE9lectrique ukrainien. Source: CERT-UA.",
          lat: "50.4",
          lng: "30.5",
          country: "Ukraine",
          countryCode: "UA",
          source: null,
          type: "cyber",
          category: "MILITARY",
          sourceType: "MANUAL",
          severity: "high",
          status: "active"
        },
        {
          title: "Manifestation arm\xE9e \u2014 Caracas",
          description: "Opposants arm\xE9s dans les rues de Caracas. Tensions politiques extr\xEAmes.",
          lat: "10.5",
          lng: "-66.9",
          country: "Venezuela",
          countryCode: "VE",
          source: null,
          type: "protest",
          category: "GEOPOLITICAL",
          sourceType: "MANUAL",
          severity: "medium",
          status: "active"
        },
        {
          title: "Explosion \u2014 Kaboul",
          description: "Explosion dans un march\xE9 central. Taliban revendiquent la zone.",
          lat: "34.5",
          lng: "69.2",
          country: "Afghanistan",
          countryCode: "AF",
          source: null,
          type: "explosion",
          category: "MILITARY",
          sourceType: "MANUAL",
          severity: "high",
          status: "active"
        },
        {
          title: "Blocus naval \u2014 Mer de Chine Sud",
          description: "Navires militaires chinois bloquent les eaux revendiqu\xE9es. Zone: Spratley Islands.",
          lat: "9.5",
          lng: "113.0",
          country: "Chine",
          countryCode: "CN",
          source: null,
          type: "naval",
          category: "MILITARY",
          sourceType: "MANUAL",
          severity: "medium",
          status: "active"
        },
        {
          title: "Alerte s\xE9curitaire \u2014 Liban Sud",
          description: "Mouvements de troupes signal\xE9s pr\xE8s de la fronti\xE8re isra\xE9lienne. UNIFIL alerte.",
          lat: "33.2",
          lng: "35.6",
          country: "Liban",
          countryCode: "LB",
          source: null,
          type: "warning",
          category: "GEOPOLITICAL",
          sourceType: "MANUAL",
          severity: "medium",
          status: "active"
        }
      ];
      for (const seed of seeds) {
        await storage.createAlert(seed);
      }
    }
    const existingKeys = await storage.getApiKeys();
    if (existingKeys.length === 0) {
      await storage.createApiKey({
        name: "Default Discord Bot",
        key: "astral_test_key_12345"
      });
    }
  }
  seedDatabase().catch(console.error);
  app2.get(api.alerts.list.path, async (req, res) => {
    try {
      const alertsList = await storage.getAlerts();
      res.json(alertsList);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/events", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();
    const rawLastId = req.headers["last-event-id"];
    const lastId = rawLastId ? parseInt(rawLastId, 10) : 0;
    if (lastId > 0) {
      try {
        const missed = await storage.getAlertsAfter(lastId);
        for (const alert of missed) {
          res.write(`id: ${alert.id}
data: ${JSON.stringify({ type: "alert_created", payload: alert })}

`);
        }
      } catch {
      }
    }
    addSseClient(res);
    const keepalive = setInterval(() => {
      res.write(": keepalive\n\n");
    }, 15e3);
    const autoClose = setTimeout(() => {
      clearInterval(keepalive);
      removeSseClient(res);
      res.end();
    }, 2e4);
    req.on("close", () => {
      clearInterval(keepalive);
      clearTimeout(autoClose);
      removeSseClient(res);
    });
  });
  app2.get("/api/alerts/country/:code", async (req, res) => {
    try {
      const alerts3 = await storage.getAlertsByCountry(req.params.code.toUpperCase());
      res.json(alerts3);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get(api.alerts.get.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const alert = await storage.getAlert(id);
      if (!alert) return res.status(404).json({ message: "Alert not found" });
      res.json(alert);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post(api.alerts.create.path, async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Bearer token required" });
      }
      const key = authHeader.split(" ")[1];
      const isValid = await storage.validateApiKey(key);
      if (!isValid) return res.status(401).json({ message: "Invalid API Key" });
      const input = api.alerts.create.input.parse(req.body);
      const newAlert = await storage.createAlert(input);
      broadcast("alert_created", newAlert);
      broadcastSse("alert_created", newAlert, newAlert.id);
      res.status(201).json(newAlert);
    } catch (err) {
      if (err instanceof import_zod2.z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.put(api.alerts.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.alerts.update.input.parse(req.body);
      const existing = await storage.getAlert(id);
      if (!existing) return res.status(404).json({ message: "Alert not found" });
      const updated = await storage.updateAlert(id, input);
      broadcast("alert_updated", updated);
      broadcastSse("alert_updated", updated, updated.id);
      res.json(updated);
    } catch (err) {
      if (err instanceof import_zod2.z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete(api.alerts.delete.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      await storage.deleteAlert(id);
      broadcast("alert_deleted", { id });
      broadcastSse("alert_deleted", { id });
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/gdelt/trigger", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Bearer token required" });
      }
      const isValid = await storage.validateApiKey(authHeader.split(" ")[1]);
      if (!isValid) return res.status(401).json({ message: "Invalid API Key" });
      const count = await fetchGdeltEvents();
      if (count > 0) broadcast("gdelt_refresh", { count });
      res.json({ message: `GDELT fetch complete`, newAlerts: count });
    } catch (err) {
      res.status(500).json({ message: "GDELT fetch failed" });
    }
  });
  app2.post("/api/rss/trigger", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Bearer token required" });
      }
      const isValid = await storage.validateApiKey(authHeader.split(" ")[1]);
      if (!isValid) return res.status(401).json({ message: "Invalid API Key" });
      const count = await fetchRssAlerts();
      if (count > 0) {
        broadcast("rss_refresh", { count });
        broadcastSse("rss_refresh", { count });
      }
      res.json({ message: `RSS fetch complete`, newAlerts: count });
    } catch (err) {
      res.status(500).json({ message: "RSS fetch failed" });
    }
  });
  app2.post("/api/firms/trigger", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Bearer token required" });
      }
      const isValid = await storage.validateApiKey(authHeader.split(" ")[1]);
      if (!isValid) return res.status(401).json({ message: "Invalid API Key" });
      const count = await fetchFirmsAlerts();
      if (count > 0) broadcast("firms_refresh", { count });
      res.json({ message: `NASA FIRMS fetch complete`, newAlerts: count });
    } catch (err) {
      res.status(500).json({ message: "FIRMS fetch failed" });
    }
  });
  app2.post("/api/alerts/cleanup", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Bearer token required" });
      }
      const isValid = await storage.validateApiKey(authHeader.split(" ")[1]);
      if (!isValid) return res.status(401).json({ message: "Invalid API Key" });
      const hours = Number(req.body?.hours ?? 48);
      const deleted = await storage.deleteOldAlerts(hours);
      broadcast("alerts_cleanup", { deleted });
      res.json({ message: `Deleted ${deleted} alerts older than ${hours}h`, deleted });
    } catch (err) {
      res.status(500).json({ message: "Cleanup failed" });
    }
  });
  app2.get("/api/summary", async (_req, res) => {
    try {
      const summary = await getAiSummary();
      if (!summary) {
        if (process.env.GROQ_API_KEY) {
          refreshAiSummary().catch(() => {
          });
        }
        return res.json(null);
      }
      res.json(summary);
    } catch {
      res.status(500).json({ message: "Summary failed" });
    }
  });
  app2.post("/api/chat", async (req, res) => {
    let body = req.body;
    if (!body?.messages) {
      if (body?.type === "Buffer" && Array.isArray(body?.data)) {
        try {
          body = JSON.parse(Buffer.from(body.data).toString("utf8"));
        } catch {
        }
      }
    }
    if (!body?.messages) {
      const raw = req.rawBody;
      if (raw?.length) {
        try {
          body = JSON.parse(raw.toString("utf8"));
        } catch {
        }
      }
    }
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const countryFilter = body?.countryFilter;
    if (messages.length === 0) {
      const diag = `ct=${req.headers["content-type"] ?? "none"} | body=${JSON.stringify(body ?? req.body)} | rawBody=${req.rawBody ? "ok" : "missing"}`;
      console.warn("[chat] 400 \u2014", diag);
      return res.status(400).json({ message: `messages array required \u2014 debug: ${diag}` });
    }
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ message: "Cl\xE9 GROQ_API_KEY manquante sur le serveur" });
    }
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();
    const waitMs = nextAvailableIn();
    if (waitMs > 0) {
      res.write(`data: {"wait":${Math.ceil(waitMs / 1e3)}}

`);
      return res.end();
    }
    await streamChatWithArgos(
      messages,
      (chunk) => res.write(chunk),
      () => res.end(),
      countryFilter
    );
  });
  app2.post("/api/summary/refresh", async (_req, res) => {
    try {
      const summary = await refreshAiSummary();
      if (!summary) return res.status(503).json({ message: "Refresh failed" });
      res.json(summary);
    } catch {
      res.status(500).json({ message: "Refresh failed" });
    }
  });
  app2.get("/api/briefings", async (_req, res) => {
    try {
      const list = await storage.getAllBriefings();
      res.json(list.map((b) => ({
        ...b,
        topCountries: (() => {
          try {
            return JSON.parse(b.topCountries ?? "[]");
          } catch {
            return [];
          }
        })()
      })));
    } catch {
      res.status(500).json({ message: "Failed to fetch briefings" });
    }
  });
  app2.get("/api/countries/tension", async (_req, res) => {
    try {
      const tensions = await getCountryTension();
      res.json(tensions);
    } catch (err) {
      res.status(500).json({ message: "Tension fetch failed" });
    }
  });
  app2.get("/api/health", async (_req, res) => {
    let dbOk = false;
    try {
      await pool.query("SELECT 1");
      dbOk = true;
    } catch {
    }
    const groqOk = !!process.env.GROQ_API_KEY;
    if (!dbOk) {
      return res.status(503).json({
        status: "error",
        db: false,
        groq: groqOk,
        message: "Database unreachable"
      });
    }
    return res.json({
      status: "ok",
      db: true,
      groq: groqOk
    });
  });
  app2.get("/api/stats", async (_req, res) => {
    try {
      const all = await storage.getAlerts();
      const byType = {};
      const bySeverity = {};
      const byCategory = {};
      const bySourceType = {};
      const byCountry = {};
      for (const a of all) {
        byType[a.type] = (byType[a.type] || 0) + 1;
        bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1;
        if (a.category) byCategory[a.category] = (byCategory[a.category] || 0) + 1;
        if (a.sourceType) bySourceType[a.sourceType] = (bySourceType[a.sourceType] || 0) + 1;
        if (a.country) byCountry[a.country] = (byCountry[a.country] || 0) + 1;
      }
      const topCountries = Object.entries(byCountry).sort(([, a], [, b]) => b - a).slice(0, 10).map(([country, count]) => ({ country, count }));
      res.json({ total: all.length, byType, bySeverity, byCategory, bySourceType, topCountries });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get(api.keys.list.path, async (req, res) => {
    try {
      const keys = await storage.getApiKeys();
      res.json(keys);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post(api.keys.create.path, async (req, res) => {
    try {
      const input = api.keys.create.input.parse(req.body);
      const newKey = await storage.createApiKey(input);
      res.status(201).json(newKey);
    } catch (err) {
      if (err instanceof import_zod2.z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete(api.keys.delete.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      await storage.deleteApiKey(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/admin/auth", async (req, res) => {
    const { password } = req.body ?? {};
    const adminPassword = process.env.ADMIN_PASSWORD || "ASTRAL-ADM-8841";
    if (password === adminPassword) {
      res.json({ ok: true });
    } else {
      res.status(403).json({ error: "Unauthorized" });
    }
  });
  function requireAdmin(req, res, next) {
    const key = req.headers["x-admin-key"];
    const adminPassword = process.env.ADMIN_PASSWORD || "ASTRAL-ADM-8841";
    if (key !== adminPassword) return res.status(403).json({ error: "Unauthorized" });
    next();
  }
  app2.get("/api/admin/webhooks", requireAdmin, async (_req, res) => {
    try {
      const result = await pool.query("SELECT * FROM discord_webhooks ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "DB error" });
    }
  });
  app2.post("/api/admin/webhooks", requireAdmin, async (req, res) => {
    const { name, url } = req.body ?? {};
    if (!name || !url) return res.status(400).json({ error: "name and url required" });
    if (!url.startsWith("https://discord.com/api/webhooks/")) {
      return res.status(400).json({ error: "Invalid Discord webhook URL" });
    }
    try {
      const result = await pool.query(
        "INSERT INTO discord_webhooks (name, url, active) VALUES ($1, $2, true) RETURNING *",
        [name, url]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      if (err.code === "23505") return res.status(409).json({ error: "URL already registered" });
      res.status(500).json({ error: "DB error" });
    }
  });
  app2.patch("/api/admin/webhooks/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const { active } = req.body ?? {};
    await pool.query("UPDATE discord_webhooks SET active = $1 WHERE id = $2", [active, id]);
    res.json({ ok: true });
  });
  app2.delete("/api/admin/webhooks/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    await pool.query("DELETE FROM discord_webhooks WHERE id = $1", [id]);
    res.json({ ok: true });
  });
  return httpServer2;
}

// server/static.ts
var import_express = __toESM(require("express"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
function serveStatic(app2) {
  if (process.env.VERCEL) return;
  const distPath = import_path.default.resolve(__dirname, "public");
  if (!import_fs.default.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(import_express.default.static(distPath));
  app2.use("/{*path}", (_req, res) => {
    res.sendFile(import_path.default.resolve(distPath, "index.html"));
  });
}

// api/index.ts
var app = (0, import_express2.default)();
app.use("/api/chat", import_express2.default.raw({ type: "*/*", limit: "2mb" }), (req, _res, next) => {
  if (Buffer.isBuffer(req.body)) {
    try {
      req.body = JSON.parse(req.body.toString("utf8"));
    } catch {
      req.body = {};
    }
  }
  next();
});
app.use(import_express2.default.json({
  type: (req) => {
    const ct = (req.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
    if (ct === "application/json" || ct === "text/plain") return true;
    if (req.method === "POST" && typeof req.url === "string" && req.url.startsWith("/api")) return true;
    return false;
  },
  verify: (_req, _res, buf) => {
    _req.rawBody = buf;
  }
}));
app.use(import_express2.default.urlencoded({ extended: false }));
app.get("/api/ping", (_req, res) => {
  res.json({ ok: true, ts: Date.now(), env: !!process.env.DATABASE_URL });
});
var httpServer = (0, import_http.createServer)(app);
var initPromise = null;
function ensureReady() {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await registerRoutes(httpServer, app);
        serveStatic(app);
        app.use((err, _req, res, _next) => {
          const status = err.status || err.statusCode || 500;
          const message = err.message || "Internal Server Error";
          if (res.headersSent) return;
          res.status(status).json({ message });
        });
        console.log("[api] Routes registered OK");
      } catch (err) {
        console.error("[api] Init error:", err);
      }
    })();
  }
  return initPromise;
}
async function handler(req, res) {
  if (req.url === "/api/ping" || req.path === "/api/ping") {
    res.json({ ok: true, ts: Date.now() });
    return;
  }
  await ensureReady();
  app(req, res);
}
