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
var LEGACY_BUILTIN_IDS = /* @__PURE__ */ new Set(["code-reviewer", "tech-writer"]);
function resolveBuiltin(id, rawBuiltin) {
  if (rawBuiltin === true) return true;
  if (rawBuiltin === false) return false;
  return LEGACY_BUILTIN_IDS.has(id);
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
  const builtin = resolveBuiltin(id, raw.builtin);
  return { id, name: name2, description, avatar, persona, builtin };
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
  return catalog.experts.flatMap((id) => {
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
}
function getExpert(id) {
  ensureState(readCatalog().experts);
  return toDetail(readMeta(id), enabledSet().has(id));
}

// src/summon.ts
var LIST = "list_skill_experts";
var SUMMON = "summon_skill_expert";
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
function registerSummonTools(ctx) {
  const listTool = {
    name: LIST,
    description: "List enabled skill experts managed by dsh-skill-experts (id, name, avatar, skillCount, presetId, source). Call this before summon_skill_expert only when the user did not name an expert. Do not use the generic subagent tool for these experts.",
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
    description: "Summon one skill expert as a spawn subagent with that expert's Agent Preset (persona + isolated skills) and return its answer to the parent. If the user message contains a skill-expert chip, @DisplayName, or [Skill expert chip ...] marker for this expert, you MUST call this immediately (once per named expert). Do not greet or answer that @ mention yourself first. Pass a short task brief from the remaining user text. Do not use the generic subagent tool for skill experts.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        expert: {
          type: "string",
          description: "Expert id or exact display name from list_skill_experts."
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
      const prompt = [{
        type: "text",
        text: [
          `You are the skill expert "${detail.name}".`,
          "Follow your persona and use your available skills as needed.",
          "",
          "## Task",
          task
        ].join("\n")
      }];
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
      const result = await awaitActivation(started, exec.signal);
      const answer = textBlocks(result.output).trim();
      if (result.stopReason !== "completed") {
        const detailText = answer.length > 0 ? ` Partial output:
${answer}` : "";
        throw new Error(`skill expert "${detail.name}" ended with ${result.stopReason}.${detailText}`);
      }
      if (answer === "") {
        throw new Error(`skill expert "${detail.name}" returned no usable text`);
      }
      return { expert: detail.name, answer };
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
      const lines = experts.map((row) => `- ${row.name} (id: ${row.id}, source: ${row.source}, skills: ${row.skillCount})`).join("\n");
      return [
        "## Skill experts",
        "This Host provides domain skill experts (each backed by an Agent Preset with persona + skills).",
        "A session may already use one of these presets as its own agent; that is independent of @ summoning.",
        "",
        "Composer / `@` selection inserts a native reference chip. On submit it expands to",
        '`@DisplayName` plus a `[Skill expert chip id="\u2026" name="\u2026"]` mandatory-summon marker.',
        "Whenever the user message contains such a chip, `@DisplayName` for an enabled expert,",
        "or that marker: you MUST call `summon_skill_expert` once for **each** named expert",
        "before any user-facing reply to that @ mention. Use the remaining user text (excluding chip markers) as `task`.",
        "Even a short greeting or question is a valid task \u2014 still summon.",
        "Do not answer the @ mention yourself first. Wait for each tool `answer`, then briefly synthesize.",
        "",
        "Call `list_skill_experts` only when the user did not name an expert but the task clearly matches one.",
        "Do not use the generic `subagent` or `subagent_fork` tools in place of `summon_skill_expert` for these experts.",
        "",
        "Enabled experts:",
        lines
      ].join("\n");
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
