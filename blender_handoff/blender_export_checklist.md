# Blender Export Checklist (before handoff)

Use this for every character `.glb`.

## Mesh
- [ ] Origin at ground between feet (character stands on Y=0 / Z=0 correctly after +Y-up export)
- [ ] Height within ±5 cm of brief target
- [ ] No loose vertices / non-manifold on deforming parts
- [ ] Triangle count within technical_specs budget
- [ ] Scale applied (Ctrl+A → Scale) before export
- [ ] No camera, light, empty junk in export selection

## Armature
- [ ] Single armature named `Armature`
- [ ] Bone names ASCII, hierarchy matches technical_specs minimum set
- [ ] Rest pose: T-pose or A-pose (A-pose preferred for tunics)
- [ ] All mesh vertices weighted (no pink weightless areas)
- [ ] Walk cycle tested in Blender: feet don’t slide badly on in-place walk

## Materials / textures
- [ ] Principled BSDF only (or baked to BaseColor/Roughness/Metallic/Normal)
- [ ] Texture paths packed or relative; textures ≤ 2048
- [ ] Colors match brief hex ± small artistic liberty
- [ ] Face readable at third-person distance

## Animation
- [ ] Clips named exactly: `Idle`, `Walk` (and `Run` if present)
- [ ] Loops cleanly (first/last frame match for walk)
- [ ] Root / hips not drifting in Y

## Export
- [ ] glTF 2.0 Binary `.glb`
- [ ] +Y Up enabled
- [ ] Animations included
- [ ] File named per roster (`young_disciple.glb` etc.)
- [ ] Opens in https://gltf-viewer.donmccurdy.com/ without errors
- [ ] Roughness/metal look correct in viewer (not pure black/white unless intended)

## Delivery folder layout (suggested)
```
characters/
  young_disciple/
    young_disciple.blend
    young_disciple.glb
    notes.md          # optional
  ananias/
    ...
```

## Integration smoke test (game side, later)
Load with Three.js GLTFLoader → place at origin → play `Walk` → confirm height matches old procedural mesh (~1.6–1.8).
