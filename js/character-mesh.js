// ============================================================
// Shared low-poly 3D humanoid builder
// Box/cylinder/sphere body — not billboard planes.
// Used by adventure-3d.js and level1-3d.js
// ============================================================

(function () {
  const ROLES = {
    disciple: {
      skin: 0xc4a07a,
      hair: 0x2a1810,
      tunic: 0x6b4328,
      sash: 0xc9a227,
      trim: 0x8a5a28,
      accent: 0x3a2a18,
      face: 'assets/characters/young_disciple.jpg'
    },
    ananias: {
      skin: 0xb8946a,
      hair: 0x7a7468,
      tunic: 0x4a4034,
      sash: 0x8a7a50,
      trim: 0x5a5040,
      accent: 0x3a3830,
      face: 'assets/characters/ananias.jpg'
    },
    paul: {
      skin: 0xb88860,
      hair: 0x3a3028,
      tunic: 0x3d4a38,
      sash: 0xc9a227,
      trim: 0x5a4030,
      accent: 0x2a2820,
      face: 'assets/characters/paul_mature.jpg'
    },
    peter: {
      skin: 0xc09870,
      hair: 0x8a8070,
      tunic: 0x3a4a58,
      sash: 0x6a8090,
      trim: 0x4a5a48,
      accent: 0x2a3038,
      face: 'assets/characters/peter.jpg'
    },
    guard: {
      skin: 0xb88860,
      hair: 0x2a1a10,
      tunic: 0x6a1814,
      sash: 0x8b2020,
      trim: 0x8a7a58,
      accent: 0x4a4030,
      armor: 0x8a7a58,
      helmet: 0x6a6050,
      metal: 0x9a9080,
      face: 'assets/characters/guard.jpg'
    },
    lame: {
      skin: 0xb89068,
      hair: 0x3a2a18,
      tunic: 0x6a5840,
      sash: 0x8a7050,
      trim: 0x5a4830,
      accent: 0x4a3a28
    }
  };

  function stdMat(color, extras) {
    extras = extras || {};
    return new THREE.MeshStandardMaterial(Object.assign({
      color: color,
      roughness: 0.82,
      metalness: 0.06,
      emissive: color,
      emissiveIntensity: 0.07
    }, extras));
  }

  function part(geo, material) {
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function limb(length, radiusTop, radiusBot, material) {
    const pivot = new THREE.Group();
    const mesh = part(
      new THREE.CylinderGeometry(radiusTop, radiusBot, length, 8),
      material
    );
    mesh.position.y = -length / 2;
    pivot.add(mesh);
    return pivot;
  }

  function attachFaceCard(head, url) {
    if (!url) return;
    const loader = new THREE.TextureLoader();
    const tex = loader.load(url);
    tex.encoding = THREE.sRGBEncoding;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.65,
      metalness: 0,
      transparent: true,
      emissive: 0x221c10,
      emissiveIntensity: 0.18
    });
    mat.userData.isFace = true;
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 0.34), mat);
    card.position.set(0, 0.02, 0.22);
    card.castShadow = false;
    card.receiveShadow = true;
    head.add(card);
  }

  /**
   * Build a low-poly humanoid Group.
   * Origin sits at mid-body so world Y ≈ 1.2 keeps feet on the ground
   * (same convention as the old 2.4-tall billboard planes).
   */
  function createCharacter(role, opts) {
    opts = opts || {};
    const palette = ROLES[role] || ROLES.paul;
    const scale = opts.scale != null ? opts.scale : (role === 'guard' ? 0.92 : 1);
    const pose = opts.pose || 'stand';
    const showFace = opts.face !== false;

    const skin = stdMat(palette.skin);
    const hair = stdMat(palette.hair, { roughness: 0.95 });
    const cloth = stdMat(palette.tunic, { roughness: 0.88 });
    const sashMat = stdMat(palette.sash, { roughness: 0.7, metalness: role === 'guard' ? 0.2 : 0.12 });
    const accent = stdMat(palette.accent, { roughness: 0.9 });

    const group = new THREE.Group();
    group.userData.role = role;
    group.userData.walkPhase = 0;
    group.userData.centerY = 1.2 * scale;
    group.userData.hidden = false;

    // Torso
    const torso = part(new THREE.BoxGeometry(0.54, 0.82, 0.32), cloth);
    torso.position.y = 0.08;
    group.add(torso);

    // Belt / sash
    const belt = part(new THREE.BoxGeometry(0.58, 0.10, 0.34), sashMat);
    belt.position.y = -0.22;
    group.add(belt);

    // Optional traveler cloak (Paul) / armor plate (guard)
    if (role === 'paul') {
      const cloak = part(new THREE.BoxGeometry(0.62, 0.95, 0.16), accent);
      cloak.position.set(0, 0.02, -0.20);
      group.add(cloak);
    }
    if (role === 'guard' && palette.armor) {
      const breast = part(
        new THREE.BoxGeometry(0.50, 0.48, 0.12),
        stdMat(palette.armor, { metalness: 0.45, roughness: 0.38 })
      );
      breast.position.set(0, 0.18, 0.18);
      group.add(breast);
    }

    // Head + hair
    const headPivot = new THREE.Group();
    headPivot.position.y = 0.74;
    const head = part(new THREE.SphereGeometry(0.26, 12, 10), skin);
    headPivot.add(head);
    const hairCap = part(new THREE.SphereGeometry(0.27, 12, 8), hair);
    hairCap.scale.set(1.02, 0.62, 1.05);
    hairCap.position.y = 0.12;
    headPivot.add(hairCap);

    if (role === 'guard' && palette.helmet) {
      const helm = part(
        new THREE.CylinderGeometry(0.24, 0.28, 0.22, 10),
        stdMat(palette.helmet, { metalness: 0.55, roughness: 0.35 })
      );
      helm.position.y = 0.16;
      headPivot.add(helm);
      const crest = part(
        new THREE.BoxGeometry(0.04, 0.22, 0.28),
        stdMat(palette.sash, { roughness: 0.7 })
      );
      crest.position.y = 0.30;
      headPivot.add(crest);
    }

    if (showFace) attachFaceCard(headPivot, palette.face);
    group.add(headPivot);

    // Arms
    const armLen = 0.70;
    const leftArm = limb(armLen, 0.075, 0.065, skin);
    leftArm.position.set(-0.36, 0.40, 0);
    const rightArm = limb(armLen, 0.075, 0.065, skin);
    rightArm.position.set(0.36, 0.40, 0);
    const leftHand = part(new THREE.SphereGeometry(0.07, 8, 6), skin);
    leftHand.position.y = -armLen;
    leftArm.add(leftHand);
    const rightHand = part(new THREE.SphereGeometry(0.07, 8, 6), skin);
    rightHand.position.y = -armLen;
    rightArm.add(rightHand);
    group.add(leftArm);
    group.add(rightArm);

    if (role === 'guard') {
      const shaft = part(
        new THREE.CylinderGeometry(0.025, 0.025, 2.15, 6),
        stdMat(0x5a4030, { roughness: 0.85 })
      );
      shaft.position.set(0.08, -0.55, 0.12);
      shaft.rotation.x = 0.12;
      rightArm.add(shaft);
      const tip = part(
        new THREE.ConeGeometry(0.055, 0.18, 7),
        stdMat(palette.metal || 0x9a9080, { metalness: 0.7, roughness: 0.3 })
      );
      tip.position.set(0.08, 0.55, 0.05);
      tip.rotation.x = 0.12;
      rightArm.add(tip);
    }

    // Legs
    const legLen = 0.84;
    const leftLeg = limb(legLen, 0.10, 0.085, cloth);
    leftLeg.position.set(-0.15, -0.36, 0);
    const rightLeg = limb(legLen, 0.10, 0.085, cloth);
    rightLeg.position.set(0.15, -0.36, 0);
    const leftFoot = part(new THREE.BoxGeometry(0.16, 0.08, 0.26), accent);
    leftFoot.position.set(0, -legLen, 0.04);
    leftLeg.add(leftFoot);
    const rightFoot = part(new THREE.BoxGeometry(0.16, 0.08, 0.26), accent);
    rightFoot.position.set(0, -legLen, 0.04);
    rightLeg.add(rightFoot);
    group.add(leftLeg);
    group.add(rightLeg);

    if (pose === 'sit') {
      leftLeg.rotation.x = -1.15;
      rightLeg.rotation.x = -1.15;
      leftArm.rotation.x = -0.45;
      rightArm.rotation.x = -0.45;
      group.userData.centerY = 0.72 * scale;
    }

    group.userData.leftArm = leftArm;
    group.userData.rightArm = rightArm;
    group.userData.leftLeg = leftLeg;
    group.userData.rightLeg = rightLeg;
    group.userData.pose = pose;
    group.scale.setScalar(scale);
    return group;
  }

  function eachMaterial(root, fn) {
    root.traverse(function (obj) {
      if (!obj.material) return;
      const list = Array.isArray(obj.material) ? obj.material : [obj.material];
      list.forEach(fn);
    });
  }

  function setOpacity(root, opacity) {
    if (!root) return;
    const hidden = opacity < 0.999;
    root.userData.hidden = hidden;
    eachMaterial(root, function (m) {
      m.transparent = hidden || m.userData.isFace;
      m.opacity = opacity;
      if (!hidden && !m.userData.isFace) m.transparent = false;
    });
  }

  function updateWalk(root, dt, moving, speed) {
    if (!root || !root.userData || root.userData.pose === 'sit') return;
    const leftLeg = root.userData.leftLeg;
    const rightLeg = root.userData.rightLeg;
    const leftArm = root.userData.leftArm;
    const rightArm = root.userData.rightArm;
    if (!leftLeg || !rightLeg) return;

    if (moving) {
      const rate = 7.2 + Math.min(6, (speed || 8) * 0.25);
      root.userData.walkPhase = (root.userData.walkPhase || 0) + dt * rate;
      const swing = Math.sin(root.userData.walkPhase) * 0.58;
      leftLeg.rotation.x = swing;
      rightLeg.rotation.x = -swing;
      leftArm.rotation.x = -swing * 0.72;
      rightArm.rotation.x = swing * 0.72;
    } else {
      leftLeg.rotation.x *= 0.72;
      rightLeg.rotation.x *= 0.72;
      leftArm.rotation.x *= 0.72;
      rightArm.rotation.x *= 0.72;
      if (Math.abs(leftLeg.rotation.x) < 0.01) {
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;
        leftArm.rotation.x = 0;
        rightArm.rotation.x = 0;
      }
    }
  }

  function faceDirection(root, dx, dz) {
    if (!root) return;
    if (dx * dx + dz * dz < 1e-8) return;
    root.rotation.y = Math.atan2(dx, dz);
  }

  window.PaulCharacters = {
    create: createCharacter,
    setOpacity: setOpacity,
    updateWalk: updateWalk,
    faceDirection: faceDirection,
    roles: ROLES
  };
})();
