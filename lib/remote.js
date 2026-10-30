var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __knownSymbol = (name, symbol) => (symbol = Symbol[name]) ? symbol : /* @__PURE__ */ Symbol.for("Symbol." + name);
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __decoratorStart = (base) => [, , , __create(base?.[__knownSymbol("metadata")] ?? null)];
var __decoratorStrings = ["class", "method", "getter", "setter", "accessor", "field", "value", "get", "set"];
var __expectFn = (fn) => fn !== void 0 && typeof fn !== "function" ? __typeError("Function expected") : fn;
var __decoratorContext = (kind, name, done, metadata, fns) => ({ kind: __decoratorStrings[kind], name, metadata, addInitializer: (fn) => done._ ? __typeError("Already initialized") : fns.push(__expectFn(fn || null)) });
var __decoratorMetadata = (array, target) => __defNormalProp(target, __knownSymbol("metadata"), array[3]);
var __runInitializers = (array, flags, self, value) => {
  for (var i = 0, fns = array[flags >> 1], n = fns && fns.length; i < n; i++) flags & 1 ? fns[i].call(self) : value = fns[i].call(self, value);
  return value;
};
var __decorateElement = (array, flags, name, decorators, target, extra) => {
  var fn, it, done, ctx, access, k = flags & 7, s = !!(flags & 8), p = !!(flags & 16);
  var j = k > 3 ? array.length + 1 : k ? s ? 1 : 2 : 0, key = __decoratorStrings[k + 5];
  var initializers = k > 3 && (array[j - 1] = []), extraInitializers = array[j] || (array[j] = []);
  var desc = k && (!p && !s && (target = target.prototype), k < 5 && (k > 3 || !p) && __getOwnPropDesc(k < 4 ? target : { get [name]() {
    return __privateGet(this, extra);
  }, set [name](x) {
    return __privateSet(this, extra, x);
  } }, name));
  k ? p && k < 4 && __name(extra, (k > 2 ? "set " : k > 1 ? "get " : "") + name) : __name(target, name);
  for (var i = decorators.length - 1; i >= 0; i--) {
    ctx = __decoratorContext(k, name, done = {}, array[3], extraInitializers);
    if (k) {
      ctx.static = s, ctx.private = p, access = ctx.access = { has: p ? (x) => __privateIn(target, x) : (x) => name in x };
      if (k ^ 3) access.get = p ? (x) => (k ^ 1 ? __privateGet : __privateMethod)(x, target, k ^ 4 ? extra : desc.get) : (x) => x[name];
      if (k > 2) access.set = p ? (x, y) => __privateSet(x, target, y, k ^ 4 ? extra : desc.set) : (x, y) => x[name] = y;
    }
    it = (0, decorators[i])(k ? k < 4 ? p ? extra : desc[key] : k > 4 ? void 0 : { get: desc.get, set: desc.set } : target, ctx), done._ = 1;
    if (k ^ 4 || it === void 0) __expectFn(it) && (k > 4 ? initializers.unshift(it) : k ? p ? extra = it : desc[key] = it : target = it);
    else if (typeof it !== "object" || it === null) __typeError("Object expected");
    else __expectFn(fn = it.get) && (desc.get = fn), __expectFn(fn = it.set) && (desc.set = fn), __expectFn(fn = it.init) && initializers.unshift(fn);
  }
  return k || __decoratorMetadata(array, target), desc && __defProp(target, name, desc), p ? k ^ 4 ? extra : desc : target;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateIn = (member, obj) => Object(obj) !== obj ? __typeError('Cannot use the "in" operator on this value') : member.has(obj);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

// src/remote.ts
import { Remote, RemoteError, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";

// src/catalog.ts
import {
  cpSync,
  existsSync as existsSync2,
  mkdirSync as mkdirSync2,
  readdirSync,
  readFileSync as readFileSync2,
  renameSync,
  rmSync,
  writeFileSync as writeFileSync2
} from "node:fs";
import { join as join2 } from "node:path";
import { fileURLToPath } from "node:url";

// src/errors.ts
var SkillExpertsError = class extends Error {
  /**
   * @param reason - stable token for Client `error.<reason>` lookup.
   * @param message - English diagnostic for logs / RemoteError.message.
   */
  constructor(reason, message) {
    super(message);
    this.reason = reason;
  }
  reason;
  name = "SkillExpertsError";
};
function isSkillExpertsError(value) {
  return value instanceof SkillExpertsError;
}

// src/custom-env-bridge.ts
function isCustomEnvApi(value) {
  if (value === null || typeof value !== "object") return false;
  const candidate = value;
  return typeof candidate.setVars === "function" && typeof candidate.removeVars === "function";
}
function getCustomEnv(ctx) {
  const value = ctx.get("customEnv");
  return isCustomEnvApi(value) ? value : void 0;
}
function requireCustomEnv(ctx) {
  const api = getCustomEnv(ctx);
  if (api === void 0) {
    throw new SkillExpertsError(
      "custom-env-missing",
      "custom-env plugin is not installed or not loaded"
    );
  }
  return api;
}
function customEnvAvailable(ctx) {
  return getCustomEnv(ctx) !== void 0;
}
async function syncEnvToCustomEnv(api, previous, next) {
  const nextNames = new Set(next.map((entry) => entry.name));
  const removed = previous.map((entry) => entry.name).filter((name) => !nextNames.has(name));
  if (removed.length > 0) await api.removeVars(removed);
  if (next.length > 0) await api.setVars(next);
}

// src/export-slug.ts
import { pinyin } from "pinyin-pro";
function exportSlug(name) {
  const trimmed = name.trim();
  if (trimmed === "") return "expert";
  const romanized = pinyin(trimmed, {
    toneType: "none",
    type: "array",
    nonZh: "consecutive"
  }).map((part) => String(part).toLowerCase()).join("-");
  const slug = romanized.replace(/[^a-z0-9]+/gu, "-").replace(/^-+|-+$/gu, "").replace(/-{2,}/gu, "-");
  return slug === "" ? "expert" : slug;
}

// src/paths.ts
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { resolveDshHome } from "@deepseek-ai/dsh-home-paths";
function expertsRoot() {
  const root = join(resolveDshHome(), "skill-experts");
  mkdirSync(root, { recursive: true });
  return root;
}
function catalogPath() {
  return join(expertsRoot(), "catalog.json");
}
function statePath() {
  return join(expertsRoot(), "state.json");
}
function continuePath() {
  return join(expertsRoot(), "continue.json");
}
function expertDir(id) {
  return join(expertsRoot(), id);
}
function expertMetaPath(id) {
  return join(expertDir(id), "meta.json");
}
function expertSkillsDir(id) {
  return join(expertDir(id), "skills");
}
function skillDir(expertId, skillName) {
  return join(expertSkillsDir(expertId), skillName);
}
function skillMdPath(expertId, skillName) {
  return join(skillDir(expertId, skillName), "SKILL.md");
}
function presetIdFor(expertId) {
  return `skill-expert-${expertId}`;
}
function isKebabName(value) {
  return /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(value);
}

// src/skill-md.ts
import { parse as parseYaml } from "yaml";
function parseSkillMd(raw, path) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(raw);
  if (match?.[1] === void 0) throw new Error(`${path}: missing YAML frontmatter`);
  const metadata = parseYaml(match[1]);
  if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) {
    throw new Error(`${path}: frontmatter must be a mapping`);
  }
  const record = metadata;
  const name = record.name;
  const description = record.description;
  if (typeof name !== "string" || name.trim() === "") throw new Error(`${path}: name is required`);
  if (typeof description !== "string" || description.trim() === "") throw new Error(`${path}: description is required`);
  return {
    frontmatter: { name: name.trim(), description: description.trim() },
    prompt: raw.slice(match[0].length).replace(/^\r?\n/u, ""),
    raw
  };
}
function serializeSkillMd(fields) {
  const lines = [
    "---",
    `name: ${yamlScalar(fields.name)}`,
    `description: ${yamlScalar(fields.description)}`,
    "---",
    "",
    fields.prompt.replace(/^\uFEFF/u, "").replace(/\s+$/u, ""),
    ""
  ];
  return lines.join("\n");
}
function yamlScalar(value) {
  if (/^[\w./@+-]+$/u.test(value) && !/^(?:true|false|null|yes|no|on|off)$/iu.test(value)) return value;
  return JSON.stringify(value);
}

// src/state.ts
import { existsSync, readFileSync, writeFileSync } from "node:fs";
function readRaw() {
  const path = statePath();
  if (!existsSync(path)) return { revision: 0, enabled: [] };
  try {
    const raw = JSON.parse(readFileSync(path, "utf8"));
    return {
      revision: typeof raw.revision === "number" ? raw.revision : 0,
      enabled: Array.isArray(raw.enabled) ? raw.enabled.filter((id) => typeof id === "string") : []
    };
  } catch {
    return { revision: 0, enabled: [] };
  }
}
function writeRaw(state) {
  writeFileSync(statePath(), `${JSON.stringify(state, void 0, 2)}
`, "utf8");
}
function enabledSet() {
  return new Set(readRaw().enabled);
}
function ensureState(knownIds) {
  const path = statePath();
  if (!existsSync(path)) {
    const state = { revision: 1, enabled: [...knownIds] };
    writeRaw(state);
    return state;
  }
  const current = readRaw();
  const known = new Set(knownIds);
  const enabled = current.enabled.filter((id) => known.has(id));
  if (enabled.length === current.enabled.length) return current;
  const next = { revision: current.revision + 1, enabled };
  writeRaw(next);
  return next;
}
function setExpertEnabled(id, enabled, knownIds) {
  const known = new Set(knownIds);
  if (!known.has(id)) throw new SkillExpertsError("expert-not-found", `expert "${id}" not found`);
  const current = ensureState(knownIds);
  const nextEnabled = new Set(current.enabled.filter((item) => known.has(item)));
  if (enabled) nextEnabled.add(id);
  else nextEnabled.delete(id);
  const next = { revision: current.revision + 1, enabled: [...nextEnabled].sort() };
  writeRaw(next);
  return next;
}
function forgetExpert(id, knownIds) {
  const current = readRaw();
  const known = new Set(knownIds);
  const enabled = current.enabled.filter((item) => item !== id && known.has(item));
  if (enabled.length === current.enabled.length) return;
  writeRaw({ revision: current.revision + 1, enabled });
}
function enableNewExpert(id, knownIds) {
  setExpertEnabled(id, true, knownIds);
}

// src/catalog.ts
var ENV_NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/u;
function normalizeEnvVars(raw) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const item of raw) {
    const name = item.name.trim();
    const value = typeof item.value === "string" ? item.value : "";
    if (name === "") continue;
    if (!ENV_NAME_RE.test(name)) {
      throw new SkillExpertsError("env-name-invalid", `invalid env name "${name}"`);
    }
    if (seen.has(name)) {
      throw new SkillExpertsError("env-name-duplicate", `duplicate env name "${name}"`);
    }
    seen.add(name);
    out.push({ name, value });
  }
  return out;
}
function parseEnvVars(raw) {
  if (!Array.isArray(raw)) return [];
  const loose = [];
  for (const item of raw) {
    if (item === null || typeof item !== "object") continue;
    const row = item;
    if (typeof row.name !== "string") continue;
    const name = row.name.trim();
    if (name === "") continue;
    const value = typeof row.value === "string" ? row.value : "";
    loose.push({ name, value });
  }
  try {
    return normalizeEnvVars(loose);
  } catch {
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    for (const entry of loose) {
      if (!ENV_NAME_RE.test(entry.name) || seen.has(entry.name)) continue;
      seen.add(entry.name);
      out.push(entry);
    }
    return out;
  }
}
var SEED_BUILTIN_IDS = /* @__PURE__ */ new Set();
function seedIds(seedRoot) {
  if (!existsSync2(seedRoot)) return [];
  return readdirSync(seedRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}
function retireAbsentSeedBuiltins(experts, seedIdSet) {
  let next = [...experts];
  let changed = false;
  for (const id of experts) {
    if (seedIdSet.has(id)) continue;
    const metaPath = expertMetaPath(id);
    if (!existsSync2(metaPath)) {
      next = next.filter((item) => item !== id);
      forgetExpert(id, next);
      changed = true;
      continue;
    }
    let isBuiltin = false;
    try {
      isBuiltin = readMeta(id).builtin === true;
    } catch {
      continue;
    }
    if (!isBuiltin) continue;
    rmSync(expertDir(id), { recursive: true, force: true });
    next = next.filter((item) => item !== id);
    forgetExpert(id, next);
    changed = true;
  }
  return { experts: next, changed };
}
function resolveBuiltin(id, rawBuiltin) {
  if (rawBuiltin === true) return true;
  if (rawBuiltin === false) return false;
  return SEED_BUILTIN_IDS.has(id);
}
function sourceOf(meta) {
  return meta.builtin === true ? "builtin" : "custom";
}
function readCatalog() {
  const path = catalogPath();
  if (!existsSync2(path)) return { revision: 0, experts: [] };
  const raw = JSON.parse(readFileSync2(path, "utf8"));
  return {
    revision: typeof raw.revision === "number" ? raw.revision : 0,
    experts: Array.isArray(raw.experts) ? raw.experts.filter((id) => typeof id === "string") : []
  };
}
function writeCatalog(catalog) {
  writeFileSync2(catalogPath(), `${JSON.stringify(catalog, void 0, 2)}
`, "utf8");
}
function readMeta(id) {
  const path = expertMetaPath(id);
  if (!existsSync2(path)) throw new SkillExpertsError("expert-not-found", `expert "${id}" not found`);
  const raw = JSON.parse(readFileSync2(path, "utf8"));
  if (raw.id !== id) throw new SkillExpertsError("expert-not-found", `expert meta id mismatch for "${id}"`);
  const name = typeof raw.name === "string" ? raw.name : "";
  const description = typeof raw.description === "string" ? raw.description : "";
  const avatar = typeof raw.avatar === "string" && raw.avatar.trim() !== "" ? raw.avatar : "\u{1F9E0}";
  const persona = typeof raw.persona === "string" ? raw.persona : "";
  const envVars = parseEnvVars(raw.envVars);
  const builtin = resolveBuiltin(id, raw.builtin);
  return {
    id,
    name,
    description,
    avatar,
    persona,
    ...envVars.length > 0 ? { envVars } : {},
    builtin
  };
}
function writeMeta(meta) {
  mkdirSync2(expertDir(meta.id), { recursive: true });
  mkdirSync2(expertSkillsDir(meta.id), { recursive: true });
  const envVars = meta.envVars === void 0 ? [] : normalizeEnvVars(meta.envVars);
  const payload = {
    id: meta.id,
    name: meta.name,
    description: meta.description,
    avatar: meta.avatar,
    persona: meta.persona,
    builtin: meta.builtin === true
  };
  if (envVars.length > 0) payload.envVars = envVars;
  writeFileSync2(expertMetaPath(meta.id), `${JSON.stringify(payload, void 0, 2)}
`, "utf8");
}
function listSkillNames(expertId) {
  const root = expertSkillsDir(expertId);
  if (!existsSync2(root)) return [];
  return readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).filter((name) => existsSync2(skillMdPath(expertId, name))).sort();
}
function readSkillSummary(expertId, skillName) {
  const absolutePath = skillDir(expertId, skillName);
  const parsed = parseSkillMd(readFileSync2(skillMdPath(expertId, skillName), "utf8"), skillMdPath(expertId, skillName));
  return {
    name: parsed.frontmatter.name,
    description: parsed.frontmatter.description,
    absolutePath
  };
}
function readSkillDetail(expertId, skillName) {
  const summary = readSkillSummary(expertId, skillName);
  const parsed = parseSkillMd(readFileSync2(skillMdPath(expertId, skillName), "utf8"), skillMdPath(expertId, skillName));
  const extraFiles = readdirSync(skillDir(expertId, skillName), { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "SKILL.md") return [];
    if (entry.isFile()) return [entry.name];
    if (entry.isDirectory()) return listFilesRecursive(join2(skillDir(expertId, skillName), entry.name), entry.name);
    return [];
  }).sort();
  return { ...summary, prompt: parsed.prompt, extraFiles };
}
function listFilesRecursive(abs, rel) {
  const out = [];
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    const nextRel = `${rel}/${entry.name}`;
    if (entry.isFile()) out.push(nextRel);
    else if (entry.isDirectory()) out.push(...listFilesRecursive(join2(abs, entry.name), nextRel));
  }
  return out;
}
function toDetail(meta, enabled) {
  const skills = listSkillNames(meta.id).map((name) => readSkillSummary(meta.id, name));
  return {
    id: meta.id,
    name: meta.name,
    description: meta.description,
    avatar: meta.avatar,
    persona: meta.persona,
    envVars: meta.envVars ?? [],
    skillCount: skills.length,
    presetId: presetIdFor(meta.id),
    source: sourceOf(meta),
    enabled,
    skills,
    rootPath: expertDir(meta.id)
  };
}
function allocExpertId(name) {
  const slug = exportSlug(name);
  let id = isKebabName(slug) ? slug : `expert-${Date.now().toString(36)}`;
  const catalog = readCatalog();
  if (!catalog.experts.includes(id) && !existsSync2(expertDir(id))) return id;
  let n = 2;
  while (catalog.experts.includes(`${id}-${n}`) || existsSync2(expertDir(`${id}-${n}`))) n += 1;
  return `${id}-${n}`;
}
function ensureSeeded(seedRoot = fileURLToPath(new URL("../assets/seed/", import.meta.url))) {
  const seeds = seedIds(seedRoot);
  SEED_BUILTIN_IDS.clear();
  for (const id of seeds) SEED_BUILTIN_IDS.add(id);
  const seedIdSet = new Set(seeds);
  expertsRoot();
  const catalog = readCatalog();
  let experts = [...catalog.experts];
  let changed = false;
  const newlyAdded = [];
  for (const id of seeds) {
    const metaPath = expertMetaPath(id);
    if (!existsSync2(metaPath)) {
      cpSync(join2(seedRoot, id), expertDir(id), { recursive: true });
      writeMeta({ ...readMeta(id), builtin: true });
      changed = true;
    }
    if (!experts.includes(id)) {
      experts = [...experts, id];
      newlyAdded.push(id);
      changed = true;
    }
  }
  const retired = retireAbsentSeedBuiltins(experts, seedIdSet);
  if (retired.changed) {
    experts = retired.experts;
    changed = true;
  }
  if (changed) {
    writeCatalog({
      revision: catalog.revision > 0 ? catalog.revision + 1 : 1,
      experts
    });
    for (const id of newlyAdded) {
      enableNewExpert(id, experts);
    }
  }
  for (const id of experts) {
    try {
      const meta = readMeta(id);
      const path = expertMetaPath(id);
      const raw = JSON.parse(readFileSync2(path, "utf8"));
      if (raw.builtin === void 0 && meta.builtin === true) writeMeta(meta);
    } catch {
    }
  }
  ensureState(readCatalog().experts);
}
function listExperts() {
  const catalog = readCatalog();
  ensureState(catalog.experts);
  const enabled = enabledSet();
  const rows = catalog.experts.flatMap((id) => {
    try {
      const detail = toDetail(readMeta(id), enabled.has(id));
      return [{
        id: detail.id,
        name: detail.name,
        description: detail.description,
        avatar: detail.avatar,
        skillCount: detail.skillCount,
        presetId: detail.presetId,
        source: detail.source,
        enabled: detail.enabled
      }];
    } catch {
      return [];
    }
  });
  const builtins = rows.filter((row) => row.source === "builtin");
  const customs = rows.filter((row) => row.source === "custom");
  return [...builtins, ...customs];
}
function getExpert(id) {
  ensureState(readCatalog().experts);
  return toDetail(readMeta(id), enabledSet().has(id));
}
function setEnabled(id, enabled) {
  const catalog = readCatalog();
  readMeta(id);
  setExpertEnabled(id, enabled, catalog.experts);
  return getExpert(id);
}
function saveExpert(input) {
  const name = input.name.trim();
  if (name === "") throw new SkillExpertsError("name-required", "expert name is required");
  const description = input.description.trim();
  const avatar = input.avatar.trim() || "\u{1F9E0}";
  const persona = input.persona.trim();
  if (persona === "") throw new SkillExpertsError("persona-required", "expert persona prompt is required");
  const catalog = readCatalog();
  let id = input.id?.trim();
  if (id === void 0 || id === "") {
    id = allocExpertId(name);
    writeMeta({ id, name, description, avatar, persona, builtin: false });
    const experts = [...catalog.experts, id];
    writeCatalog({ revision: catalog.revision + 1, experts });
    enableNewExpert(id, experts);
    return getExpert(id);
  }
  if (!catalog.experts.includes(id)) throw new SkillExpertsError("expert-not-found", `expert "${id}" not found`);
  const previous = readMeta(id);
  writeMeta({
    id,
    name,
    description,
    avatar,
    persona,
    envVars: previous.envVars,
    builtin: previous.builtin === true
  });
  writeCatalog({ revision: catalog.revision + 1, experts: catalog.experts });
  return getExpert(id);
}
async function replaceExpertEnv(ctx, id, next) {
  const catalog = readCatalog();
  if (!catalog.experts.includes(id)) {
    throw new SkillExpertsError("expert-not-found", `expert "${id}" not found`);
  }
  const previous = readMeta(id);
  const normalized = normalizeEnvVars(next);
  const previousVars = previous.envVars ?? [];
  let toWrite = normalized;
  if (previous.builtin === true) {
    const nextByName = new Map(normalized.map((entry) => [entry.name, entry.value]));
    if (nextByName.size !== previousVars.length || previousVars.some((entry) => !nextByName.has(entry.name)) || normalized.some((entry) => !previousVars.some((prev) => prev.name === entry.name))) {
      throw new SkillExpertsError(
        "builtin-cannot-mutate-env",
        `built-in expert "${id}" cannot add, remove, or rename env vars`
      );
    }
    toWrite = previousVars.map((entry) => ({
      name: entry.name,
      value: nextByName.get(entry.name) ?? entry.value
    }));
  }
  const api = requireCustomEnv(ctx);
  await syncEnvToCustomEnv(api, previousVars, toWrite);
  writeMeta({
    ...previous,
    envVars: toWrite
  });
  writeCatalog({ revision: catalog.revision + 1, experts: catalog.experts });
  return getExpert(id);
}
function deleteExpert(id) {
  const catalog = readCatalog();
  if (!catalog.experts.includes(id)) throw new SkillExpertsError("expert-not-found", `expert "${id}" not found`);
  const meta = readMeta(id);
  if (meta.builtin === true) {
    throw new SkillExpertsError("builtin-cannot-delete", `built-in expert "${id}" cannot be deleted`);
  }
  rmSync(expertDir(id), { recursive: true, force: true });
  const experts = catalog.experts.filter((item) => item !== id);
  writeCatalog({ revision: catalog.revision + 1, experts });
  forgetExpert(id, experts);
}
function getSkill(expertId, skillName) {
  readMeta(expertId);
  if (!existsSync2(skillMdPath(expertId, skillName))) {
    throw new SkillExpertsError("skill-not-found", `skill "${skillName}" not found`);
  }
  return readSkillDetail(expertId, skillName);
}
function saveSkill(expertId, input) {
  const meta = readMeta(expertId);
  const name = input.name.trim();
  const description = input.description.trim();
  const prompt = input.prompt.trim();
  if (name === "") throw new SkillExpertsError("skill-name-required", "skill name is required");
  if (!isKebabName(name)) throw new SkillExpertsError("skill-name-kebab", "skill name must be kebab-case");
  if (description === "") {
    throw new SkillExpertsError("skill-description-required", "skill description is required");
  }
  if (prompt === "") {
    throw new SkillExpertsError("skill-prompt-required", "skill prompt is required");
  }
  const fromName = input.fromName?.trim();
  const target = skillDir(expertId, name);
  const renaming = fromName !== void 0 && fromName !== "" && fromName !== name;
  const creating = !renaming && !existsSync2(target);
  if (meta.builtin === true && (creating || renaming)) {
    throw new SkillExpertsError(
      "builtin-cannot-add-skill",
      `built-in expert "${expertId}" cannot add or rename skills`
    );
  }
  if (renaming) {
    const from = skillDir(expertId, fromName);
    if (!existsSync2(from)) throw new SkillExpertsError("skill-not-found", `skill "${fromName}" not found`);
    if (existsSync2(target)) throw new SkillExpertsError("skill-exists", `skill "${name}" already exists`);
    renameSync(from, target);
  } else {
    mkdirSync2(target, { recursive: true });
  }
  writeFileSync2(
    skillMdPath(expertId, name),
    serializeSkillMd({
      name,
      description,
      prompt
    }),
    "utf8"
  );
  const catalog = readCatalog();
  writeCatalog({ revision: catalog.revision + 1, experts: catalog.experts });
  return readSkillDetail(expertId, name);
}
function deleteSkill(expertId, skillName) {
  const meta = readMeta(expertId);
  if (meta.builtin === true) {
    throw new SkillExpertsError(
      "builtin-cannot-delete-skill",
      `built-in expert "${expertId}" skills cannot be deleted`
    );
  }
  const path = skillDir(expertId, skillName);
  if (!existsSync2(path)) throw new SkillExpertsError("skill-not-found", `skill "${skillName}" not found`);
  rmSync(path, { recursive: true, force: true });
  const catalog = readCatalog();
  writeCatalog({ revision: catalog.revision + 1, experts: catalog.experts });
}

// src/continue-mode.ts
import { existsSync as existsSync3, readFileSync as readFileSync3, writeFileSync as writeFileSync3 } from "node:fs";
var cache;
function emptyFile() {
  return { revision: 0, byParent: {} };
}
function readRaw2() {
  if (cache !== void 0) return cache;
  const path = continuePath();
  if (!existsSync3(path)) {
    cache = emptyFile();
    return cache;
  }
  try {
    const raw = JSON.parse(readFileSync3(path, "utf8"));
    const byParent = {};
    if (raw.byParent !== void 0 && typeof raw.byParent === "object" && raw.byParent !== null) {
      for (const [parentId, entry] of Object.entries(raw.byParent)) {
        if (typeof parentId !== "string" || parentId === "") continue;
        if (entry === null || typeof entry !== "object") continue;
        const children = {};
        const rawChildren = entry.children;
        if (rawChildren !== void 0 && typeof rawChildren === "object" && rawChildren !== null) {
          for (const [expertId, childId] of Object.entries(rawChildren)) {
            if (typeof expertId === "string" && expertId !== "" && typeof childId === "string" && childId !== "") {
              children[expertId] = childId;
            }
          }
        }
        byParent[parentId] = {
          continue: entry.continue === true,
          children
        };
      }
    }
    cache = {
      revision: typeof raw.revision === "number" ? raw.revision : 0,
      byParent
    };
    return cache;
  } catch {
    cache = emptyFile();
    return cache;
  }
}
function writeRaw2(file) {
  cache = file;
  writeFileSync3(continuePath(), `${JSON.stringify(file, void 0, 2)}
`, "utf8");
}
function upsertParent(parentId, next) {
  const current = readRaw2();
  const previous = current.byParent[parentId];
  writeRaw2({
    revision: current.revision + 1,
    byParent: {
      ...current.byParent,
      [parentId]: next(previous)
    }
  });
}
function getContinueChat(parentSessionId) {
  const id = parentSessionId.trim();
  if (id === "") return false;
  const entry = readRaw2().byParent[id];
  if (entry === void 0) return true;
  return entry.continue;
}
function setContinueChat(parentSessionId, enabled) {
  const id = parentSessionId.trim();
  if (id === "") return false;
  upsertParent(id, (previous) => ({
    continue: enabled,
    children: { ...previous?.children }
  }));
  return enabled;
}

// src/expert-zip.ts
import { existsSync as existsSync4, mkdirSync as mkdirSync3, readFileSync as readFileSync4, readdirSync as readdirSync2, writeFileSync as writeFileSync4 } from "node:fs";
import { dirname, join as join3, posix } from "node:path";
import JSZip from "jszip";
async function exportExpertZip(id) {
  const detail = getExpert(id);
  const zip = new JSZip();
  addExpertToZip(zip, detail.id, "");
  const bytes = await zip.generateAsync({ type: "uint8array" });
  return { filename: `${exportSlug(detail.name)}.zip`, bytes };
}
async function exportExpertsZip(ids) {
  if (ids.length === 0) throw new SkillExpertsError("expert-not-found", "no experts selected");
  const zip = new JSZip();
  const used = /* @__PURE__ */ new Set();
  for (const id of ids) {
    const detail = getExpert(id);
    const folder = uniqueSlug(exportSlug(detail.name), used);
    addExpertToZip(zip, detail.id, `${folder}/`);
  }
  const bytes = await zip.generateAsync({ type: "uint8array" });
  return { filename: "skill-experts.zip", bytes };
}
async function importExpertZip(ctx, bytes) {
  const zip = await JSZip.loadAsync(bytes);
  const entries = Object.keys(zip.files).filter((name) => !zip.files[name].dir);
  if (entries.length === 0) throw new SkillExpertsError("zip-empty", "zip is empty");
  const normalized = entries.map((name) => name.replace(/\\/gu, "/").replace(/^\/+/u, ""));
  const packs = detectExpertPacks(normalized);
  if (packs.length === 0) {
    throw new SkillExpertsError("zip-missing-meta", "missing meta.json");
  }
  const ids = [];
  for (const prefix of packs) {
    const detail = await importOneExpert(ctx, zip, normalized, prefix);
    ids.push(detail.id);
  }
  return { count: ids.length, ids };
}
function detectExpertPacks(normalized) {
  if (normalized.includes("meta.json")) return [""];
  const folders = /* @__PURE__ */ new Set();
  for (const name of normalized) {
    const parts = name.split("/");
    if (parts.length >= 2 && parts[1] === "meta.json" && parts[0] !== void 0 && parts[0] !== "") {
      folders.add(parts[0]);
    }
  }
  if (folders.size === 0) return [];
  if (folders.size === 1) {
    const only = [...folders][0];
    return [`${only}/`];
  }
  return [...folders].sort().map((folder) => `${folder}/`);
}
async function importOneExpert(ctx, zip, normalized, prefix) {
  const metaPath = `${prefix}meta.json`;
  const metaEntry = zip.file(metaPath);
  if (metaEntry === null) throw new SkillExpertsError("zip-missing-meta", `missing ${metaPath}`);
  const meta = parseMeta(JSON.parse(await metaEntry.async("string")));
  let detail = saveExpert({
    name: meta.name,
    description: meta.description,
    avatar: meta.avatar,
    persona: meta.persona
  });
  if (meta.envVars.length > 0) {
    detail = await replaceExpertEnv(ctx, detail.id, meta.envVars);
  }
  const skillsPrefix = `${prefix}skills/`;
  const skillFolders = /* @__PURE__ */ new Set();
  for (const rel of normalized) {
    if (!rel.startsWith(skillsPrefix)) continue;
    const rest = rel.slice(skillsPrefix.length);
    const parts = rest.split("/");
    if (parts.length < 2 || parts[0] === "") continue;
    skillFolders.add(parts[0]);
  }
  for (const folder of [...skillFolders].sort()) {
    const skillMdRel = `${skillsPrefix}${folder}/SKILL.md`;
    if (!normalized.includes(skillMdRel)) {
      throw new SkillExpertsError("zip-missing-skill-md", `folder "${folder}" has no SKILL.md`);
    }
    const mdEntry = zip.file(skillMdRel);
    if (mdEntry === null) {
      throw new SkillExpertsError("zip-missing-skill-md", `missing ${skillMdRel}`);
    }
    const text = await mdEntry.async("string");
    const parsed = parseSkillMd(text, skillMdRel);
    if (!isKebabName(parsed.frontmatter.name)) {
      throw new SkillExpertsError(
        "skill-name-kebab",
        `skill name "${parsed.frontmatter.name}" must be kebab-case`
      );
    }
    saveSkill(detail.id, {
      name: parsed.frontmatter.name,
      description: parsed.frontmatter.description,
      prompt: parsed.prompt
    });
    const targetName = parsed.frontmatter.name;
    for (const rel of normalized) {
      if (!rel.startsWith(`${skillsPrefix}${folder}/`)) continue;
      const within = rel.slice(`${skillsPrefix}${folder}/`.length);
      if (within === "" || within.includes("..")) continue;
      if (within === "SKILL.md") continue;
      const entry = zip.file(rel);
      if (entry === null || entry.dir) continue;
      const abs = join3(skillDir(detail.id, targetName), ...within.split("/"));
      mkdirSync3(dirname(abs), { recursive: true });
      writeFileSync4(abs, await entry.async("nodebuffer"));
    }
  }
  return getExpert(detail.id);
}
function parseMeta(raw) {
  const metaRaw = raw;
  const name = typeof metaRaw.name === "string" ? metaRaw.name.trim() : "";
  const description = typeof metaRaw.description === "string" ? metaRaw.description.trim() : "";
  const avatar = typeof metaRaw.avatar === "string" && metaRaw.avatar.trim() !== "" ? metaRaw.avatar.trim() : "\u{1F4D6}";
  const persona = typeof metaRaw.persona === "string" ? metaRaw.persona.trim() : "";
  if (name === "") throw new SkillExpertsError("name-required", "expert name is required");
  if (persona === "") throw new SkillExpertsError("persona-required", "expert persona prompt is required");
  const envVars = parseExportEnvVars(metaRaw.envVars);
  return { name, description, avatar, persona, envVars };
}
function parseExportEnvVars(raw) {
  if (!Array.isArray(raw)) return [];
  const loose = [];
  for (const item of raw) {
    if (item === null || typeof item !== "object") continue;
    const row = item;
    if (typeof row.name !== "string") continue;
    const name = row.name.trim();
    if (name === "") continue;
    loose.push({ name, value: typeof row.value === "string" ? row.value : "" });
  }
  return normalizeEnvVars(loose);
}
function exportEnvVars(detail) {
  return detail.envVars.map((entry) => ({
    name: entry.name,
    value: process.env[entry.name] !== void 0 ? process.env[entry.name] : entry.value
  }));
}
function addExpertToZip(zip, expertId, prefix) {
  const detail = getExpert(expertId);
  const envVars = exportEnvVars(detail);
  const payload = {
    name: detail.name,
    description: detail.description,
    avatar: detail.avatar,
    persona: detail.persona
  };
  if (envVars.length > 0) payload.envVars = envVars;
  zip.file(`${prefix}meta.json`, `${JSON.stringify(payload, void 0, 2)}
`);
  const skillsRoot = expertSkillsDir(expertId);
  if (!existsSync4(skillsRoot)) return;
  for (const skillName of readdirSync2(skillsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()) {
    if (!existsSync4(skillMdPath(expertId, skillName))) continue;
    addDirToZip(zip, skillDir(expertId, skillName), `${prefix}skills/${skillName}`);
  }
}
function uniqueSlug(base, used) {
  let candidate = base;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  used.add(candidate);
  return candidate;
}
function addDirToZip(zip, absDir, zipPrefix) {
  for (const entry of readdirSync2(absDir, { withFileTypes: true })) {
    const abs = join3(absDir, entry.name);
    const rel = posix.join(zipPrefix, entry.name);
    if (entry.isDirectory()) {
      addDirToZip(zip, abs, rel);
      continue;
    }
    if (entry.isFile()) zip.file(rel, readFileSync4(abs));
  }
}

// src/preset-sync.ts
var ExpertPresetSync = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  ctx;
  disposers = /* @__PURE__ */ new Map();
  /** Rebuild registrations to match enabled experts on disk. */
  async sync() {
    const presets = this.ctx.get("agentPresets");
    if (presets === void 0) {
      this.ctx.logger.warn("skill-experts: agentPresets service missing; expert presets not registered");
      return;
    }
    const live = new Set(listExperts().filter((row) => row.enabled).map((row) => row.id));
    for (const [id, dispose] of [...this.disposers]) {
      if (live.has(id)) continue;
      this.disposers.delete(id);
      await dispose();
    }
    for (const id of live) {
      const definition = buildDefinition(id);
      const previous = this.disposers.get(id);
      if (previous !== void 0) {
        this.disposers.delete(id);
        await previous();
      }
      const dispose = await presets.register(definition);
      this.disposers.set(id, dispose);
    }
  }
  /** Unregister all expert presets. */
  async dispose() {
    for (const [, dispose] of [...this.disposers]) await dispose();
    this.disposers.clear();
  }
};
function buildDefinition(expertId) {
  const expert = getExpert(expertId);
  const skillsDir = expertSkillsDir(expertId);
  return {
    id: presetIdFor(expertId),
    name: expert.name,
    description: expert.description !== "" ? expert.description : `Skill expert: ${expert.name}`,
    order: 100,
    plugins: [
      {
        id: "persona",
        name: "@deepseek-ai/dsh-persona",
        config: {
          prefix: expert.persona,
          complete: true,
          includeRuntimeContext: false
        }
      },
      {
        id: "tool-bash",
        name: "@deepseek-ai/dsh-tool-bash",
        disabled: { __jsExpr: "process.platform === 'win32'" }
      },
      {
        id: "tool-pwsh",
        name: "@deepseek-ai/dsh-tool-pwsh",
        disabled: { __jsExpr: "process.platform !== 'win32'" }
      },
      {
        id: "tool-fs",
        name: "@deepseek-ai/dsh-tool-fs",
        config: { read: true, readImage: true, write: true, edit: true }
      },
      {
        id: "skill-filesystem",
        name: "@deepseek-ai/dsh-skill-filesystem",
        config: {
          includeDefaultRoots: false,
          customSkillDirs: [skillsDir]
        }
      },
      {
        id: "tool-skill",
        name: "@deepseek-ai/dsh-tool-skill"
      }
    ]
  };
}

// src/zip-import.ts
import { mkdirSync as mkdirSync4, writeFileSync as writeFileSync5 } from "node:fs";
import { dirname as dirname2, join as join4, posix as posix2 } from "node:path";
import JSZip2 from "jszip";
async function importSkillsZip(expertId, bytes) {
  if (readMeta(expertId).builtin === true) {
    throw new SkillExpertsError(
      "builtin-cannot-import-skill",
      `built-in expert "${expertId}" cannot import skills`
    );
  }
  const zip = await JSZip2.loadAsync(bytes);
  const entries = Object.keys(zip.files).filter((name) => !zip.files[name].dir);
  if (entries.length === 0) throw new SkillExpertsError("zip-empty", "zip is empty");
  const normalized = entries.map((name) => name.replace(/\\/gu, "/").replace(/^\/+/u, ""));
  const singleRoot = normalized.every((name) => name === "SKILL.md" || name.startsWith("SKILL.md/")) || normalized.some((name) => name === "SKILL.md") && normalized.every((name) => !name.includes("/") || name.split("/").length === 1);
  let packs;
  if (normalized.includes("SKILL.md") && normalized.every((name) => !name.includes("/"))) {
    packs = [await loadPack(zip, "", "SKILL.md")];
  } else if (singleRoot && normalized.includes("SKILL.md")) {
    packs = [await loadPack(zip, "", "SKILL.md")];
  } else {
    const folders = /* @__PURE__ */ new Set();
    for (const name of normalized) {
      const parts = name.split("/");
      if (parts.length < 2) {
        throw new SkillExpertsError(
          "zip-invalid-layout",
          `invalid zip layout: unexpected root file "${name}" (use root SKILL.md for one skill, or folders each with SKILL.md)`
        );
      }
      folders.add(parts[0]);
    }
    packs = [];
    for (const folder of [...folders].sort()) {
      const skillPath = `${folder}/SKILL.md`;
      if (!normalized.includes(skillPath)) {
        throw new SkillExpertsError("zip-missing-skill-md", `folder "${folder}" has no SKILL.md`);
      }
      packs.push(await loadPack(zip, folder, skillPath));
    }
  }
  const imported = [];
  for (const pack of packs) {
    const mdBytes = pack.files.get("SKILL.md");
    if (mdBytes === void 0) throw new SkillExpertsError("zip-missing-skill-md", "missing SKILL.md");
    const text = new TextDecoder("utf8").decode(mdBytes);
    const parsed = parseSkillMd(text, pack.folder === "" ? "SKILL.md" : `${pack.folder}/SKILL.md`);
    if (!isKebabName(parsed.frontmatter.name)) {
      throw new SkillExpertsError(
        "skill-name-kebab",
        `skill name "${parsed.frontmatter.name}" must be kebab-case`
      );
    }
    const targetName = parsed.frontmatter.name;
    saveSkill(expertId, {
      name: targetName,
      description: parsed.frontmatter.description,
      prompt: parsed.prompt
    });
    writeFileSync5(
      skillMdPath(expertId, targetName),
      serializeSkillMd({
        name: parsed.frontmatter.name,
        description: parsed.frontmatter.description,
        prompt: parsed.prompt
      }),
      "utf8"
    );
    for (const [rel, data] of pack.files) {
      if (rel === "SKILL.md") continue;
      const abs = join4(skillDir(expertId, targetName), ...rel.split("/"));
      mkdirSync4(dirname2(abs), { recursive: true });
      writeFileSync5(abs, data);
    }
    imported.push(targetName);
  }
  return imported;
}
async function loadPack(zip, folder, skillPath) {
  const files = /* @__PURE__ */ new Map();
  const prefix = folder === "" ? "" : `${folder}/`;
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const norm = name.replace(/\\/gu, "/").replace(/^\/+/u, "");
    if (folder === "") {
      if (norm.includes("/")) continue;
      files.set(norm, await entry.async("uint8array"));
      continue;
    }
    if (!norm.startsWith(prefix)) continue;
    const rel = norm.slice(prefix.length);
    if (rel === "" || rel.includes("..")) continue;
    files.set(posix2.normalize(rel), await entry.async("uint8array"));
  }
  if (!files.has("SKILL.md") && skillPath.endsWith("SKILL.md")) {
    const entry = zip.file(skillPath);
    if (entry) files.set("SKILL.md", await entry.async("uint8array"));
  }
  if (!files.has("SKILL.md")) throw new SkillExpertsError("zip-missing-skill-md", `missing ${skillPath}`);
  return { folder, files };
}

// src/remote.ts
function asMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function reasonOf(error, fallback) {
  if (isSkillExpertsError(error)) return error.reason;
  return fallback;
}
function wrap(error, code, id) {
  if (error instanceof RemoteError) throw error;
  const message = asMessage(error);
  if (code === "skill-experts/not-found") {
    throw new RemoteError(code, message, {
      id,
      reason: reasonOf(error, "expert-not-found")
    }, { cause: error });
  }
  if (code === "skill-experts/zip") {
    throw new RemoteError(code, message, {
      reason: reasonOf(error, "zip-invalid-layout")
    }, { cause: error });
  }
  throw new RemoteError(code, message, {
    reason: reasonOf(error, "generic")
  }, { cause: error });
}
var _exportExperts_dec, _importExpert_dec, _exportExpert_dec, _importZip_dec, _deleteSkill_dec, _saveSkill_dec, _getSkill_dec, _deleteExpert_dec, _saveExpertEnv_dec, _customEnvStatus_dec, _saveExpert_dec, _get_dec, _setEnabled_dec, _setContinueChat_dec, _getContinueChat_dec, _list_dec, _a, _init;
var SkillExpertsRemote = class extends (_a = TypertRemoteService, _list_dec = [Remote("list")], _getContinueChat_dec = [Remote("getContinueChat")], _setContinueChat_dec = [Remote("setContinueChat")], _setEnabled_dec = [Remote("setEnabled")], _get_dec = [Remote("get")], _saveExpert_dec = [Remote("saveExpert")], _customEnvStatus_dec = [Remote("customEnvStatus")], _saveExpertEnv_dec = [Remote("saveExpertEnv")], _deleteExpert_dec = [Remote("deleteExpert")], _getSkill_dec = [Remote("getSkill")], _saveSkill_dec = [Remote("saveSkill")], _deleteSkill_dec = [Remote("deleteSkill")], _importZip_dec = [Remote("importZip")], _exportExpert_dec = [Remote("exportExpert")], _importExpert_dec = [Remote("importExpert")], _exportExperts_dec = [Remote("exportExperts")], _a) {
  constructor(ctx) {
    super(ctx, "skillExperts");
    __runInitializers(_init, 5, this);
    __publicField(this, "presets");
    ensureSeeded();
    this.presets = new ExpertPresetSync(ctx);
    ctx.effect(() => {
      let synced = false;
      let timer;
      const trySync = () => {
        if (synced || ctx.get("agentPresets") === void 0) return;
        synced = true;
        if (timer !== void 0) clearInterval(timer);
        timer = void 0;
        void this.presets.sync().catch((error) => {
          ctx.logger.warn(`skill-experts: preset sync failed: ${asMessage(error)}`);
        });
      };
      timer = setInterval(trySync, 200);
      trySync();
      return () => {
        if (timer !== void 0) clearInterval(timer);
        void this.presets.dispose();
      };
    }, "skill-experts: preset sync");
  }
  async afterMutation(run) {
    const value = run();
    await this.presets.sync();
    return value;
  }
  async list() {
    return listExperts();
  }
  async getContinueChat(sessionId) {
    return getContinueChat(String(sessionId ?? ""));
  }
  async setContinueChat(sessionId, enabled) {
    return setContinueChat(String(sessionId ?? ""), enabled === true);
  }
  async setEnabled(id, enabled) {
    try {
      return await this.afterMutation(() => setEnabled(id, enabled));
    } catch (error) {
      wrap(error, "skill-experts/not-found", id);
    }
  }
  async get(id) {
    try {
      return getExpert(id);
    } catch (error) {
      wrap(error, "skill-experts/not-found", id);
    }
  }
  async saveExpert(input) {
    try {
      return await this.afterMutation(() => saveExpert(input));
    } catch (error) {
      wrap(error, "skill-experts/invalid", input.id ?? "");
    }
  }
  async customEnvStatus() {
    return { available: customEnvAvailable(this.ctx) };
  }
  async saveExpertEnv(id, entries) {
    try {
      const detail = await replaceExpertEnv(this.ctx, id, entries);
      await this.presets.sync();
      return detail;
    } catch (error) {
      wrap(error, "skill-experts/invalid", id);
    }
  }
  async deleteExpert(id) {
    try {
      await this.afterMutation(() => {
        deleteExpert(id);
      });
    } catch (error) {
      wrap(error, "skill-experts/not-found", id);
    }
  }
  async getSkill(expertId, skillName) {
    try {
      return getSkill(expertId, skillName);
    } catch (error) {
      wrap(error, "skill-experts/not-found", `${expertId}/${skillName}`);
    }
  }
  async saveSkill(expertId, input) {
    try {
      return await this.afterMutation(() => saveSkill(expertId, input));
    } catch (error) {
      wrap(error, "skill-experts/invalid", expertId);
    }
  }
  async deleteSkill(expertId, skillName) {
    try {
      await this.afterMutation(() => {
        deleteSkill(expertId, skillName);
      });
    } catch (error) {
      wrap(error, "skill-experts/not-found", `${expertId}/${skillName}`);
    }
  }
  async importZip(expertId, zipBase64) {
    try {
      getExpert(expertId);
      const bytes = Uint8Array.from(Buffer.from(zipBase64, "base64"));
      const imported = await importSkillsZip(expertId, bytes);
      await this.presets.sync();
      return { imported };
    } catch (error) {
      wrap(error, "skill-experts/zip", expertId);
    }
  }
  async exportExpert(id) {
    try {
      const pack = await exportExpertZip(id);
      return {
        filename: pack.filename,
        zipBase64: Buffer.from(pack.bytes).toString("base64")
      };
    } catch (error) {
      wrap(error, "skill-experts/not-found", id);
    }
  }
  async importExpert(zipBase64) {
    try {
      const bytes = Uint8Array.from(Buffer.from(zipBase64, "base64"));
      const result = await importExpertZip(this.ctx, bytes);
      await this.presets.sync();
      return result;
    } catch (error) {
      wrap(error, "skill-experts/zip", "");
    }
  }
  async exportExperts(ids) {
    try {
      const pack = await exportExpertsZip(ids);
      return {
        filename: pack.filename,
        zipBase64: Buffer.from(pack.bytes).toString("base64")
      };
    } catch (error) {
      wrap(error, "skill-experts/not-found", ids.join(","));
    }
  }
};
_init = __decoratorStart(_a);
__decorateElement(_init, 1, "list", _list_dec, SkillExpertsRemote);
__decorateElement(_init, 1, "getContinueChat", _getContinueChat_dec, SkillExpertsRemote);
__decorateElement(_init, 1, "setContinueChat", _setContinueChat_dec, SkillExpertsRemote);
__decorateElement(_init, 1, "setEnabled", _setEnabled_dec, SkillExpertsRemote);
__decorateElement(_init, 1, "get", _get_dec, SkillExpertsRemote);
__decorateElement(_init, 1, "saveExpert", _saveExpert_dec, SkillExpertsRemote);
__decorateElement(_init, 1, "customEnvStatus", _customEnvStatus_dec, SkillExpertsRemote);
__decorateElement(_init, 1, "saveExpertEnv", _saveExpertEnv_dec, SkillExpertsRemote);
__decorateElement(_init, 1, "deleteExpert", _deleteExpert_dec, SkillExpertsRemote);
__decorateElement(_init, 1, "getSkill", _getSkill_dec, SkillExpertsRemote);
__decorateElement(_init, 1, "saveSkill", _saveSkill_dec, SkillExpertsRemote);
__decorateElement(_init, 1, "deleteSkill", _deleteSkill_dec, SkillExpertsRemote);
__decorateElement(_init, 1, "importZip", _importZip_dec, SkillExpertsRemote);
__decorateElement(_init, 1, "exportExpert", _exportExpert_dec, SkillExpertsRemote);
__decorateElement(_init, 1, "importExpert", _importExpert_dec, SkillExpertsRemote);
__decorateElement(_init, 1, "exportExperts", _exportExperts_dec, SkillExpertsRemote);
__decoratorMetadata(_init, SkillExpertsRemote);
__publicField(SkillExpertsRemote, "inject", ["typert"]);
export {
  SkillExpertsRemote as default
};
