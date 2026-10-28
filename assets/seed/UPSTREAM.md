# Seed upstream sources

Builtin experts are skill packs: a short `meta.persona` plus one subordinate skill that holds the full upstream text.

## Persona

`persona` = upstream frontmatter / `SKILL.md` `description` (agency prefers `descriptionEn` when present) plus a pointer to the subordinate skill name. Capability detail lives only in the skill, not in persona.

## Skills (full upstream, not abbreviated)

| Expert id | Skill dir | Upstream |
|-----------|-----------|----------|
| `frontend-developer` | `skills/frontend-developer/SKILL.md` | [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) `engineering/engineering-frontend-developer.md` (local snapshot via `@michengai/dsh-agency-agents`) |
| `product-manager` | `skills/product-manager/SKILL.md` | same repo `product/product-manager.md` |
| `ui-designer` | `skills/ui-designer/SKILL.md` | same repo `design/design-ui-designer.md` |
| `copywriter` | `skills/copywriting/` (incl. `references/`) | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) `skills/copywriting/` |

Agency skill files wrap the complete upstream markdown (original frontmatter retained in the body). Skill frontmatter `name` is kebab-case for catalog validation. Copywriting is a directory copy including `references/copy-frameworks.md`, `references/ai-tells.md`, and `references/natural-transitions.md`.

Upstream agent personas and marketing skills remain MIT-licensed as in their source repositories.
