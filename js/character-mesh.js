// ============================================================
// Shared humanoid builder — smooth lathe body, draped cloth,
// rounded limbs. Still a web-weight Three.js mesh (no skinning
// library). Shoulder / elbow / hip / knee stay poseable.
// Level 1 identity: role "disciple" + face card
//   assets/characters/young_disciple.jpg
//   (beige tunic, dark cloak, brown belt, curly hair).
// Level 1 guards use the same smooth rig with rounded armor.
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

  const CLOTH_MAPS = {};

  function clothMap(hex) {
    const key = (hex >>> 0).toString(16);
    if (CLOTH_MAPS[key]) return CLOTH_MAPS[key];
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    const r = (hex >> 16) & 255;
    const g = (hex >> 8) & 255;
    const b = hex & 255;
    ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
    ctx.fillRect(0, 0, 96, 96);
    for (let y = 0; y < 96; y += 2) {
      ctx.fillStyle = 'rgba(0,0,0,' + (0.035 + (y % 8) * 0.008) + ')';
      ctx.fillRect(0, y, 96, 1);
    }
    for (let x = 0; x < 96; x += 3) {
      ctx.fillStyle = 'rgba(255,248,230,0.04)';
      ctx.fillRect(x, 0, 1, 96);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2.2, 2.2);
    tex.encoding = THREE.sRGBEncoding;
    CLOTH_MAPS[key] = tex;
    return tex;
  }

  function stdMat(color, extras) {
    extras = extras || {};
    return new THREE.MeshStandardMaterial(Object.assign({
      color: color,
      roughness: 0.78,
      metalness: 0.04,
      emissive: color,
      emissiveIntensity: 0.1
    }, extras));
  }

  function tunicShape() {
    const pts = [
      [0.075, 0.64],
      [0.13, 0.54],
      [0.27, 0.40],
      [0.31, 0.28],
      [0.24, 0.10],
      [0.20, -0.02],
      [0.25, -0.16],
      [0.31, -0.32],
      [0.36, -0.48],
      [0.31, -0.54]
    ];
    return new THREE.LatheGeometry(pts.map(function (p) {
      return new THREE.Vector2(p[0], p[1]);
    }), 18);
  }

  function drapeGeometry(width, length, segsX, segsY, bow) {
    const geo = new THREE.PlaneGeometry(width, length, segsX, segsY);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const nx = x / (width * 0.5);
      const ny = (y / (length * 0.5) + 1) * 0.5;
      const z = Math.pow(1 - ny, 1.15) * bow + nx * nx * 0.1 * (1 - ny * 0.4);
      pos.setZ(i, -z);
      // Wider across the shoulders, softer through the hem, so the back is not a rectangle.
      pos.setX(i, x * (0.78 + 0.34 * ny * ny));
    }
    geo.computeVertexNormals();
    return geo;
  }

  function curvedFace(w, h) {
    const geo = new THREE.PlaneGeometry(w, h, 6, 6);
    const pos = geo.attributes.position;
    const radius = 0.34;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const ang = x / radius;
      pos.setX(i, Math.sin(ang) * radius);
      pos.setZ(i, pos.getZ(i) + (Math.cos(ang) - 1) * 0.12);
    }
    geo.computeVertexNormals();
    return geo;
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
    const card = new THREE.Mesh(curvedFace(0.34, 0.40), mat);
    card.position.set(0, 0.01, 0.20);
    card.castShadow = false;
    card.receiveShadow = true;
    head.add(card);
  }

  function makeHand(material) {
    const anchor = new THREE.Group();
    const palm = part(new THREE.SphereGeometry(0.052, 10, 8), material);
    palm.scale.set(1.35, 0.7, 1.05);
    palm.position.set(0, -0.035, 0.02);
    anchor.add(palm);
    for (let i = -1; i <= 1; i++) {
      const finger = part(new THREE.CylinderGeometry(0.013, 0.011, 0.062, 6), material);
      finger.position.set(i * 0.026, -0.085, 0.028);
      const tip = part(new THREE.SphereGeometry(0.013, 6, 5), material);
      tip.position.set(i * 0.026, -0.118, 0.028);
      anchor.add(finger);
      anchor.add(tip);
    }
    const thumb = part(new THREE.CylinderGeometry(0.014, 0.011, 0.048, 6), material);
    thumb.position.set(0.05, -0.04, 0.03);
    thumb.rotation.z = 0.85;
    const thumbTip = part(new THREE.SphereGeometry(0.014, 6, 5), material);
    thumbTip.position.set(0.068, -0.055, 0.03);
    anchor.add(thumb);
    anchor.add(thumbTip);
    return anchor;
  }

  function armChain(upperLen, foreLen, skin, cloth) {
    const shoulder = new THREE.Group();
    const upper = part(new THREE.CylinderGeometry(0.072, 0.062, upperLen, 12), skin);
    upper.position.y = -upperLen / 2;
    shoulder.add(upper);
    const cap = part(new THREE.SphereGeometry(0.074, 10, 8), skin);
    shoulder.add(cap);
    const sleeve = part(new THREE.CylinderGeometry(0.09, 0.078, 0.2, 12), cloth);
    sleeve.position.y = -0.07;
    shoulder.add(sleeve);
    const elbow = new THREE.Group();
    elbow.position.y = -upperLen;
    const joint = part(new THREE.SphereGeometry(0.064, 10, 8), skin);
    elbow.add(joint);
    const fore = part(new THREE.CylinderGeometry(0.058, 0.046, foreLen, 12), skin);
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
    const thigh = part(new THREE.CylinderGeometry(0.105, 0.08, thighLen, 12), thighMat);
    thigh.position.y = -thighLen / 2;
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -thighLen;
    const joint = part(new THREE.SphereGeometry(0.075, 10, 8), shinMat);
    knee.add(joint);
    const shin = part(new THREE.CylinderGeometry(0.07, 0.05, shinLen, 12), shinMat);
    shin.position.y = -shinLen / 2;
    knee.add(shin);
    const foot = part(new THREE.SphereGeometry(0.062, 10, 8), footMat);
    foot.scale.set(1.05, 0.5, 1.9);
    foot.position.set(0, -shinLen - 0.01, 0.045);
    knee.add(foot);
    const strap = part(new THREE.TorusGeometry(0.04, 0.008, 5, 10), footMat);
    strap.rotation.x = Math.PI / 2;
    strap.position.set(0, -shinLen + 0.015, 0.02);
    knee.add(strap);
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

    const skin = stdMat(palette.skin, { roughness: 0.58, metalness: 0.02, emissiveIntensity: 0.08 });
    const hair = stdMat(palette.hair, { roughness: 0.72, metalness: 0.02, emissiveIntensity: 0.06 });
    const clothMapTex = clothMap(palette.tunic);
    const cloth = stdMat(palette.tunic, {
      roughness: 0.9,
      metalness: 0.02,
      emissiveIntensity: 0.11,
      map: clothMapTex || null
    });
    const sashMat = stdMat(palette.sash, { roughness: 0.62, metalness: role === 'guard' ? 0.18 : 0.06 });
    const accent = stdMat(palette.accent, { roughness: 0.88, emissiveIntensity: 0.07 });
    const armorMat = palette.armor
      ? stdMat(palette.armor, { metalness: 0.62, roughness: 0.28, emissiveIntensity: 0.06 })
      : null;

    const group = new THREE.Group();
    const rig = new THREE.Group();
    group.add(rig);
    group.userData.role = role;
    group.userData.walkPhase = 0;
    group.userData.hidden = false;
    group.userData.carry = 'none';
    group.userData.pose = pose;
    group.userData.rig = rig;

    const torso = part(tunicShape(), cloth);
    torso.scale.set(1.06, 1, 0.84);
    rig.add(torso);

    const belt = part(new THREE.TorusGeometry(0.27, 0.028, 8, 18), sashMat);
    belt.rotation.x = Math.PI / 2;
    belt.position.y = -0.04;
    belt.scale.set(1.12, 1, 0.9);
    rig.add(belt);

    if (role === 'paul' || role === 'disciple') {
      const cloakMat = accent.clone();
      cloakMat.side = THREE.DoubleSide;
      const cloak = part(
        drapeGeometry(role === 'disciple' ? 0.62 : 0.7, role === 'disciple' ? 0.92 : 1.02, 10, 14, 0.26),
        cloakMat
      );
      cloak.position.set(0, role === 'disciple' ? 0.08 : 0.02, -0.2);
      rig.add(cloak);
      if (role === 'disciple') {
        const cowl = part(new THREE.TorusGeometry(0.2, 0.055, 8, 14), accent);
        cowl.rotation.x = Math.PI / 2;
        cowl.position.y = 0.5;
        cowl.scale.set(1.15, 1, 0.72);
        rig.add(cowl);
        const pouch = part(new THREE.SphereGeometry(0.07, 8, 6), accent);
        pouch.scale.set(0.85, 1.15, 0.55);
        pouch.position.set(0.22, -0.16, 0.16);
        rig.add(pouch);
      }
    }
    if (role === 'guard' && armorMat) {
      const breast = part(new THREE.SphereGeometry(0.26, 16, 12), armorMat);
      breast.scale.set(1.2, 1.35, 0.48);
      breast.position.set(0, 0.2, 0.1);
      rig.add(breast);
      const fauld = part(new THREE.TorusGeometry(0.24, 0.04, 6, 14), armorMat);
      fauld.rotation.x = Math.PI / 2;
      fauld.position.y = -0.08;
      fauld.scale.set(1.15, 1, 0.85);
      rig.add(fauld);
    }

    const neck = part(new THREE.CylinderGeometry(0.07, 0.09, 0.12, 10), skin);
    neck.position.y = 0.62;
    rig.add(neck);

    const headPivot = new THREE.Group();
    headPivot.position.y = 0.76;
    const head = part(new THREE.SphereGeometry(0.27, 20, 16), skin);
    head.scale.set(1, 1.06, 0.96);
    headPivot.add(head);
    const hairCap = part(new THREE.SphereGeometry(0.28, 16, 12), hair);
    hairCap.scale.set(1.05, 0.58, 1.08);
    hairCap.position.y = 0.11;
    headPivot.add(hairCap);

    if (role === 'disciple') {
      [[-0.16, 0.1, 0.12], [0.16, 0.1, 0.12], [0.0, 0.2, 0.02], [-0.1, 0.16, -0.1], [0.11, 0.15, -0.1], [-0.18, 0.02, 0.02], [0.18, 0.02, 0.02]].forEach(function (p) {
        const curl = part(new THREE.SphereGeometry(0.075, 8, 6), hair);
        curl.position.set(p[0], p[1], p[2]);
        headPivot.add(curl);
      });
      const beard = part(new THREE.SphereGeometry(0.09, 10, 8), hair);
      beard.scale.set(1.2, 0.7, 0.5);
      beard.position.set(0, -0.16, 0.12);
      headPivot.add(beard);
    }

    if (role === 'guard' && palette.helmet) {
      const helmMat = stdMat(palette.helmet, { metalness: 0.58, roughness: 0.32, emissiveIntensity: 0.05 });
      const helm = part(new THREE.SphereGeometry(0.3, 16, 12), helmMat);
      helm.scale.set(1.05, 0.78, 1.08);
      helm.position.y = 0.06;
      headPivot.add(helm);
      const brim = part(new THREE.TorusGeometry(0.28, 0.028, 6, 16), helmMat);
      brim.rotation.x = Math.PI / 2;
      brim.position.y = -0.04;
      brim.scale.set(1.05, 1, 1.12);
      headPivot.add(brim);
      const crestMat = stdMat(palette.sash, { roughness: 0.55, side: THREE.DoubleSide });
      const crest = part(drapeGeometry(0.07, 0.32, 2, 8, 0.08), crestMat);
      crest.position.set(0, 0.26, -0.02);
      crest.rotation.x = -0.35;
      headPivot.add(crest);
    }

    if (showFace) attachFaceCard(headPivot, palette.face);
    rig.add(headPivot);

    const shoulderMat = armorMat || cloth;
    const capL = part(new THREE.SphereGeometry(role === 'guard' ? 0.14 : 0.11, 12, 10), shoulderMat);
    capL.position.set(-0.36, 0.46, 0);
    capL.scale.set(1, 0.85, 0.9);
    rig.add(capL);
    const capR = part(new THREE.SphereGeometry(role === 'guard' ? 0.14 : 0.11, 12, 10), shoulderMat);
    capR.position.set(0.36, 0.46, 0);
    capR.scale.set(1, 0.85, 0.9);
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
