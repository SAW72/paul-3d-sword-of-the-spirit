// ============================================================
// Shared low-poly 3D humanoid builder
// Volumetric body with shoulder, elbow, hip, and knee joints.
// Art target for the Level 1 player: role "disciple"
//   palette + face card from assets/characters/young_disciple.jpg
//   (beige tunic, dark shoulder cloak, brown belt, curly hair).
// There is no separate evade-NPC mesh in this repo; the player
// is that disciple. Guards use the same rig with armor.
// Used by adventure-3d.js and level1-3d.js
// ============================================================

(function () {
  const ROLES = {
    disciple: {
      skin: 0xc4a882,
      hair: 0x241810,
      tunic: 0xd2c0a0,
      sash: 0x4a3420,
      trim: 0x6a5038,
      accent: 0x2a221c,
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
      emissiveIntensity: 0.12
    }, extras));
  }

  function part(geo, material) {
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function attachFaceCard(head, url) {
    if (!url) return;
    const loader = new THREE.TextureLoader();
    const tex = loader.load(url);
    tex.encoding = THREE.sRGBEncoding;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true
    });
    mat.userData.isFace = true;
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.40), mat);
    card.position.set(0, 0.02, 0.22);
    card.castShadow = false;
    card.receiveShadow = true;
    head.add(card);
  }

  function makeHand(material) {
    const anchor = new THREE.Group();
    const palm = part(new THREE.BoxGeometry(0.13, 0.07, 0.11), material);
    palm.position.set(0, -0.05, 0.03);
    anchor.add(palm);
    for (let i = -1; i <= 1; i++) {
      const finger = part(new THREE.BoxGeometry(0.03, 0.075, 0.032), material);
      finger.position.set(i * 0.036, -0.11, 0.045);
      anchor.add(finger);
    }
    const thumb = part(new THREE.BoxGeometry(0.032, 0.055, 0.032), material);
    thumb.position.set(0.075, -0.05, 0.04);
    thumb.rotation.z = 0.7;
    anchor.add(thumb);
    return anchor;
  }

  function armChain(upperLen, foreLen, skin, cloth) {
    const shoulder = new THREE.Group();
    const upper = part(new THREE.CylinderGeometry(0.095, 0.082, upperLen, 7), skin);
    upper.position.y = -upperLen / 2;
    shoulder.add(upper);
    const sleeve = part(new THREE.CylinderGeometry(0.115, 0.10, 0.16, 7), cloth);
    sleeve.position.y = -0.06;
    shoulder.add(sleeve);
    const elbow = new THREE.Group();
    elbow.position.y = -upperLen;
    const fore = part(new THREE.CylinderGeometry(0.078, 0.064, foreLen, 7), skin);
    fore.position.y = -foreLen / 2;
    elbow.add(fore);
    const hand = makeHand(skin);
    hand.position.y = -foreLen;
    elbow.add(hand);
    shoulder.add(elbow);
    shoulder.userData.elbow = elbow;
    shoulder.userData.hand = hand;
    return shoulder;
  }

  function legChain(thighLen, shinLen, thighMat, shinMat, footMat) {
    const hip = new THREE.Group();
    const thigh = part(new THREE.CylinderGeometry(0.125, 0.10, thighLen, 7), thighMat);
    thigh.position.y = -thighLen / 2;
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -thighLen;
    const shin = part(new THREE.CylinderGeometry(0.09, 0.07, shinLen, 7), shinMat);
    shin.position.y = -shinLen / 2;
    knee.add(shin);
    const foot = part(new THREE.BoxGeometry(0.16, 0.08, 0.30), footMat);
    foot.position.set(0, -shinLen, 0.06);
    knee.add(foot);
    hip.add(knee);
    hip.userData.knee = knee;
    hip.userData.foot = foot;
    return hip;
  }

  function groundOffset(group) {
    group.updateMatrixWorld(true);
    const corner = new THREE.Vector3();
    let minY = Infinity;
    group.traverse(function (obj) {
      if (!obj.isMesh || !obj.geometry) return;
      const geo = obj.geometry;
      if (!geo.boundingBox) geo.computeBoundingBox();
      const bb = geo.boundingBox;
      const xs = [bb.min.x, bb.max.x];
      const ys = [bb.min.y, bb.max.y];
      const zs = [bb.min.z, bb.max.z];
      for (let xi = 0; xi < 2; xi++) {
        for (let yi = 0; yi < 2; yi++) {
          for (let zi = 0; zi < 2; zi++) {
            corner.set(xs[xi], ys[yi], zs[zi]);
            corner.applyMatrix4(obj.matrixWorld);
            if (corner.y < minY) minY = corner.y;
          }
        }
      }
    });
    return isFinite(minY) ? -minY : 1.2;
  }

  function damp(obj, axis, target) {
    if (!obj) return;
    obj.rotation[axis] += (target - obj.rotation[axis]) * 0.28;
  }

  /**
   * Build a low-poly humanoid Group.
   * After scale, userData.centerY lifts the origin so the lowest vertex
   * rests on world Y = 0. Poseable elbows and knees live on userData.
   */
  function createCharacter(role, opts) {
    opts = opts || {};
    const palette = ROLES[role] || ROLES.paul;
    const scale = opts.scale != null ? opts.scale : (role === 'guard' ? 0.98 : 1);
    const pose = opts.pose || 'stand';
    const showFace = opts.face !== false;

    const skin = stdMat(palette.skin);
    const hair = stdMat(palette.hair, { roughness: 0.95 });
    const cloth = stdMat(palette.tunic, { roughness: 0.88 });
    const sashMat = stdMat(palette.sash, { roughness: 0.7, metalness: role === 'guard' ? 0.2 : 0.08 });
    const accent = stdMat(palette.accent, { roughness: 0.9 });
    const trim = stdMat(palette.trim, { roughness: 0.84 });

    const group = new THREE.Group();
    const rig = new THREE.Group();
    group.add(rig);
    group.userData.role = role;
    group.userData.walkPhase = 0;
    group.userData.hidden = false;
    group.userData.carry = 'none';
    group.userData.pose = pose;
    group.userData.rig = rig;

    const torso = part(new THREE.BoxGeometry(0.64, 0.86, 0.40), cloth);
    torso.position.y = 0.16;
    rig.add(torso);

    const chest = part(new THREE.BoxGeometry(0.56, 0.28, 0.16), trim);
    chest.position.set(0, 0.32, 0.18);
    rig.add(chest);

    const hips = part(new THREE.BoxGeometry(0.52, 0.24, 0.36), cloth);
    hips.position.y = -0.32;
    rig.add(hips);

    const hem = part(new THREE.BoxGeometry(0.70, 0.22, 0.46), cloth);
    hem.position.y = -0.40;
    rig.add(hem);

    const belt = part(new THREE.BoxGeometry(0.68, 0.10, 0.42), sashMat);
    belt.position.y = -0.26;
    rig.add(belt);

    if (role === 'paul' || role === 'disciple') {
      const cloak = part(new THREE.BoxGeometry(role === 'disciple' ? 0.78 : 0.66, role === 'disciple' ? 0.84 : 0.98, 0.16), accent);
      cloak.position.set(0, role === 'disciple' ? 0.14 : 0.04, -0.24);
      rig.add(cloak);
      if (role === 'disciple') {
        const collar = part(new THREE.BoxGeometry(0.50, 0.14, 0.30), accent);
        collar.position.set(0, 0.52, -0.06);
        rig.add(collar);
        const pouch = part(new THREE.BoxGeometry(0.14, 0.16, 0.08), accent);
        pouch.position.set(0.24, -0.34, 0.20);
        rig.add(pouch);
      }
    }
    if (role === 'guard' && palette.armor) {
      const breast = part(
        new THREE.BoxGeometry(0.56, 0.50, 0.12),
        stdMat(palette.armor, { metalness: 0.45, roughness: 0.38 })
      );
      breast.position.set(0, 0.22, 0.22);
      rig.add(breast);
    }

    const neck = part(new THREE.CylinderGeometry(0.08, 0.10, 0.12, 6), skin);
    neck.position.y = 0.64;
    rig.add(neck);

    const headPivot = new THREE.Group();
    headPivot.position.y = 0.78;
    const head = part(new THREE.SphereGeometry(0.28, 12, 10), skin);
    headPivot.add(head);
    const hairCap = part(new THREE.SphereGeometry(0.292, 12, 8), hair);
    hairCap.scale.set(1.04, 0.62, 1.06);
    hairCap.position.y = 0.12;
    headPivot.add(hairCap);

    if (role === 'disciple') {
      [[-0.18, 0.08, 0.10], [0.18, 0.08, 0.10], [0.0, 0.20, -0.02], [-0.10, 0.16, -0.12], [0.12, 0.14, -0.10]].forEach(function (p) {
        const curl = part(new THREE.SphereGeometry(0.09, 7, 6), hair);
        curl.position.set(p[0], p[1], p[2]);
        headPivot.add(curl);
      });
      const beard = part(new THREE.SphereGeometry(0.10, 8, 6), hair);
      beard.scale.set(1.15, 0.72, 0.55);
      beard.position.set(0, -0.18, 0.14);
      headPivot.add(beard);
    }

    if (role === 'guard' && palette.helmet) {
      const helm = part(
        new THREE.CylinderGeometry(0.26, 0.30, 0.22, 10),
        stdMat(palette.helmet, { metalness: 0.55, roughness: 0.35 })
      );
      helm.position.y = 0.16;
      headPivot.add(helm);
      const crest = part(
        new THREE.BoxGeometry(0.05, 0.24, 0.30),
        stdMat(palette.sash, { roughness: 0.7 })
      );
      crest.position.y = 0.32;
      headPivot.add(crest);
    }

    if (showFace) attachFaceCard(headPivot, palette.face);
    rig.add(headPivot);

    const capL = part(new THREE.SphereGeometry(0.12, 8, 6), cloth);
    capL.position.set(-0.38, 0.48, 0);
    rig.add(capL);
    const capR = part(new THREE.SphereGeometry(0.12, 8, 6), cloth);
    capR.position.set(0.38, 0.48, 0);
    rig.add(capR);

    const upperLen = 0.40;
    const foreLen = 0.36;
    const leftArm = armChain(upperLen, foreLen, skin, cloth);
    leftArm.position.set(-0.42, 0.46, 0);
    const rightArm = armChain(upperLen, foreLen, skin, cloth);
    rightArm.position.set(0.42, 0.46, 0);
    rig.add(leftArm);
    rig.add(rightArm);

    if (role === 'guard') {
      const hand = rightArm.userData.hand;
      const shaft = part(
        new THREE.CylinderGeometry(0.028, 0.028, 2.05, 6),
        stdMat(0x5a4030, { roughness: 0.85 })
      );
      shaft.position.set(0.05, 1.02, 0.08);
      hand.add(shaft);
      const tip = part(
        new THREE.ConeGeometry(0.06, 0.18, 7),
        stdMat(palette.metal || 0x9a9080, { metalness: 0.7, roughness: 0.3 })
      );
      tip.position.set(0.05, 2.08, 0.08);
      hand.add(tip);
    }

    const thighLen = 0.46;
    const shinLen = 0.42;
    const leftLeg = legChain(thighLen, shinLen, cloth, skin, accent);
    leftLeg.position.set(-0.16, -0.42, 0);
    const rightLeg = legChain(thighLen, shinLen, cloth, skin, accent);
    rightLeg.position.set(0.16, -0.42, 0);
    rig.add(leftLeg);
    rig.add(rightLeg);

    if (pose === 'sit') {
      leftLeg.rotation.x = -1.25;
      rightLeg.rotation.x = -1.25;
      leftLeg.userData.knee.rotation.x = 1.35;
      rightLeg.userData.knee.rotation.x = 1.35;
      leftArm.rotation.x = -0.45;
      rightArm.rotation.x = -0.45;
      leftArm.userData.elbow.rotation.x = 0.55;
      rightArm.userData.elbow.rotation.x = 0.55;
    } else {
      leftArm.userData.elbow.rotation.x = 0.18;
      rightArm.userData.elbow.rotation.x = 0.18;
    }

    group.userData.leftArm = leftArm;
    group.userData.rightArm = rightArm;
    group.userData.leftElbow = leftArm.userData.elbow;
    group.userData.rightElbow = rightArm.userData.elbow;
    group.userData.leftHand = leftArm.userData.hand;
    group.userData.rightHand = rightArm.userData.hand;
    group.userData.leftLeg = leftLeg;
    group.userData.rightLeg = rightLeg;
    group.userData.leftKnee = leftLeg.userData.knee;
    group.userData.rightKnee = rightLeg.userData.knee;
    group.userData.head = headPivot;

    group.scale.setScalar(scale);
    group.userData.centerY = groundOffset(group);
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
      if (m.userData && m.userData.isMarker) return;
      if (m.userData && m.userData.isFace) {
        m.transparent = true;
        m.opacity = opacity;
        return;
      }
      m.opacity = opacity;
      m.transparent = hidden;
      if (!hidden) m.transparent = false;
    });
  }

  function applyReachBend(rig) {
    if (!rig) return;
    const lean = 0.36;
    const pivotY = -0.70;
    rig.rotation.x = lean;
    rig.rotation.z = 0;
    rig.position.y = pivotY * (1 - Math.cos(lean));
    rig.position.z = -pivotY * Math.sin(lean);
  }

  function applyCarryArms(root) {
    const mode = root.userData.carry;
    const L = root.userData.leftArm;
    const R = root.userData.rightArm;
    const LE = root.userData.leftElbow;
    const RE = root.userData.rightElbow;
    const rig = root.userData.rig;
    if (!L || !R || !LE || !RE) return false;
    if (mode === 'reach') {
      // Bow and extend so the right hand meets a jar around knee-to-waist height.
      R.rotation.set(-0.72, 0.02, -0.22);
      RE.rotation.set(0.28, 0, 0);
      L.rotation.set(-0.28, 0, 0.18);
      LE.rotation.set(0.42, 0, 0);
      applyReachBend(rig);
      return true;
    }
    if (mode === 'hold') {
      // Both hands meet in front of the chest around the jar.
      R.rotation.set(-1.05, 0, -0.55);
      RE.rotation.set(0.08, 0, 0);
      L.rotation.set(-1.05, 0, 0.55);
      LE.rotation.set(0.08, 0, 0);
      if (rig && Math.abs(rig.position.z) > 0.02) {
        rig.position.z = 0;
        rig.rotation.x = 0.05;
        rig.position.y = 0;
      }
      return true;
    }
    return false;
  }

  function updateWalk(root, dt, moving, speed) {
    if (!root || !root.userData || root.userData.pose === 'sit') return;
    const ud = root.userData;
    const leftLeg = ud.leftLeg;
    const rightLeg = ud.rightLeg;
    const leftArm = ud.leftArm;
    const rightArm = ud.rightArm;
    const leftKnee = ud.leftKnee;
    const rightKnee = ud.rightKnee;
    const leftElbow = ud.leftElbow;
    const rightElbow = ud.rightElbow;
    const rig = ud.rig;
    if (!leftLeg || !rightLeg) return;

    const carrying = ud.carry === 'reach' || ud.carry === 'hold';

    if (moving) {
      const rate = 6.4 + Math.min(5, (speed || 8) * 0.22);
      ud.walkPhase = (ud.walkPhase || 0) + dt * rate;
      const swing = Math.sin(ud.walkPhase) * 0.62;
      leftLeg.rotation.x = swing;
      rightLeg.rotation.x = -swing;
      leftLeg.rotation.z = 0;
      rightLeg.rotation.z = 0;
      if (leftKnee) leftKnee.rotation.x = Math.max(0, swing) * 1.25;
      if (rightKnee) rightKnee.rotation.x = Math.max(0, -swing) * 1.25;
      if (!carrying && leftArm && rightArm) {
        leftArm.rotation.set(-swing * 0.72, 0, 0);
        rightArm.rotation.set(swing * 0.72, 0, 0);
        if (leftElbow) leftElbow.rotation.set(0.22 + Math.max(0, swing) * 0.9, 0, 0);
        if (rightElbow) rightElbow.rotation.set(0.22 + Math.max(0, -swing) * 0.9, 0, 0);
      }
      if (rig && ud.carry !== 'reach') {
        rig.position.y = Math.abs(Math.sin(ud.walkPhase * 2)) * 0.05;
        rig.position.z += (0 - rig.position.z) * 0.35;
        rig.rotation.z = Math.sin(ud.walkPhase) * 0.055;
        rig.rotation.x = 0.08;
      }
    } else {
      damp(leftLeg, 'x', 0);
      damp(rightLeg, 'x', 0);
      damp(leftLeg, 'z', 0);
      damp(rightLeg, 'z', 0);
      if (leftKnee) damp(leftKnee, 'x', 0);
      if (rightKnee) damp(rightKnee, 'x', 0);
      if (!carrying) {
        damp(leftArm, 'x', 0);
        damp(rightArm, 'x', 0);
        damp(leftArm, 'y', 0);
        damp(rightArm, 'y', 0);
        damp(leftArm, 'z', 0);
        damp(rightArm, 'z', 0);
        damp(leftElbow, 'x', 0.18);
        damp(rightElbow, 'x', 0.18);
        damp(leftElbow, 'y', 0);
        damp(rightElbow, 'z', 0);
        damp(rightElbow, 'y', 0);
        damp(leftElbow, 'z', 0);
      }
      if (rig && ud.carry !== 'reach') {
        rig.position.y += (0 - rig.position.y) * 0.2;
        rig.position.z += (0 - rig.position.z) * 0.2;
        rig.rotation.z += (0 - rig.rotation.z) * 0.2;
        rig.rotation.x += (0 - rig.rotation.x) * 0.2;
      }
    }
    if (carrying) applyCarryArms(root);
  }

  function faceDirection(root, dx, dz) {
    if (!root) return;
    if (dx * dx + dz * dz < 1e-8) return;
    root.rotation.y = Math.atan2(dx, dz);
  }

  function setCarry(root, mode) {
    if (!root || !root.userData) return;
    root.userData.carry = mode || 'none';
    if (mode === 'reach' || mode === 'hold') applyCarryArms(root);
  }

  function createWaterJar() {
    const g = new THREE.Group();
    g.name = 'water-jar';
    const clay = stdMat(0xc45a32, { roughness: 0.62, metalness: 0.04, emissiveIntensity: 0.16 });
    const bandMat = stdMat(0x6a3418, { roughness: 0.55, emissiveIntensity: 0.08 });
    const body = part(new THREE.SphereGeometry(0.28, 10, 8), clay);
    body.scale.set(1, 1.15, 1);
    body.position.y = 0.34;
    g.add(body);
    const neck = part(new THREE.CylinderGeometry(0.10, 0.15, 0.18, 8), clay);
    neck.position.y = 0.66;
    g.add(neck);
    const lip = part(new THREE.CylinderGeometry(0.13, 0.11, 0.06, 8), bandMat);
    lip.position.y = 0.76;
    g.add(lip);
    const handle = part(new THREE.TorusGeometry(0.10, 0.025, 6, 10), bandMat);
    handle.position.set(0.20, 0.58, 0);
    handle.rotation.z = Math.PI / 2;
    g.add(handle);
    const stripe = part(new THREE.CylinderGeometry(0.27, 0.27, 0.06, 10), bandMat);
    stripe.position.y = 0.30;
    g.add(stripe);
    const markMat = new THREE.MeshBasicMaterial({
      color: 0x1a100c,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });
    markMat.userData.isMarker = true;
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.36, 14), markMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    shadow.receiveShadow = true;
    g.add(shadow);
    g.userData.marker = shadow;
    g.userData.bodyMat = clay;
    // Tuned so the jar body sits between the two hold-pose hands.
    g.userData.grip = { x: 0.05, y: -0.15, z: -0.21, rx: 0.1, ry: 0, rz: 0 };
    g.traverse(function (obj) {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    shadow.castShadow = false;
    return g;
  }

  function createCarryState(prop) {
    return { prop: prop, phase: 'idle', timer: 0 };
  }

  function attachProp(playerMesh, prop) {
    const hand = playerMesh.userData.rightHand;
    if (!hand || !prop) return;
    hand.attach(prop);
    const s = playerMesh.scale.x || 1;
    prop.scale.setScalar(1 / s);
    const grip = prop.userData.grip || { x: 0, y: -0.1, z: 0.12, rx: 0, ry: 0, rz: 0 };
    prop.position.set(grip.x, grip.y, grip.z);
    prop.rotation.set(grip.rx || 0, grip.ry || 0, grip.rz || 0);
    if (prop.userData.marker) prop.userData.marker.visible = false;
  }

  function restorePropMaterials(prop) {
    prop.traverse(function (obj) {
      if (!obj.material || obj.userData === prop.userData) return;
      const list = Array.isArray(obj.material) ? obj.material : [obj.material];
      list.forEach(function (m) {
        if (m.userData && m.userData.isMarker) {
          m.transparent = true;
          m.opacity = 0.35;
          return;
        }
        m.opacity = 1;
        m.transparent = false;
      });
    });
  }

  function detachProp(prop, scene, worldPos) {
    if (!prop || !scene) return;
    scene.attach(prop);
    prop.scale.setScalar(1);
    prop.rotation.set(0, 0, 0);
    const y = worldPos && worldPos.y != null ? worldPos.y : 0;
    prop.position.set(worldPos.x, y, worldPos.z);
    if (prop.userData.marker) prop.userData.marker.visible = true;
    restorePropMaterials(prop);
  }

  function stepCarry(state, dt, ctx) {
    ctx = ctx || {};
    if (!state || !state.prop || !ctx.playerMesh) return { hint: '', event: null, phase: 'idle' };
    const mesh = ctx.playerMesh;
    let event = null;

    if (state.phase === 'reaching') {
      mesh.userData.carry = 'reach';
      state.timer -= dt;
      if (state.timer <= 0) {
        if (ctx.inRange) {
          attachProp(mesh, state.prop);
          state.phase = 'holding';
          mesh.userData.carry = 'hold';
          event = 'grabbed';
        } else {
          state.phase = 'idle';
          mesh.userData.carry = 'none';
        }
      }
    } else if (state.phase === 'placing') {
      mesh.userData.carry = 'reach';
      state.timer -= dt;
      if (state.timer <= 0) {
        detachProp(state.prop, ctx.scene, ctx.placeAt || { x: 0, y: 0, z: 0 });
        state.phase = 'idle';
        mesh.userData.carry = 'none';
        event = 'placed';
      }
    } else if (state.phase === 'holding') {
      mesh.userData.carry = 'hold';
      if (ctx.pressed) {
        state.phase = 'placing';
        state.timer = 0.42;
        mesh.userData.carry = 'reach';
      }
    } else {
      mesh.userData.carry = 'none';
      if (ctx.pressed && ctx.inRange) {
        state.phase = 'reaching';
        state.timer = 0.48;
        mesh.userData.carry = 'reach';
      }
    }

    let hint = '';
    if (state.phase === 'reaching') hint = 'Reaching for the water jar…';
    else if (state.phase === 'placing') hint = 'Setting the jar down…';
    else if (state.phase === 'holding') hint = 'E or Place — set the water jar down';
    else if (ctx.inRange) hint = 'E or Pick up — grab the water jar';
    return { hint: hint, event: event, phase: state.phase };
  }

  window.PaulCharacters = {
    create: createCharacter,
    setOpacity: setOpacity,
    updateWalk: updateWalk,
    faceDirection: faceDirection,
    setCarry: setCarry,
    createWaterJar: createWaterJar,
    createCarryState: createCarryState,
    stepCarry: stepCarry,
    roles: ROLES
  };
})();
