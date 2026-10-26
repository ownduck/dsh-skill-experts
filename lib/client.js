window.__ModuleLoader__.load({ id: "@woosau/dsh-skill-experts", factory: (require) => {
var module = { exports: {} };
var exports = module.exports;
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// lib/typert.remote-client.js
var import_zod = require("zod");

// ../vertax-work/packages/typert/protocol/lib/types/remote-info.js
function createTypertRemoteInfo(spec, zod) {
  return new RemoteInfo(spec, zod);
}
var RemoteInfo = class {
  spec;
  zod;
  index;
  constructor(spec, zod) {
    this.spec = spec;
    this.zod = zod;
  }
  get package() {
    return this.spec.package;
  }
  get descriptors() {
    return this.resolve().descriptors;
  }
  get methods() {
    return this.resolve().methods;
  }
  resolve() {
    if (this.index !== void 0)
      return this.index;
    const zod = this.zod;
    const descriptors = [];
    const methods = /* @__PURE__ */ Object.create(null);
    for (const [endpoint, definition] of Object.entries(this.spec.methods)) {
      const separator = endpoint.indexOf("/");
      const namespace = endpoint.slice(0, separator);
      const method = endpoint.slice(separator + 1);
      const parameters = definition.parameters.map((parameter) => ({ ...parameter, wire: parameter.wire ?? parameter.name }));
      const descriptor = {
        ...definition,
        id: `${this.spec.package}#${endpoint}`,
        namespace,
        method,
        parameters,
        result: definition.result.description === void 0 ? definition.result : new ResultValue(definition.result)
      };
      if (definition.invocation.kind === "direct") {
        const inputs = [];
        const direct = Object.assign(descriptor, {
          input(options) {
            const strict = options?.strict === true;
            return inputs[strict ? 1 : 0] ??= new NamedInput(parameters, strict, zod);
          },
          invoke(remote, input, signal) {
            const named = input;
            const values = parameters.map((parameter) => named[parameter.wire]);
            if (definition.cancellation !== void 0)
              values.push(signal);
            const receiver = Reflect.get(remote, namespace);
            const call = Reflect.get(receiver, method);
            return call.apply(receiver, values);
          }
        });
        methods[endpoint] = direct;
      }
      descriptors.push(descriptor);
    }
    return this.index = { descriptors, methods };
  }
};
function optional(parameter) {
  return parameter.source === "json" && parameter.acceptsUndefined === true;
}
var NamedInput = class {
  parameters;
  strict;
  zod;
  schema;
  projection;
  constructor(parameters, strict, zod) {
    this.parameters = parameters;
    this.strict = strict;
    this.zod = zod;
  }
  codec(parameter) {
    return this.strict ? parameter.strictCodec : parameter.codec;
  }
  create = () => this.schema ??= this.zod.strictObject(Object.fromEntries(this.parameters.map((parameter) => {
    const value = this.codec(parameter).create();
    return [parameter.wire, optional(parameter) ? value.optional() : value.nonoptional()];
  })));
  get jsonSchema() {
    return this.project().jsonSchema;
  }
  get jsonSchemaError() {
    return this.project().jsonSchemaError;
  }
  project() {
    if (this.projection !== void 0)
      return this.projection;
    const unavailable = this.parameters.find((parameter) => this.codec(parameter).jsonSchema === void 0);
    if (unavailable !== void 0) {
      return this.projection = { jsonSchemaError: this.codec(unavailable).jsonSchemaError ?? `No JSON Schema for parameter ${unavailable.wire}` };
    }
    return this.projection = {
      jsonSchema: {
        type: "object",
        properties: Object.fromEntries(this.parameters.map((parameter) => [parameter.wire, {
          ...this.codec(parameter).jsonSchema,
          ...parameter.description === void 0 ? {} : { description: parameter.description }
        }])),
        required: this.parameters.filter((parameter) => !optional(parameter)).map((parameter) => parameter.wire),
        additionalProperties: false
      }
    };
  }
};
var ResultValue = class {
  spec;
  projection;
  constructor(spec) {
    this.spec = spec;
  }
  get mode() {
    return this.spec.mode;
  }
  get typeSymbol() {
    return this.spec.typeSymbol;
  }
  get create() {
    return this.spec.create;
  }
  get decode() {
    return this.spec.decode;
  }
  get encode() {
    return this.spec.encode;
  }
  get description() {
    return this.spec.description;
  }
  get jsonSchemaError() {
    return this.spec.jsonSchemaError;
  }
  get jsonSchema() {
    if (this.projection === void 0) {
      const schema = this.spec.jsonSchema;
      this.projection = { value: schema === void 0 ? void 0 : { ...schema, description: this.spec.description } };
    }
    return this.projection.value;
  }
};

// lib/typert.remote-client.js
var str = () => import_zod.z.string();
var expertSave = () => import_zod.z.object({
  id: import_zod.z.string().optional(),
  name: import_zod.z.string(),
  avatar: import_zod.z.string(),
  persona: import_zod.z.string()
});
var skillSave = () => import_zod.z.object({
  name: import_zod.z.string(),
  description: import_zod.z.string(),
  prompt: import_zod.z.string(),
  note: import_zod.z.string().optional(),
  fromName: import_zod.z.string().optional()
});
var expertSummary = () => import_zod.z.object({
  id: import_zod.z.string(),
  name: import_zod.z.string(),
  avatar: import_zod.z.string(),
  skillCount: import_zod.z.number(),
  presetId: import_zod.z.string()
});
var skillSummary = () => import_zod.z.object({
  name: import_zod.z.string(),
  description: import_zod.z.string(),
  note: import_zod.z.string(),
  absolutePath: import_zod.z.string()
});
var expertDetail = () => expertSummary().extend({
  persona: import_zod.z.string(),
  skills: import_zod.z.array(skillSummary()),
  rootPath: import_zod.z.string()
});
var skillDetail = () => skillSummary().extend({
  prompt: import_zod.z.string(),
  extraFiles: import_zod.z.array(import_zod.z.string())
});
var importResult = () => import_zod.z.object({ imported: import_zod.z.array(import_zod.z.string()) });
var anyJson = { type: "object", additionalProperties: true };
var TYPERT_REMOTE = createTypertRemoteInfo({
  package: "@woosau/dsh-skill-experts",
  methods: {
    "skillExperts/list": {
      service: "skillExperts",
      description: "List skill experts.",
      invocation: { kind: "direct" },
      parameters: [],
      result: {
        mode: "strict",
        typeSymbol: "ExpertSummary[]",
        create: () => import_zod.z.array(expertSummary()),
        description: "expert summaries",
        jsonSchema: { type: "array", items: anyJson }
      },
      sourceLocation: { file: "src/index.ts", line: 1, column: 1 }
    },
    "skillExperts/get": {
      service: "skillExperts",
      description: "Get one expert.",
      invocation: { kind: "direct" },
      parameters: [{
        name: "id",
        description: "expert id",
        source: "json",
        codec: { mode: "strict", typeSymbol: "string", create: str, jsonSchema: { type: "string" } }
      }],
      result: {
        mode: "strict",
        typeSymbol: "ExpertDetail",
        create: expertDetail,
        description: "expert detail",
        jsonSchema: anyJson
      },
      sourceLocation: { file: "src/index.ts", line: 1, column: 1 }
    },
    "skillExperts/saveExpert": {
      service: "skillExperts",
      description: "Create or update an expert.",
      invocation: { kind: "direct" },
      parameters: [{
        name: "input",
        description: "expert fields",
        source: "json",
        codec: { mode: "strict", typeSymbol: "ExpertSaveInput", create: expertSave, jsonSchema: anyJson }
      }],
      result: {
        mode: "strict",
        typeSymbol: "ExpertDetail",
        create: expertDetail,
        description: "saved expert",
        jsonSchema: anyJson
      },
      sourceLocation: { file: "src/index.ts", line: 1, column: 1 }
    },
    "skillExperts/deleteExpert": {
      service: "skillExperts",
      description: "Delete an expert.",
      invocation: { kind: "direct" },
      parameters: [{
        name: "id",
        description: "expert id",
        source: "json",
        codec: { mode: "strict", typeSymbol: "string", create: str, jsonSchema: { type: "string" } }
      }],
      result: {
        mode: "strict",
        typeSymbol: "void",
        create: () => import_zod.z.undefined(),
        description: "void",
        jsonSchema: { type: "null" }
      },
      sourceLocation: { file: "src/index.ts", line: 1, column: 1 }
    },
    "skillExperts/getSkill": {
      service: "skillExperts",
      description: "Get one skill.",
      invocation: { kind: "direct" },
      parameters: [
        {
          name: "expertId",
          description: "expert id",
          source: "json",
          codec: { mode: "strict", typeSymbol: "string", create: str, jsonSchema: { type: "string" } }
        },
        {
          name: "skillName",
          description: "skill name",
          source: "json",
          codec: { mode: "strict", typeSymbol: "string", create: str, jsonSchema: { type: "string" } }
        }
      ],
      result: {
        mode: "strict",
        typeSymbol: "SkillDetail",
        create: skillDetail,
        description: "skill detail",
        jsonSchema: anyJson
      },
      sourceLocation: { file: "src/index.ts", line: 1, column: 1 }
    },
    "skillExperts/saveSkill": {
      service: "skillExperts",
      description: "Create or update a skill.",
      invocation: { kind: "direct" },
      parameters: [
        {
          name: "expertId",
          description: "expert id",
          source: "json",
          codec: { mode: "strict", typeSymbol: "string", create: str, jsonSchema: { type: "string" } }
        },
        {
          name: "input",
          description: "skill fields",
          source: "json",
          codec: { mode: "strict", typeSymbol: "SkillSaveInput", create: skillSave, jsonSchema: anyJson }
        }
      ],
      result: {
        mode: "strict",
        typeSymbol: "SkillDetail",
        create: skillDetail,
        description: "saved skill",
        jsonSchema: anyJson
      },
      sourceLocation: { file: "src/index.ts", line: 1, column: 1 }
    },
    "skillExperts/deleteSkill": {
      service: "skillExperts",
      description: "Delete a skill.",
      invocation: { kind: "direct" },
      parameters: [
        {
          name: "expertId",
          description: "expert id",
          source: "json",
          codec: { mode: "strict", typeSymbol: "string", create: str, jsonSchema: { type: "string" } }
        },
        {
          name: "skillName",
          description: "skill name",
          source: "json",
          codec: { mode: "strict", typeSymbol: "string", create: str, jsonSchema: { type: "string" } }
        }
      ],
      result: {
        mode: "strict",
        typeSymbol: "void",
        create: () => import_zod.z.undefined(),
        description: "void",
        jsonSchema: { type: "null" }
      },
      sourceLocation: { file: "src/index.ts", line: 1, column: 1 }
    },
    "skillExperts/importZip": {
      service: "skillExperts",
      description: "Import skills from a zip (base64).",
      invocation: { kind: "direct" },
      parameters: [
        {
          name: "expertId",
          description: "expert id",
          source: "json",
          codec: { mode: "strict", typeSymbol: "string", create: str, jsonSchema: { type: "string" } }
        },
        {
          name: "zipBase64",
          description: "zip as base64",
          source: "json",
          codec: { mode: "strict", typeSymbol: "string", create: str, jsonSchema: { type: "string" } }
        }
      ],
      result: {
        mode: "strict",
        typeSymbol: "ImportResult",
        create: importResult,
        description: "imported names",
        jsonSchema: anyJson
      },
      sourceLocation: { file: "src/index.ts", line: 1, column: 1 }
    }
  }
}, import_zod.z);
var typert_remote_client_default = TYPERT_REMOTE;

// src/client/ExpertsIcon.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function ExpertsIcon({ size }) {
  const s = size ?? 16;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "span",
    {
      "aria-hidden": "true",
      style: {
        display: "inline-flex",
        width: s,
        height: s,
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.max(12, s - 2),
        lineHeight: 1
      },
      children: "\u{1F9E0}"
    }
  );
}

// src/client/ExpertsPanel.tsx
var import_react = require("react");

// src/client/ExpertsPanel.module.css
var css = ".SkillExperts_root {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  min-height: 0;\n  padding: 16px 20px;\n  gap: 12px;\n  box-sizing: border-box;\n}\n\n.SkillExperts_header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n}\n\n.SkillExperts_title {\n  margin: 0;\n  font-size: 18px;\n  font-weight: 600;\n}\n\n.SkillExperts_row {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  padding: 10px 12px;\n  border: 1px solid color-mix(in srgb, CanvasText 12%, transparent);\n  border-radius: 8px;\n  background: transparent;\n  cursor: pointer;\n  text-align: left;\n  width: 100%;\n}\n\n.SkillExperts_row:hover {\n  background: color-mix(in srgb, CanvasText 4%, transparent);\n}\n\n.SkillExperts_avatar {\n  font-size: 22px;\n  line-height: 1;\n  width: 28px;\n  text-align: center;\n}\n\n.SkillExperts_meta {\n  flex: 1;\n  min-width: 0;\n}\n\n.SkillExperts_name {\n  font-weight: 600;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.SkillExperts_sub {\n  font-size: 12px;\n  opacity: 0.7;\n}\n\n.SkillExperts_list {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  overflow: auto;\n  min-height: 0;\n  flex: 1;\n}\n\n.SkillExperts_actions {\n  display: flex;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n\n.SkillExperts_field {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  margin-bottom: 10px;\n}\n\n.SkillExperts_field label {\n  font-size: 12px;\n  opacity: 0.8;\n}\n\n.SkillExperts_field input,\n.SkillExperts_field textarea {\n  font: inherit;\n  padding: 8px 10px;\n  border-radius: 6px;\n  border: 1px solid color-mix(in srgb, CanvasText 16%, transparent);\n  background: Canvas;\n  color: CanvasText;\n}\n\n.SkillExperts_field textarea {\n  min-height: 96px;\n  resize: vertical;\n}\n\n.SkillExperts_table {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 13px;\n}\n\n.SkillExperts_table th,\n.SkillExperts_table td {\n  border-bottom: 1px solid color-mix(in srgb, CanvasText 10%, transparent);\n  padding: 6px 8px;\n  text-align: left;\n  vertical-align: top;\n}\n\n.SkillExperts_muted {\n  opacity: 0.7;\n  font-size: 13px;\n}\n\n.SkillExperts_error {\n  color: tomato;\n  font-size: 13px;\n}\n\n.SkillExperts_files {\n  margin: 0;\n  padding-left: 18px;\n  font-size: 12px;\n}\n\n.SkillExperts_path {\n  font-family: ui-monospace, monospace;\n  font-size: 12px;\n  word-break: break-all;\n}\n";
if (typeof document !== "undefined" && !document.getElementById("dsh-skill-experts-css")) {
  const style = document.createElement("style");
  style.id = "dsh-skill-experts-css";
  style.textContent = css;
  document.head.appendChild(style);
}
var ExpertsPanel_default = { "root": "SkillExperts_root", "header": "SkillExperts_header", "title": "SkillExperts_title", "row": "SkillExperts_row", "avatar": "SkillExperts_avatar", "meta": "SkillExperts_meta", "name": "SkillExperts_name", "sub": "SkillExperts_sub", "list": "SkillExperts_list", "actions": "SkillExperts_actions", "field": "SkillExperts_field", "table": "SkillExperts_table", "muted": "SkillExperts_muted", "error": "SkillExperts_error", "files": "SkillExperts_files", "path": "SkillExperts_path" };

// src/client/ExpertsPanel.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function ExpertsPanel({ t, list, get, saveExpert, deleteExpert, getSkill, saveSkill, deleteSkill, importZip }) {
  const [view, setView] = (0, import_react.useState)({ kind: "list" });
  const [rows, setRows] = (0, import_react.useState)(null);
  const [error, setError] = (0, import_react.useState)("");
  const [busy, setBusy] = (0, import_react.useState)(false);
  const reload = (0, import_react.useCallback)(async () => {
    setError("");
    try {
      setRows(await list());
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
      setRows([]);
    }
  }, [list, t]);
  (0, import_react.useEffect)(() => {
    void reload();
  }, [reload]);
  if (view.kind === "expert") {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      ExpertEditor,
      {
        t,
        expertId: view.id,
        get,
        saveExpert,
        deleteExpert,
        getSkill,
        saveSkill,
        deleteSkill,
        importZip,
        busy,
        setBusy,
        onBack: () => {
          setView({ kind: "list" });
          void reload();
        },
        onOpenSkill: (expertId, skillName) => setView({ kind: "skill", expertId, skillName }),
        onNewSkill: (expertId) => setView({ kind: "skill", expertId })
      }
    );
  }
  if (view.kind === "skill") {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      SkillEditor,
      {
        t,
        expertId: view.expertId,
        skillName: view.skillName,
        getSkill,
        saveSkill,
        deleteSkill,
        busy,
        setBusy,
        onBack: () => setView({ kind: "expert", id: view.expertId })
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ExpertsPanel_default.root, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ExpertsPanel_default.header, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h1", { className: ExpertsPanel_default.title, children: t("title") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: () => setView({ kind: "expert" }), children: t("new") })
    ] }),
    error !== "" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: ExpertsPanel_default.error, children: error }),
    rows === null ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: ExpertsPanel_default.muted, children: t("loading") }) : rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: ExpertsPanel_default.muted, children: t("empty") }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: ExpertsPanel_default.list, children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: ExpertsPanel_default.row, onClick: () => setView({ kind: "expert", id: row.id }), children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: ExpertsPanel_default.avatar, children: row.avatar }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: ExpertsPanel_default.meta, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: ExpertsPanel_default.name, children: row.name }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ExpertsPanel_default.sub, children: [
          row.skillCount,
          " \xB7 ",
          row.id
        ] })
      ] })
    ] }, row.id)) })
  ] });
}
function ExpertEditor(props) {
  const { t } = props;
  const [name, setName] = (0, import_react.useState)("");
  const [avatar, setAvatar] = (0, import_react.useState)("\u{1F9E0}");
  const [persona, setPersona] = (0, import_react.useState)("");
  const [skills, setSkills] = (0, import_react.useState)([]);
  const [rootPath, setRootPath] = (0, import_react.useState)("");
  const [error, setError] = (0, import_react.useState)("");
  const [id, setId] = (0, import_react.useState)(props.expertId);
  const fileRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    if (props.expertId === void 0) return;
    void (async () => {
      try {
        const detail = await props.get(props.expertId);
        setId(detail.id);
        setName(detail.name);
        setAvatar(detail.avatar);
        setPersona(detail.persona);
        setSkills(detail.skills);
        setRootPath(detail.rootPath);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("error"));
      }
    })();
  }, [props.expertId, props.get, t]);
  const save = async () => {
    props.setBusy(true);
    setError("");
    try {
      const detail = await props.saveExpert({
        ...id === void 0 ? {} : { id },
        name,
        avatar,
        persona
      });
      setId(detail.id);
      setSkills(detail.skills);
      setRootPath(detail.rootPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      props.setBusy(false);
    }
  };
  const remove = async () => {
    if (id === void 0) {
      props.onBack();
      return;
    }
    if (!window.confirm(t("confirmDelete"))) return;
    props.setBusy(true);
    try {
      await props.deleteExpert(id);
      props.onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      props.setBusy(false);
    }
  };
  const onZip = async (file) => {
    if (file === void 0 || id === void 0) return;
    props.setBusy(true);
    setError("");
    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (const byte of buffer) binary += String.fromCharCode(byte);
      const detail = await props.importZip(id, btoa(binary));
      void detail;
      const next = await props.get(id);
      setSkills(next.skills);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      props.setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ExpertsPanel_default.root, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ExpertsPanel_default.header, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h1", { className: ExpertsPanel_default.title, children: id === void 0 ? t("new") : t("edit") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ExpertsPanel_default.actions, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: props.onBack, disabled: props.busy, children: t("cancel") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: () => void save(), disabled: props.busy, children: t("save") }),
        id !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: () => void remove(), disabled: props.busy, children: t("delete") })
      ] })
    ] }),
    error !== "" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: ExpertsPanel_default.error, children: error }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ExpertsPanel_default.field, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: "se-avatar", children: t("avatar") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { id: "se-avatar", value: avatar, onChange: (e) => setAvatar(e.target.value), maxLength: 8 })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ExpertsPanel_default.field, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: "se-name", children: t("name") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { id: "se-name", value: name, onChange: (e) => setName(e.target.value) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ExpertsPanel_default.field, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: "se-persona", children: t("persona") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("textarea", { id: "se-persona", value: persona, onChange: (e) => setPersona(e.target.value) })
    ] }),
    rootPath !== "" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: ExpertsPanel_default.path, children: rootPath }),
    id !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ExpertsPanel_default.header, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: t("skills") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ExpertsPanel_default.actions, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: () => props.onNewSkill(id), disabled: props.busy, children: t("addSkill") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: () => fileRef.current?.click(), disabled: props.busy, children: t("importZip") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { ref: fileRef, type: "file", accept: ".zip,application/zip", hidden: true, onChange: (e) => void onZip(e.target.files?.[0]) })
        ] })
      ] }),
      skills.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: ExpertsPanel_default.muted, children: t("noSkills") }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("table", { className: ExpertsPanel_default.table, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: t("skillName") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: t("skillDescription") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: t("skillNote") })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("tbody", { children: skills.map((skill) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { style: { cursor: "pointer" }, onClick: () => props.onOpenSkill(id, skill.name), children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { children: skill.name }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { children: skill.description }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { children: skill.note })
        ] }, skill.name)) })
      ] })
    ] })
  ] });
}
function SkillEditor(props) {
  const { t } = props;
  const [name, setName] = (0, import_react.useState)(props.skillName ?? "");
  const [description, setDescription] = (0, import_react.useState)("");
  const [note, setNote] = (0, import_react.useState)("");
  const [prompt, setPrompt] = (0, import_react.useState)("");
  const [absolutePath, setAbsolutePath] = (0, import_react.useState)("");
  const [extraFiles, setExtraFiles] = (0, import_react.useState)([]);
  const [fromName, setFromName] = (0, import_react.useState)(props.skillName);
  const [error, setError] = (0, import_react.useState)("");
  (0, import_react.useEffect)(() => {
    if (props.skillName === void 0) return;
    void (async () => {
      try {
        const detail = await props.getSkill(props.expertId, props.skillName);
        setName(detail.name);
        setDescription(detail.description);
        setNote(detail.note);
        setPrompt(detail.prompt);
        setAbsolutePath(detail.absolutePath);
        setExtraFiles(detail.extraFiles);
        setFromName(detail.name);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("error"));
      }
    })();
  }, [props.expertId, props.skillName, props.getSkill, t]);
  const save = async () => {
    props.setBusy(true);
    setError("");
    try {
      const detail = await props.saveSkill(props.expertId, {
        name,
        description,
        prompt,
        note,
        ...fromName === void 0 || fromName === name ? {} : { fromName }
      });
      setFromName(detail.name);
      setAbsolutePath(detail.absolutePath);
      setExtraFiles(detail.extraFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      props.setBusy(false);
    }
  };
  const remove = async () => {
    if (fromName === void 0) {
      props.onBack();
      return;
    }
    if (!window.confirm(t("confirmDelete"))) return;
    props.setBusy(true);
    try {
      await props.deleteSkill(props.expertId, fromName);
      props.onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      props.setBusy(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ExpertsPanel_default.root, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ExpertsPanel_default.header, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h1", { className: ExpertsPanel_default.title, children: props.skillName === void 0 ? t("addSkill") : t("edit") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ExpertsPanel_default.actions, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: props.onBack, disabled: props.busy, children: t("cancel") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: () => void save(), disabled: props.busy, children: t("save") }),
        fromName !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", onClick: () => void remove(), disabled: props.busy, children: t("delete") })
      ] })
    ] }),
    error !== "" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: ExpertsPanel_default.error, children: error }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ExpertsPanel_default.field, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: "sk-name", children: t("skillName") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { id: "sk-name", value: name, onChange: (e) => setName(e.target.value), placeholder: "kebab-case" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ExpertsPanel_default.field, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: "sk-desc", children: t("skillDescription") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { id: "sk-desc", value: description, onChange: (e) => setDescription(e.target.value) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ExpertsPanel_default.field, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: "sk-note", children: t("skillNote") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { id: "sk-note", value: note, onChange: (e) => setNote(e.target.value) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ExpertsPanel_default.field, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: "sk-prompt", children: t("skillPrompt") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("textarea", { id: "sk-prompt", value: prompt, onChange: (e) => setPrompt(e.target.value), style: { minHeight: 180 } })
    ] }),
    absolutePath !== "" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ExpertsPanel_default.field, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { children: t("skillPath") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: ExpertsPanel_default.path, children: absolutePath })
    ] }),
    extraFiles.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: ExpertsPanel_default.field, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { children: t("skillFiles") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { className: ExpertsPanel_default.files, children: extraFiles.map((file) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("li", { children: file }, file)) })
    ] })
  ] });
}

// src/client/locales.ts
var NS = "skill-experts";
var zh = {
  panel: "\u6280\u80FD\u4E13\u5BB6",
  title: "\u6280\u80FD\u4E13\u5BB6",
  loading: "\u52A0\u8F7D\u4E2D\u2026",
  empty: "\u6682\u65E0\u4E13\u5BB6",
  new: "\u65B0\u5EFA",
  edit: "\u7F16\u8F91",
  delete: "\u5220\u9664",
  save: "\u4FDD\u5B58",
  cancel: "\u53D6\u6D88",
  name: "\u540D\u79F0",
  avatar: "\u5934\u50CF",
  persona: "\u4EBA\u683C",
  skills: "\u6280\u80FD",
  skillName: "\u540D\u79F0",
  skillDescription: "\u63CF\u8FF0",
  skillNote: "\u7B80\u4ECB",
  skillPrompt: "\u6B63\u6587",
  skillPath: "\u8DEF\u5F84",
  skillFiles: "\u5176\u4ED6\u6587\u4EF6",
  addSkill: "\u65B0\u589E\u6280\u80FD",
  importZip: "\u5BFC\u5165 zip",
  noSkills: "\u6682\u65E0\u6280\u80FD",
  confirmDelete: "\u786E\u8BA4\u5220\u9664\uFF1F",
  error: "\u64CD\u4F5C\u5931\u8D25"
};
var en = {
  panel: "Skill experts",
  title: "Skill experts",
  loading: "Loading\u2026",
  empty: "No experts yet",
  new: "New",
  edit: "Edit",
  delete: "Delete",
  save: "Save",
  cancel: "Cancel",
  name: "Name",
  avatar: "Avatar",
  persona: "Persona",
  skills: "Skills",
  skillName: "Name",
  skillDescription: "Description",
  skillNote: "Note",
  skillPrompt: "Prompt",
  skillPath: "Path",
  skillFiles: "Other files",
  addSkill: "Add skill",
  importZip: "Import zip",
  noSkills: "No skills",
  confirmDelete: "Delete this item?",
  error: "Request failed"
};

// src/client/mount.ts
var inject = ["remote", "slots", "locale"];
var PANEL_ID = "skill-experts";
function registerUi(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), "skill-experts: dictionaries");
  const t = ctx.locale.bind(NS);
  const call = async (result) => {
    if (!result.ok) throw result.error;
    return result.value;
  };
  const injectPanel = () => {
    const remote = ctx.remote.skillExperts;
    return {
      t: (key) => t(key),
      list: async () => call(await remote.list()),
      get: async (id) => call(await remote.get(id)),
      saveExpert: async (input) => call(await remote.saveExpert(input)),
      deleteExpert: async (id) => call(await remote.deleteExpert(id)),
      getSkill: async (expertId, skillName) => call(await remote.getSkill(expertId, skillName)),
      saveSkill: async (expertId, input) => call(await remote.saveSkill(expertId, input)),
      deleteSkill: async (expertId, skillName) => call(await remote.deleteSkill(expertId, skillName)),
      importZip: async (expertId, zipBase64) => call(await remote.importZip(expertId, zipBase64))
    };
  };
  ctx.slots.inject("main", () => ctx.slots.register({
    name: "main",
    key: PANEL_ID,
    locale: NS,
    inject: injectPanel
  }, ExpertsPanel));
  ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
    name: "sidebar.panellist",
    id: PANEL_ID,
    order: 5,
    locale: NS,
    label: () => t("panel")
  }, ExpertsIcon));
}
async function mountSkillExperts(ctx, contribution) {
  const unmountRemote = await ctx.remote.$mount(contribution);
  const ui = ctx.inject(["remote.skillExperts", "slots", "locale"], (child) => registerUi(child));
  try {
    await ui;
  } catch (error) {
    await ui.dispose();
    await unmountRemote();
    throw error;
  }
  return async () => {
    await ui.dispose();
    await unmountRemote();
  };
}

// src/client/index.ts
async function apply(ctx) {
  return await mountSkillExperts(ctx, typert_remote_client_default);
}
return module.exports;
	}
});
//# sourceMappingURL=client.js.map
