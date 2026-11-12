/**
 * gltf-character-loader.js
 * PAUL-3D-SWORD-2026 — drop-in replacement path for procedural character-mesh.js
 *
 * Usage (after models land in assets/models/characters/):
 *   <script type="importmap">…three…</script>
 *   import { loadGltfCharacter, playClip, setWalkBlend } from './js/gltf-character-loader.js';
 *
 * Falls back gracefully if a .glb is missing so old procedural createCharacter() still works.
 */
(function (global) {
  'use strict';

  var MODEL_BASE = 'assets/models/characters/';
  var ROLE_TO_FILE = {
    disciple: 'young_disciple.glb',
    young_disciple: 'young_disciple.glb',
    ananias: 'ananias.glb',
    paul: 'paul_mature.glb',
    paul_mature: 'paul_mature.glb',
    paul_final: 'paul_final.glb',
    young_saul: 'young_saul.glb',
    saul: 'young_saul.glb',
    peter: 'peter.glb',
    guard: 'guard.glb',
    lame: 'lame_man.glb',
    lame_man: 'lame_man.glb'
  };

  // Target height in meters (matches technical_specs + existing procedural rigs)
  var ROLE_HEIGHT = {
    disciple: 1.65,
    ananias: 1.72,
    paul: 1.70,
    paul_mature: 1.70,
    paul_final: 1.70,
    young_saul: 1.74,
    peter: 1.73,
    guard: 1.78,
    lame: 1.55
  };

  var _loader = null;
  var _cache = Object.create(null);

  function getLoader() {
    if (_loader) return _loader;
    if (typeof THREE === 'undefined') throw new Error('THREE not found');
    if (!THREE.GLTFLoader) {
      throw new Error('THREE.GLTFLoader missing — include examples/jsm/loaders/GLTFLoader.js or build with loader');
    }
    _loader = new THREE.GLTFLoader();
    return _loader;
  }

  function measureHeight(root) {
    var box = new THREE.Box3().setFromObject(root);
    var size = new THREE.Vector3();
    box.getSize(size);
    return size.y > 0.01 ? size.y : 1.7;
  }

  function groundAndScale(root, targetHeight) {
    root.updateMatrixWorld(true);
    var box = new THREE.Box3().setFromObject(root);
    // Feet to ground
    root.position.y -= box.min.y;
    root.updateMatrixWorld(true);
    box.setFromObject(root);
    var h = box.max.y - box.min.y;
    if (h > 0.01 && targetHeight) {
      var s = targetHeight / h;
      root.scale.multiplyScalar(s);
      root.position.y = 0;
      root.updateMatrixWorld(true);
      box.setFromObject(root);
      root.position.y -= box.min.y;
    }
  }

  function findClip(animations, names) {
    if (!animations || !animations.length) return null;
    var lower = names.map(function (n) { return n.toLowerCase(); });
    for (var i = 0; i < animations.length; i++) {
      var n = (animations[i].name || '').toLowerCase();
      for (var j = 0; j < lower.length; j++) {
        if (n === lower[j] || n.indexOf(lower[j]) !== -1) return animations[i];
      }
    }
    return animations[0] || null;
  }

  /**
   * Load a character glTF by role key.
   * @param {string} role - disciple | ananias | paul | peter | guard | …
   * @param {object} [opts]
   * @param {number} [opts.scale] - extra scale multiplier after height normalize
   * @param {boolean} [opts.castShadow=true]
   * @param {string} [opts.url] - override model URL
   * @returns {Promise<{group:THREE.Group, mixer:THREE.AnimationMixer, actions:Object, gltf:Object}>}
   */
  function loadGltfCharacter(role, opts) {
    opts = opts || {};
    var file = ROLE_TO_FILE[role] || ROLE_TO_FILE.paul;
    var url = opts.url || (MODEL_BASE + file);
    var targetH = ROLE_HEIGHT[role] || 1.7;
    if (opts.height != null) targetH = opts.height;

    var cacheKey = url + '|' + targetH;
    if (_cache[cacheKey] && !opts.nocache) {
      return Promise.resolve(cloneRig(_cache[cacheKey], opts));
    }

    return new Promise(function (resolve, reject) {
      getLoader().load(
        url,
        function (gltf) {
          var group = new THREE.Group();
          group.name = 'gltf_char_' + role;
          group.userData.role = role;
          group.userData.source = 'gltf';
          group.userData.walkPhase = 0;
          group.userData.hidden = false;

          var model = gltf.scene || gltf.scenes[0];
          group.add(model);
          groundAndScale(group, targetH);
          if (opts.scale != null) group.scale.multiplyScalar(opts.scale);

          var cast = opts.castShadow !== false;
          group.traverse(function (o) {
            if (o.isMesh) {
              o.castShadow = cast;
              o.receiveShadow = true;
              if (o.material) {
                // Ensure sRGB-ish color space for older three builds
                if (o.material.map) o.material.map.colorSpace = o.material.map.colorSpace || THREE.SRGBColorSpace;
                o.material.needsUpdate = true;
              }
            }
          });

          var mixer = new THREE.AnimationMixer(model);
          var actions = {};
          var idleClip = findClip(gltf.animations, ['idle', 'Idle', 'standing', 'stand']);
          var walkClip = findClip(gltf.animations, ['walk', 'Walk', 'walking', 'locomotion']);
          var runClip = findClip(gltf.animations, ['run', 'Run', 'sprint']);

          if (idleClip) {
            actions.idle = mixer.clipAction(idleClip);
            actions.idle.setLoop(THREE.LoopRepeat, Infinity);
            actions.idle.play();
            actions.idle.setEffectiveWeight(1);
          }
          if (walkClip) {
            actions.walk = mixer.clipAction(walkClip);
            actions.walk.setLoop(THREE.LoopRepeat, Infinity);
            actions.walk.play();
            actions.walk.setEffectiveWeight(0);
          }
          if (runClip) {
            actions.run = mixer.clipAction(runClip);
            actions.run.setLoop(THREE.LoopRepeat, Infinity);
            actions.run.play();
            actions.run.setEffectiveWeight(0);
          }

          group.userData.mixer = mixer;
          group.userData.actions = actions;
          group.userData.gltf = true;

          // Compatibility shims for code that poked procedural elbows/knees
          group.userData.elbow = null;
          group.userData.knee = null;
          group.userData.rig = model;

          var packed = { group: group, mixer: mixer, actions: actions, gltf: gltf, role: role };
          _cache[cacheKey] = packed;
          resolve(packed);
        },
        undefined,
        function (err) {
          reject(err);
        }
      );
    });
  }

  function cloneRig(packed, opts) {
    // Simple re-load path: return same structure; for multi-instance use SkeletonUtils.clone later
    return loadGltfCharacter(packed.role, Object.assign({}, opts, { nocache: true, url: MODEL_BASE + (ROLE_TO_FILE[packed.role] || '') }));
  }

  /**
   * Blend idle↔walk (0 = idle, 1 = full walk). Call every frame after setting speed.
   */
  function setWalkBlend(rig, walkAmount, dt) {
    if (!rig || !rig.actions) return;
    var w = Math.max(0, Math.min(1, walkAmount));
    var a = rig.actions;
    if (a.idle) a.idle.setEffectiveWeight(1 - w);
    if (a.walk) a.walk.setEffectiveWeight(w);
    if (a.run) a.run.setEffectiveWeight(0);
    if (rig.mixer && dt != null) rig.mixer.update(dt);
  }

  function playClip(rig, name, opts) {
    opts = opts || {};
    if (!rig || !rig.actions) return;
    var action = rig.actions[name];
    if (!action) return;
    Object.keys(rig.actions).forEach(function (k) {
      if (k !== name && rig.actions[k]) {
        if (opts.fade != null) rig.actions[k].fadeOut(opts.fade);
        else rig.actions[k].setEffectiveWeight(0);
      }
    });
    if (opts.fade != null) action.reset().fadeIn(opts.fade).play();
    else {
      action.setEffectiveWeight(1);
      action.play();
    }
  }

  function updateCharacter(rig, dt) {
    if (rig && rig.mixer) rig.mixer.update(dt);
  }

  /**
   * Hybrid factory: try glTF, else call legacy procedural createCharacter(role, opts).
   */
  function createCharacterHybrid(role, opts, legacyCreate) {
    opts = opts || {};
    return loadGltfCharacter(role, opts).then(
      function (rig) {
        return rig.group;
      },
      function () {
        if (typeof legacyCreate === 'function') {
          return legacyCreate(role, opts);
        }
        if (global.CharacterMesh && typeof global.CharacterMesh.createCharacter === 'function') {
          return global.CharacterMesh.createCharacter(role, opts);
        }
        throw new Error('No glTF for role "' + role + '" and no legacy createCharacter');
      }
    );
  }

  var api = {
    MODEL_BASE: MODEL_BASE,
    ROLE_TO_FILE: ROLE_TO_FILE,
    loadGltfCharacter: loadGltfCharacter,
    setWalkBlend: setWalkBlend,
    playClip: playClip,
    updateCharacter: updateCharacter,
    createCharacterHybrid: createCharacterHybrid,
    clearCache: function () { _cache = Object.create(null); }
  };

  // UMD-ish
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.GltfCharacters = api;
})(typeof window !== 'undefined' ? window : globalThis);
