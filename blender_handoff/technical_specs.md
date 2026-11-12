# Technical Specs — Blender → Three.js (PAUL-3D-SWORD-2026)

## Engine target
- **Three.js** (r150+ class) in browser / mobile
- Import via `GLTFLoader`
- Must run on mid-tier phones (New 3DS-class is *not* the target; modern browser is)

## Units & scale
| Setting | Value |
|---------|--------|
| Blender unit | 1.0 = **1 meter** |
| Character height (standing, feet to crown of head) | **1.65 – 1.75 m** (disciple slightly shorter ~1.60–1.68; guard ~1.78) |
| Origin | World origin at **feet / ground contact** (Y-up after export if needed) |
| Axis | Blender default (Z-up) is OK; glTF export should apply **+Y up** (glTF standard). Use glTF export “+Y Up” |

Three.js scene already treats characters as ~1.6–1.8 unit tall with origin at feet.

## Polygon budgets (game-ready, after retopo)
| LOD | Triangles (total mesh, no LOD0 accessories) | Notes |
|-----|---------------------------------------------|--------|
| **Primary (use this)** | **4,000 – 8,000** | Full body + clothes; head ~1.5–2.5k |
| Soft max | 12,000 | Only for paul_final / guard armor if needed |
| Avoid | 20k+ | Will hurt mobile + many instances (guards) |

Quads preferred in Blender; export triangulates. No ngons on deformation areas.

## Topology rules
- Edge loops for shoulders, elbows, hips, knees, face (eyelids, mouth, brow)
- No poles on high-deform zones if avoidable
- Clothing should be **separate mesh objects** parented/weighted OR joined with clean seams (prefer separate for easy recolor: tunic, cloak, belt, armor)
- Hands: simple 3–4 finger mitts OK for guards; player characters can have more detailed hands if under budget

## UV & textures
- **1 UDIM / 1 atlas per character** preferred, or body + face split
- Texture size: **1024 or 2048** max per map (1024 preferred for mobile)
- Maps: BaseColor (sRGB), Roughness, Metallic (or ORM packed), optional Normal (OpenGL)
- Face: keep high-frequency detail on face region of atlas (matches portrait)
- No transparency except soft hair cards if used (prefer solid hair mesh for web)

## Materials (Principled BSDF → glTF PBR)
Match hex colors from `js/character-mesh.js` as base, refine from portraits:

| Role | Skin | Hair | Tunic / main cloth | Sash / accent |
|------|------|------|--------------------|---------------|
| disciple | `#C4A882` | `#241810` | `#D2C0A0` | `#4A3420` |
| ananias | `#B8946A` | `#7A7468` | `#4A4034` | `#8A7A50` |
| paul | `#B88860` | `#3A3028` | `#3D4A38` | `#C9A227` (gold) |
| peter | `#C09870` | `#8A8070` | `#3A4A58` | `#6A8090` |
| guard | `#B88860` | `#2A1A10` | `#6A1814` (crimson) | armor `#8A7A58` bronze |

Roughness: skin ~0.45–0.6, cloth ~0.8–0.9, metal armor ~0.25–0.4, gold sash ~0.35

## Armature (required for walk cycle)
**Name:** `Armature`  
**Root bone:** `root` (hips or dedicated root; feet stay planted)

### Minimum bone set (Mixamo-compatible naming encouraged)
```
root
  hips
    spine
      chest
        neck
          head
        shoulder_L → upper_arm_L → forearm_L → hand_L
        shoulder_R → upper_arm_R → forearm_R → hand_R
    thigh_L → shin_L → foot_L → toe_L
    thigh_R → shin_R → foot_R → toe_R
```

Optional fingers only if budget allows.  

**Weight paint:** shoulders/hips must deform cleanly for walk. No naked vertices.

## Animations to include in glTF (or separate clips)
| Clip name | Loop | Notes |
|-----------|------|--------|
| `Idle` | yes | Subtle breathing / weight shift |
| `Walk` | yes | Forward, in-place root motion preferred (game applies world motion) |
| `Run` (optional) | yes | Disciple / Paul only |

Clip names case-sensitive as above. Root motion: keep hips/root Y stable; XZ delta small (game moves the group).

## Export settings (Blender glTF 2.0)
- Format: **glTF Binary (.glb)**
- Include: Selected objects OR whole scene with only character + armature
- Transform: **+Y Up**
- Geometry: Apply Modifiers ✓, UVs ✓, Normals ✓, Tangents if normal maps
- Animation: Animation ✓, **Bake All** if NLA, Sampling rate 24 or 30
- Skinning: include armature, no shape keys required for v1
- Compression: Draco optional (game can load either); if unsure, export **without** Draco first

File naming:
```
young_disciple.glb
ananias.glb
paul_mature.glb
paul_final.glb
young_saul.glb
peter.glb
guard.glb
lame_man.glb
```

## Integration note for game agents later
Current code uses `createCharacter(role)` returning a `THREE.Group` with `userData.elbow`, `userData.knee`, walk phase, face card. New path should load glTF and map:
- `scene.scale.setScalar(...)` if needed
- Play `Walk` / `Idle` via AnimationMixer
- Keep same world height as existing rig (~1.6–1.8)

## Do NOT
- Embed huge HDRIs in the .blend delivered
- Use Blender-only nodes that don’t bake to PBR
- Export with cameras/lights/grid
- Use non-ASCII characters in bone or object names
