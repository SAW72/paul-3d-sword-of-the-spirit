# Blender Character Handoff — PAUL-3D-SWORD-2026
## Project: SAW72/paul-3d-sword-of-the-spirit
### "Paul: From Hunted to Hunter — Sword of the Spirit"

**Purpose:** Hand these files to Blender agents (human or AI) so they can build **game-ready 3D character meshes** that match the existing photoreal cinematic portraits and the current Three.js procedural rig in `js/character-mesh.js`.

---

## Package contents

| Path | What it is |
|------|------------|
| `README.md` | This file — start here |
| `CHARACTER_ROSTER.json` | Machine-readable list of all characters + paths |
| `technical_specs.md` | Scale, poly budgets, armature, materials, glTF export rules |
| `briefs/*.md` | One detailed brief per character (face, body, clothing, colors, pose) |
| `references/*.jpg` | Canonical portrait references from `assets/characters/` on GitHub |
| `blender_export_checklist.md` | QA before handing models back into the web game |

---

## Characters to model (priority order)

1. **young_disciple** — Player avatar Level 1 (highest priority)
2. **ananias** — Player Level 2
3. **paul_mature** — Player Levels 3–7
4. **paul_final** — Level 8 victory / crown version
5. **young_saul** — Antagonist / cutscene (pre-conversion)
6. **peter** — Level 5 companion / confrontation
7. **guard** — Enemy (can reuse mesh + armor variant)
8. **lame_man** — Level 3 NPC (no portrait; brief from design doc only)

Portraits live in `references/`. They are the **visual source of truth** for face, hair, clothing colors, and silhouette.

---

## Art direction (from CHARACTERS.md + README)

- Style: **AAA cinematic realism** hybrid — Uncharted / Assassin’s Creed / *The Chosen*
- Audience: ages **8–15** (heroic, non-gory, readable faces at chase-camera distance)
- Setting: 1st-century Jewish / Greco-Roman (tunics, cloaks, leather, bronze armor — not high medieval plate)
- Current game uses **procedural low-poly Three.js meshes + face billboard cards** cut from these JPGs. Goal of this handoff: replace those with **real glTF characters** (skinned, walk-ready).

---

## Deliverables expected from Blender agents

For **each** character:

1. `characters/<id>/<id>.blend` — source file
2. `characters/<id>/<id>.glb` — exported glTF binary (preferred for Three.js)
3. Optional: `characters/<id>/<id>_diffuse.png` (2K max) if not packed
4. Short `notes.md` if anything diverged from the brief

See `technical_specs.md` for naming, bone list, scale, and poly targets.

---

## Repo links

- GitHub: https://github.com/SAW72/paul-3d-sword-of-the-spirit
- Live portraits path: `assets/characters/*.jpg`
- Current runtime mesh builder: `js/character-mesh.js` (roles: disciple, ananias, paul, peter, guard, lame)
- Project code: `PAUL-3D-SWORD-2026`

---

## How agents should work

1. Read `technical_specs.md` once.
2. Open the matching `briefs/<id>.md` + `references/<id>.jpg`.
3. Block out proportions → sculpt/refine → retopo → UV → materials → armature → walk/idle test → export glTF.
4. Run `blender_export_checklist.md` before delivery.

Do **not** invent modern clothing, firearms, or cartoon stylization unless the brief explicitly allows a low-poly stylized pass (default = realistic proportions, slightly simplified forms for web performance).
