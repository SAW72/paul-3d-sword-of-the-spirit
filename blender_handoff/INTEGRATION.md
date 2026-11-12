# Integrating glTF characters into PAUL-3D-SWORD-2026

## Folder layout (after Blender bots deliver)
```
assets/models/characters/
  young_disciple.glb
  ananias.glb
  paul_mature.glb
  paul_final.glb
  young_saul.glb
  peter.glb
  guard.glb
  lame_man.glb
```

## Script
Use `js/gltf-character-loader.js` (in this handoff; copy to repo `js/`).

## Minimal wire-up in level code
```js
// Prefer glTF; fall back to procedural character-mesh.js
GltfCharacters.createCharacterHybrid('disciple', { castShadow: true }, function (role, opts) {
  return createCharacter(role, opts); // existing procedural
}).then(function (group) {
  scene.add(group);
  player = group;
  playerRig = group.userData; // mixer, actions
});

// in animate():
var speed = …; // 0..1 from WASD
if (player.userData.mixer) {
  GltfCharacters.setWalkBlend(player.userData, speed > 0.05 ? 1 : 0, delta);
} else {
  // old procedural walkPhase update
}
```

## Three.js loader
Include `GLTFLoader` (import map or script tag). Example import map:
```html
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
  }
}
</script>
```
If the game still uses classic script tags, add:
`https://unpkg.com/three@0.160.0/examples/js/loaders/GLTFLoader.js` (match your THREE version).

## Why hybrid
Levels keep working with procedural meshes until each `.glb` is present. Missing file → automatic legacy path.

## Concept sheets
See `concept_sheets/` (generated turnarounds) — Blender agents should match these + `references/` portraits.
