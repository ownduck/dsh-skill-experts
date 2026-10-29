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

// src/export-slug.ts
import { pinyin } from "pinyin-pro";

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
  const name2 = record.name;
  const description = record.description;
  if (typeof name2 !== "string" || name2.trim() === "") throw new Error(`${path}: name is required`);
  if (typeof description !== "string" || description.trim() === "") throw new Error(`${path}: description is required`);
  return {
    frontmatter: { name: name2.trim(), description: description.trim() },
    prompt: raw.slice(match[0].length).replace(/^\r?\n/u, ""),
    raw
  };
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

// src/catalog.ts
var ENV_NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/u;
function normalizeEnvVars(raw) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const item of raw) {
    const name2 = item.name.trim();
    const value = typeof item.value === "string" ? item.value : "";
    if (name2 === "") continue;
    if (!ENV_NAME_RE.test(name2)) {
      throw new SkillExpertsError("env-name-invalid", `invalid env name "${name2}"`);
    }
    if (seen.has(name2)) {
      throw new SkillExpertsError("env-name-duplicate", `duplicate env name "${name2}"`);
    }
    seen.add(name2);
    out.push({ name: name2, value });
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
    const name2 = row.name.trim();
    if (name2 === "") continue;
    const value = typeof row.value === "string" ? row.value : "";
    loose.push({ name: name2, value });
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
function readMeta(id) {
  const path = expertMetaPath(id);
  if (!existsSync2(path)) throw new SkillExpertsError("expert-not-found", `expert "${id}" not found`);
  const raw = JSON.parse(readFileSync2(path, "utf8"));
  if (raw.id !== id) throw new SkillExpertsError("expert-not-found", `expert meta id mismatch for "${id}"`);
  const name2 = typeof raw.name === "string" ? raw.name : "";
  const description = typeof raw.description === "string" ? raw.description : "";
  const avatar = typeof raw.avatar === "string" && raw.avatar.trim() !== "" ? raw.avatar : "\u{1F9E0}";
  const persona = typeof raw.persona === "string" ? raw.persona : "";
  const envVars = parseEnvVars(raw.envVars);
  const builtin = resolveBuiltin(id, raw.builtin);
  return {
    id,
    name: name2,
    description,
    avatar,
    persona,
    ...envVars.length > 0 ? { envVars } : {},
    builtin
  };
}
function listSkillNames(expertId) {
  const root = expertSkillsDir(expertId);
  if (!existsSync2(root)) return [];
  return readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).filter((name2) => existsSync2(skillMdPath(expertId, name2))).sort();
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
function toDetail(meta, enabled) {
  const skills = listSkillNames(meta.id).map((name2) => readSkillSummary(meta.id, name2));
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

// src/continue-mode.ts
import { existsSync as existsSync3, readFileSync as readFileSync3, writeFileSync as writeFileSync3 } from "node:fs";
function emptyFile() {
  return { revision: 0, byParent: {} };
}
function readRaw2() {
  const path = continuePath();
  if (!existsSync3(path)) return emptyFile();
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
    return {
      revision: typeof raw.revision === "number" ? raw.revision : 0,
      byParent
    };
  } catch {
    return emptyFile();
  }
}
function writeRaw2(file) {
  writeFileSync3(continuePath(), `${JSON.stringify(file, void 0, 2)}
`, "utf8");
}
function getContinueChat(parentSessionId) {
  const id = parentSessionId.trim();
  if (id === "") return false;
  return readRaw2().byParent[id]?.continue === true;
}
function getChildId(parentSessionId, expertId) {
  const parent = parentSessionId.trim();
  const expert = expertId.trim();
  if (parent === "" || expert === "") return void 0;
  const child = readRaw2().byParent[parent]?.children[expert];
  return child !== void 0 && child !== "" ? child : void 0;
}
function setChildId(parentSessionId, expertId, childSessionId) {
  const parent = parentSessionId.trim();
  const expert = expertId.trim();
  const child = childSessionId.trim();
  if (parent === "" || expert === "" || child === "") return;
  const current = readRaw2();
  const previous = current.byParent[parent];
  const children = { ...previous?.children, [expert]: child };
  writeRaw2({
    revision: current.revision + 1,
    byParent: {
      ...current.byParent,
      [parent]: {
        continue: previous?.continue === true,
        children
      }
    }
  });
}
function clearChildId(parentSessionId, expertId) {
  const parent = parentSessionId.trim();
  const expert = expertId.trim();
  if (parent === "" || expert === "") return;
  const current = readRaw2();
  const previous = current.byParent[parent];
  if (previous === void 0 || previous.children[expert] === void 0) return;
  const { [expert]: _removed, ...children } = previous.children;
  writeRaw2({
    revision: current.revision + 1,
    byParent: {
      ...current.byParent,
      [parent]: { continue: previous.continue, children }
    }
  });
}
function resolveChildId(parentSessionId, expertId, expertName, children) {
  const mapped = getChildId(parentSessionId, expertId);
  if (mapped !== void 0) return mapped;
  if (children === void 0 || children.length === 0) return void 0;
  const name2 = expertName.trim();
  if (name2 === "") return void 0;
  const matches = children.filter((row) => row.mode === "continuable" && typeof row.label === "string" && row.label === name2 && typeof row.id === "string" && row.id !== "");
  if (matches.length === 0) return void 0;
  matches.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  const found = matches[0]?.id;
  if (found === void 0) return void 0;
  setChildId(parentSessionId, expertId, found);
  return found;
}

// src/summon.ts
var LIST = "list_skill_experts";
var SUMMON = "summon_skill_expert";
function renderExpertCatalogEntries(entries) {
  return entries.map((entry) => {
    const summary = entry.description.trim() === "" ? "(no description)" : entry.description.trim();
    return `- \`${entry.name}\`: ${summary} (id: ${entry.id})`;
  });
}
function textBlocks(blocks) {
  return blocks.filter((block) => block.type === "text" && typeof block.text === "string").map((block) => block.text ?? "").join("");
}
async function awaitActivation(run, signal) {
  let disposal;
  const dispose = () => {
    if (disposal === void 0) {
      try {
        disposal = Promise.resolve(run.dispose());
      } catch (error) {
        disposal = Promise.reject(error);
      }
    }
    return disposal;
  };
  let rejectAborted;
  const aborted = new Promise((_resolve, reject) => {
    rejectAborted = reject;
  });
  const onAbort = () => {
    void dispose().catch(() => void 0);
    rejectAborted(signal.reason ?? new Error("aborted"));
  };
  signal.addEventListener("abort", onAbort, { once: true });
  try {
    if (signal.aborted) {
      onAbort();
      await dispose();
      throw signal.reason ?? new Error("aborted");
    }
    return await Promise.race([run.result, aborted]);
  } finally {
    signal.removeEventListener("abort", onAbort);
    await dispose();
  }
}
function awaitSubagentEnd(ctx, childId, signal) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      disposeListen();
      if (error !== void 0) reject(error);
      else resolve(result ?? { output: [], stopReason: "error" });
    };
    const onAbort = () => {
      finish(signal.reason ?? new Error("aborted"));
    };
    const disposeListen = ctx.on("subagent/end", (info) => {
      if (info.id !== childId) return;
      finish(void 0, {
        stopReason: info.stopReason,
        output: info.lastAssistantMessage ?? []
      });
    });
    signal.addEventListener("abort", onAbort, { once: true });
    if (signal.aborted) onAbort();
  });
}
function expertPrompt(expertName, task) {
  return [{
    type: "text",
    text: [
      `You are the skill expert "${expertName}".`,
      "Follow your persona and use your available skills as needed.",
      "",
      "## Task",
      task
    ].join("\n")
  }];
}
function answerFromResult(expertName, result) {
  const answer = textBlocks(result.output).trim();
  if (result.stopReason !== "completed") {
    const detailText = answer.length > 0 ? ` Partial output:
${answer}` : "";
    throw new Error(`skill expert "${expertName}" ended with ${result.stopReason}.${detailText}`);
  }
  if (answer === "") {
    throw new Error(`skill expert "${expertName}" returned no usable text`);
  }
  return { expert: expertName, answer };
}
function registerSummonTools(ctx) {
  const listTool = {
    name: LIST,
    description: "List enabled skill experts (id, name, description, avatar, skillCount, presetId, source). The session system prompt already lists each enabled expert name and description. Call this only when that catalog is insufficient to choose an expert. Do not use the generic subagent tool for these experts.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {}
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          experts: { type: "array", items: {} }
        },
        required: ["experts"]
      },
      render: (_args, value) => [{
        type: "text",
        text: JSON.stringify(value, void 0, 2)
      }]
    },
    async execute() {
      return { experts: listExperts().filter((row) => row.enabled) };
    }
  };
  const summonTool = {
    name: SUMMON,
    description: "Summon one skill expert as a spawn subagent with that expert's Agent Preset (persona + isolated skills) and return its answer to the parent. If the user message contains a skill-expert chip or @DisplayName for this expert, you MUST call this immediately (once per named expert). If the user did not name an expert but the task clearly matches an enabled expert's description in the Skill experts catalog, call this with that expert's name or id. Do not greet or answer that @ mention yourself first. Pass a short task brief from the remaining user text. When continue-chat is on for this session, the same expert reuses its prior child. Do not use the generic subagent tool for skill experts.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        expert: {
          type: "string",
          description: "Expert id or exact display name from the Skill experts catalog."
        },
        task: {
          type: "string",
          description: "Short brief from the user message after the expert chip: goal, constraints, and relevant paths. Do not paste large source dumps. Even a short greeting or question is a valid task."
        }
      },
      required: ["expert", "task"]
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          expert: { type: "string" },
          answer: { type: "string" }
        },
        required: ["expert", "answer"]
      },
      render: (_args, value) => [{
        type: "text",
        text: value.answer
      }]
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      const agent = exec.agent;
      if (agent === void 0) throw new Error("summon_skill_expert requires a calling agent");
      if (agent.session.header.parentSession !== void 0) {
        throw new Error("skill experts cannot summon further skill experts");
      }
      const expertKey = String(args.expert ?? "").trim();
      const task = String(args.task ?? "").trim();
      if (expertKey === "" || task === "") throw new Error("expert and task are required");
      const roster = listExperts().filter((row) => row.enabled);
      const match = roster.find((row) => row.id === expertKey || row.name === expertKey);
      if (match === void 0) {
        throw new Error(`unknown or disabled skill expert "${expertKey}"; call list_skill_experts first`);
      }
      const detail = getExpert(match.id);
      const subagents = ctx.get("subagents");
      if (subagents === void 0) throw new Error("subagents service unavailable");
      if (typeof subagents.startActivation !== "function") {
        throw new Error("subagents.startActivation unavailable");
      }
      const prompt = expertPrompt(detail.name, task);
      const parentId = String(agent.id);
      const continueOn = getContinueChat(parentId);
      const startFresh = async () => {
        const started = await subagents.startActivation({
          provider: "spawn",
          label: detail.name,
          delivery: "caller",
          signal: exec.signal,
          request: {
            parent: agent,
            prompt,
            agentPreset: presetIdFor(detail.id)
          }
        });
        setChildId(parentId, detail.id, started.childId);
        const result = await awaitActivation(started, exec.signal);
        return answerFromResult(detail.name, result);
      };
      if (continueOn && typeof subagents.sendMessage === "function") {
        let catalog;
        if (typeof subagents.listChildren === "function") {
          try {
            catalog = await subagents.listChildren(parentId, exec.signal);
          } catch {
            catalog = void 0;
          }
        }
        const childId = resolveChildId(parentId, detail.id, detail.name, catalog);
        if (childId !== void 0) {
          const resume = new AbortController();
          const onParentAbort = () => resume.abort(exec.signal.reason);
          exec.signal.addEventListener("abort", onParentAbort, { once: true });
          try {
            const ended = awaitSubagentEnd(ctx, childId, resume.signal);
            await subagents.sendMessage(agent, childId, prompt, { signal: exec.signal });
            const result = await ended;
            setChildId(parentId, detail.id, childId);
            return answerFromResult(detail.name, result);
          } catch (error) {
            resume.abort(error);
            clearChildId(parentId, detail.id);
            const message = error instanceof Error ? error.message : String(error);
            if (exec.signal.aborted) throw error;
            if (/aborted/i.test(message)) throw error;
          } finally {
            exec.signal.removeEventListener("abort", onParentAbort);
          }
        }
      }
      return startFresh();
    }
  };
  const tools = ctx.tools;
  const disposeList = tools.register(listTool);
  const disposeSummon = tools.register(summonTool);
  const disposePrompt = ctx.systemPrompt.section({
    name: "skill-experts",
    order: 420,
    text: (context) => {
      if (context?.agent?.session?.header?.parentSession !== void 0) return "";
      const experts = listExperts().filter((row) => row.enabled);
      if (experts.length === 0) {
        return [
          "## Skill experts",
          "No skill experts are enabled. The user can enable or add them in the Skill experts sidebar."
        ].join("\n");
      }
      const parentId = context?.agent?.id;
      const continueOn = typeof parentId === "string" && getContinueChat(parentId);
      const lines = renderExpertCatalogEntries(experts).join("\n");
      return [
        "## Skill experts",
        "This Host provides domain skill experts (each backed by an Agent Preset with persona + skills).",
        "A session may already use one of these presets as its own agent; that is independent of @ summoning.",
        "",
        "Composer / `@` selection inserts a native reference chip that serializes as `@DisplayName`.",
        "Whenever the user message names an enabled expert that way, you MUST call `summon_skill_expert`",
        "once for **each** named expert before any user-facing reply to that @ mention.",
        "Use the remaining user text as `task`. Even a short greeting is a valid task \u2014 still summon.",
        "Do not answer the @ mention yourself first. Wait for each tool `answer`, then briefly synthesize.",
        "",
        "If the user did not name an expert, but the task clearly matches an enabled expert's description",
        "in the catalog below, call `summon_skill_expert` with that expert's exact display name or id",
        "before doing the work yourself. This catalog is summaries only; summon to use the expert.",
        continueOn ? "Continue-chat is on for this session: keep calling `summon_skill_expert` for the same expert (do not switch to `send_message`); the Host reuses that expert's prior child when possible." : "",
        "",
        "Call `list_skill_experts` only when the catalog below is insufficient to choose an expert.",
        "Do not use the generic `subagent` or `subagent_fork` tools in place of `summon_skill_expert` for these experts.",
        "",
        "<available_skill_experts>",
        lines,
        "</available_skill_experts>"
      ].filter((line) => line !== "").join("\n");
    }
  });
  return () => {
    disposePrompt();
    disposeSummon();
    disposeList();
  };
}

// src/index.ts
var name = "skill-experts";
var inject = ["tools", "systemPrompt"];
function apply(ctx) {
  ctx.effect(() => registerSummonTools(ctx), "skill-experts: summon tools");
}
export {
  apply,
  inject,
  name
};
