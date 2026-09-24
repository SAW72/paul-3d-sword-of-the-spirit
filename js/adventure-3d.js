// ============================================================
// PAUL Adventure 3D Engine – Levels 1–5
// Shared third-person controller + per-level scene builders
// ============================================================

(function () {
  let renderer, scene, camera, clock, animId;
  let playerMesh, playerPos, animT = 0;
  let keys = {}, yaw = Math.PI / 2, pitch = 0.2, pointerLocked = false;
  let npcs = [], hideZones = [], goalZone = null, interactZone = null;
  let isHidden = false, frozen = false, gameWon = false, lives = 3;
  let statusEl, livesEl, container, currentLevel = 1;
  let onComplete, onLifeLost, onGameOver, onInteract;
  let SPEED = 8.5;
  let carryState = null, carryLabel = null, carryHintEl = null, carryBtn = null;
  let nearJarUntil = 0;
  let catchCooldown = 0;
  let playerFill = null;
  const JAR_HOME = { x: 60.6, z: 3.25 };

  const LEVELS = {
    1: {
      name: 'Jerusalem Escape',
      player: 'disciple',
      walk: true,
      theme: 'night',
      objective: 'Reach the City Gate. Hide behind stalls. Near the gate, press E to pick up the water jar and E again to place it.',
      start: { x: 2, z: 0 },
      goal: { x: 68, z: 0, r: 3.5, label: 'CITY GATE' },
      guards: true,
      hide: true,
      pickup: true
    },
    2: {
      name: 'Damascus – Ananias',
      player: 'ananias',
      walk: false,
      theme: 'day',
      objective: 'Walk to the house on Straight Street. Then choose: Trust or Run.',
      start: { x: 2, z: 0 },
      goal: { x: 55, z: 0, r: 3.2, label: 'HOUSE OF JUDAS' },
      guards: true,
      hide: false,
      interact: true
    },
    3: {
      name: 'Lystra – The Lame Man',
      player: 'paul',
      walk: false,
      theme: 'day',
      objective: 'Walk to the lame man and speak the right words of faith.',
      start: { x: 2, z: 0 },
      goal: { x: 42, z: 0, r: 3.0, label: 'LAME MAN' },
      guards: false,
      hide: false,
      interact: true,
      npc: 'lame'
    },
    4: {
      name: 'Malta – The Viper',
      player: 'paul',
      walk: false,
      theme: 'beach',
      objective: 'Walk to the fire. When the viper strikes, choose courage.',
      start: { x: 2, z: 0 },
      goal: { x: 38, z: 0, r: 3.0, label: 'FIRE' },
      guards: false,
      hide: false,
      interact: true
    },
    5: {
      name: 'Antioch – Confront Peter',
      player: 'paul',
      walk: false,
      theme: 'market',
      objective: 'Walk to Peter and confront him publicly in love.',
      start: { x: 2, z: 0 },
      goal: { x: 48, z: 0, r: 3.2, label: 'PETER' },
      guards: false,
      hide: false,
      interact: true,
      npc: 'peter'
    },
    6: {
      name: 'Ephesus – Real Authority',
      player: 'paul',
      walk: false,
      theme: 'temple',
      objective: 'Walk into the heart of Ephesus. Choose the full armor of God — not a magic formula.',
      start: { x: 2, z: 0 },
      goal: { x: 50, z: 0, r: 3.2, label: 'ARMOR OF GOD' },
      guards: false,
      hide: false,
      interact: true,
      demon: true
    },
    7: {
      name: 'Rome – Prison Letters',
      player: 'paul',
      walk: false,
      theme: 'house',
      objective: 'Walk to the writing desk under house arrest. Match each letter to its true theme.',
      start: { x: 2, z: 0 },
      goal: { x: 36, z: 0, r: 2.8, label: 'WRITING DESK' },
      guards: false,
      hide: false,
      interact: true
    },
    8: {
      name: 'Final Stand – Sword of the Spirit',
      player: 'paul',
      walk: false,
      theme: 'court',
      objective: 'Walk to the center of Nero’s court. Recite 2 Timothy 4:6-8 and finish the race.',
      start: { x: 2, z: 0 },
      goal: { x: 45, z: 0, r: 3.0, label: 'THE COURT' },
      guards: false,
      hide: false,
      interact: true,
      pillars: true
    }
  };

  function startAdventure3D(levelNum, containerId, cbs) {
    destroyAdventure3D();
    currentLevel = levelNum;
    const cfg = LEVELS[levelNum];
    if (!cfg) return console.error('Unknown level', levelNum);

    container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    lives = (cbs && cbs.lives) || 3;
    gameWon = false;
    frozen = false;
    isHidden = false;
    catchCooldown = 0;
    playerFill = null;
    yaw = Math.PI / 2;
    pitch = levelNum === 1 ? 0.05 : 0.18;
    pointerLocked = false;
    onComplete = cbs && cbs.onComplete;
    onLifeLost = cbs && cbs.onLifeLost;
    onGameOver = cbs && cbs.onGameOver;
    onInteract = cbs && cbs.onInteract;

    // UI
    const ui = document.createElement('div');
    ui.id = 'adv3d-ui';
    ui.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:20;font-family:Inter,sans-serif;';
    ui.innerHTML = `
      <div id="adv-status" style="position:absolute;top:10px;left:10px;right:10px;max-width:520px;background:rgba(0,0,0,0.75);color:#e8d5a3;padding:12px 16px;border-radius:12px;font-size:14px;border:1px solid rgba(232,197,71,0.35);line-height:1.45;">
        <b style="color:#e8c547">Level ${levelNum}: ${cfg.name}</b><br>${cfg.objective}<br>
        <span style="opacity:0.85">Click/tap view • WASD or left stick • Mouse / LOOK pad</span>
      </div>
      <div id="adv-lives" style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,0.75);color:#ff6b6b;padding:10px 14px;border-radius:10px;font-size:18px;font-weight:bold;">❤️ ${lives}</div>
      <div id="adv-carry" style="position:absolute;left:50%;bottom:18px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;">
        <div id="adv-carry-hint" style="display:none;background:rgba(0,0,0,0.78);color:#e8d5a3;border:1px solid rgba(232,197,71,0.45);border-radius:10px;padding:8px 14px;font-size:14px;font-weight:600;"></div>
        <button id="adv-carry-btn" type="button" style="display:none;pointer-events:auto;background:#c9a227;color:#1a1208;border:none;border-radius:12px;padding:10px 18px;font-weight:700;font-size:15px;cursor:pointer;font-family:Inter,sans-serif;">Pick up</button>
      </div>
      <div style="position:absolute;top:50%;left:50%;width:10px;height:10px;margin:-5px;border:2px solid rgba(232,197,71,0.5);border-radius:50%;"></div>
    `;
    container.style.position = 'relative';
    container.appendChild(ui);
    statusEl = document.getElementById('adv-status');
    livesEl = document.getElementById('adv-lives');
    carryHintEl = document.getElementById('adv-carry-hint');
    carryBtn = document.getElementById('adv-carry-btn');
    nearJarUntil = 0;
    if (carryBtn) {
      carryBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        commitGrab();
      });
    }
    // Mobile controls + unlock audio
    if (window.PaulMobile) window.PaulMobile.create(container);
    if (window.PaulAudio) window.PaulAudio.unlock();
    if (window.PaulSFX) { try { window.PaulSFX.ambientStart(); } catch(e){} }

    const w = container.clientWidth || 960;
    const h = container.clientHeight || 560;

    scene = new THREE.Scene();
    clock = new THREE.Clock();

    // Theme atmosphere
    if (cfg.theme === 'night') {
      scene.background = new THREE.Color(0x050408);
      scene.fog = new THREE.FogExp2(0x0a0810, 0.016);
    } else if (cfg.theme === 'beach') {
      scene.background = new THREE.Color(0x87b8d8);
      scene.fog = new THREE.FogExp2(0xb8d4e8, 0.012);
    } else if (cfg.theme === 'temple') {
      scene.background = new THREE.Color(0x120a18);
      scene.fog = new THREE.FogExp2(0x1a1020, 0.014);
    } else if (cfg.theme === 'house') {
      scene.background = new THREE.Color(0x1a1510);
      scene.fog = new THREE.FogExp2(0x2a2018, 0.02);
    } else if (cfg.theme === 'court') {
      scene.background = new THREE.Color(0x2a3038);
      scene.fog = new THREE.FogExp2(0x3a4048, 0.012);
    } else {
      scene.background = new THREE.Color(0xb8c8d8);
      scene.fog = new THREE.FogExp2(0xc8d4e0, 0.011);
    }

    camera = new THREE.PerspectiveCamera(58, w / h, 0.1, 250);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;border-radius:12px;cursor:pointer;';
    container.insertBefore(renderer.domElement, ui);

    buildWorld(cfg);
    buildPlayer(cfg);
    if (cfg.pickup) buildPickup(cfg);
    if (cfg.guards) buildGuards(cfg);
    if (cfg.npc) buildNPC(cfg);

    // Goal marker
    const goalMat = new THREE.MeshStandardMaterial({
      color: cfg.theme === 'night' ? 0x1a5c2e : 0x2ecc71,
      emissive: 0x0a3a1a,
      emissiveIntensity: 0.5
    });
    const goalMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.15, 24), goalMat);
    goalMesh.position.set(cfg.goal.x, 0.08, cfg.goal.z);
    scene.add(goalMesh);
    goalZone = { x: cfg.goal.x, z: cfg.goal.z, r: cfg.goal.r, label: cfg.goal.label };

    // Label sprite-like text via canvas
    addFloatingLabel(cfg.goal.x, 3.2, cfg.goal.z, cfg.goal.label, '#2ecc71');

    // Lights
    setupLights(cfg);

    // Input — desktop pointer lock + Safari/mobile-safe drag look
    keys = {};
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    const isTouch = (window.PaulMobile && window.PaulMobile.isTouch && window.PaulMobile.isTouch()) ||
      ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    renderer.domElement.addEventListener('click', () => {
      if (!renderer || !renderer.domElement) return;
      if (window.PaulAudio) window.PaulAudio.unlock();
      if (window.PaulSFX) { try { window.PaulSFX.levelStart(); } catch (e) {} }
      if (!isTouch && renderer.domElement.requestPointerLock) {
        try { renderer.domElement.requestPointerLock(); } catch (e) {}
      }
    });
    document.addEventListener('pointerlockchange', onPointerLock);
    document.addEventListener('mousemove', onMouse);

    let dragLook = false, lastDX = 0, lastDY = 0;
    const startDrag = (x, y) => { dragLook = true; lastDX = x; lastDY = y; };
    const moveDrag = (x, y) => {
      if (!dragLook || frozen || pointerLocked) return;
      yaw -= (x - lastDX) * 0.004;
      pitch -= (y - lastDY) * 0.003;
      pitch = Math.max(-0.35, Math.min(0.55, pitch));
      lastDX = x; lastDY = y;
    };
    const endDrag = () => { dragLook = false; };
    renderer.domElement.addEventListener('mousedown', (e) => {
      if (!pointerLocked) startDrag(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('mousemove', (e) => {
      if (dragLook && !pointerLocked) moveDrag(e.clientX, e.clientY);
    });
    renderer.domElement.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        const w = window.innerWidth || 400;
        if (t.clientX > w * 0.28 && t.clientX < w * 0.72) startDrag(t.clientX, t.clientY);
      }
    }, { passive: true });
    renderer.domElement.addEventListener('touchmove', (e) => {
      if (dragLook && e.touches.length) moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    renderer.domElement.addEventListener('touchend', endDrag);
    window.addEventListener('resize', onResize);

    animId = requestAnimationFrame(loop);
  }

  function setupLights(cfg) {
    if (cfg.theme === 'night') {
      scene.add(new THREE.AmbientLight(0x667088, 0.72));
      playerFill = new THREE.PointLight(0xfff1d6, 0.85, 8);
      playerFill.position.set(cfg.start.x, 3, cfg.start.z);
      scene.add(playerFill);
      const moon = new THREE.DirectionalLight(0xc4d0e8, 0.85);
      moon.position.set(-8, 28, 12);
      moon.castShadow = true;
      moon.shadow.mapSize.set(1024, 1024);
      moon.shadow.camera.near = 2;
      moon.shadow.camera.far = 90;
      moon.shadow.camera.left = -20;
      moon.shadow.camera.right = 55;
      moon.shadow.camera.top = 16;
      moon.shadow.camera.bottom = -16;
      scene.add(moon);
      [-20, -5, 2, 12, 28, 45].forEach((x, i) => {
        const pl = new THREE.PointLight(0xffaa44, 1.7, 18, 1.3);
        pl.position.set(x, 3.0, i % 2 ? 3.2 : -3.2);
        pl.castShadow = true;
        scene.add(pl);
      });
    } else if (cfg.theme === 'beach') {
      scene.add(new THREE.AmbientLight(0xfff5e0, 0.55));
      const sun = new THREE.DirectionalLight(0xffe8c0, 1.1);
      sun.position.set(20, 40, 10);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      scene.add(sun);
    } else if (cfg.theme === 'temple') {
      scene.add(new THREE.AmbientLight(0x2a2030, 0.45));
      const dim = new THREE.DirectionalLight(0x8866aa, 0.5);
      dim.position.set(10, 30, 5);
      dim.castShadow = true;
      scene.add(dim);
      const eerie = new THREE.PointLight(0x6622aa, 0.8, 20);
      eerie.position.set(40, 4, 0);
      scene.add(eerie);
    } else if (cfg.theme === 'house') {
      scene.add(new THREE.AmbientLight(0x3a3020, 0.4));
      const warm = new THREE.PointLight(0xffcc88, 1.2, 18);
      warm.position.set(20, 3, 0);
      scene.add(warm);
    } else if (cfg.theme === 'court') {
      scene.add(new THREE.AmbientLight(0x505060, 0.45));
      const sun = new THREE.DirectionalLight(0xfff0d0, 0.9);
      sun.position.set(10, 40, 5);
      sun.castShadow = true;
      scene.add(sun);
    } else {
      scene.add(new THREE.AmbientLight(0xfff8e8, 0.5));
      const sun = new THREE.DirectionalLight(0xfff0d0, 1.0);
      sun.position.set(15, 35, 8);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      scene.add(sun);
    }
  }

  function buildWorld(cfg) {
    const loader = new THREE.TextureLoader();
    let groundTex, wallTex;
    if (cfg.theme === 'beach') {
      groundTex = loader.load('assets/textures/sand.jpg');
      wallTex = loader.load('assets/textures/plaster.jpg');
    } else if (cfg.theme === 'night') {
      groundTex = loader.load('assets/textures/ground.jpg');
      wallTex = loader.load('assets/textures/wall.jpg');
    } else if (cfg.theme === 'temple') {
      groundTex = loader.load('assets/textures/temple.jpg');
      wallTex = loader.load('assets/textures/temple.jpg');
    } else if (cfg.theme === 'house') {
      groundTex = loader.load('assets/textures/mosaic.jpg');
      wallTex = loader.load('assets/textures/plaster.jpg');
    } else if (cfg.theme === 'court') {
      groundTex = loader.load('assets/textures/marble.jpg');
      wallTex = loader.load('assets/textures/marble.jpg');
    } else {
      groundTex = loader.load('assets/textures/stone_day.jpg');
      wallTex = loader.load('assets/textures/plaster.jpg');
    }
    groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
    groundTex.repeat.set(10, 4);
    wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
    wallTex.repeat.set(6, 2);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 16),
      new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(40, 0, 0);
    ground.receiveShadow = true;
    scene.add(ground);

    // Side walls / cliffs / buildings
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 });
    const zWall = cfg.theme === 'beach' ? 7 : 5.8;
    [[-zWall, 1], [zWall, -1]].forEach(([z, side]) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(90, 5.5, 1.0), wallMat);
      wall.position.set(40, 2.75, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
    });

    // Props / stalls / houses depending on level
    const woodTex = loader.load('assets/textures/wood.jpg');
    woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85 });

    hideZones = [];
    if (cfg.hide || cfg.theme === 'day' || cfg.theme === 'market') {
      const props = [
        { x: 10, z: 3.5 }, { x: 22, z: -3.3 }, { x: 34, z: 3.4 }, { x: 46, z: -3.2 }
      ];
      props.forEach((p, i) => {
        const box = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.6, 2.0), woodMat);
        box.position.set(p.x, 1.3, p.z);
        box.castShadow = true;
        box.receiveShadow = true;
        scene.add(box);
        if (cfg.hide) hideZones.push({ x: p.x, z: p.z, rx: 2.0, rz: 1.6 });
        // canopy
        const can = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.12, 2.4),
          new THREE.MeshStandardMaterial({ color: 0x6a4520 }));
        can.position.set(p.x, 2.7, p.z);
        scene.add(can);
      });
    }

    if (cfg.theme === 'beach') {
      for (let i = 0; i < 8; i++) {
        const rock = new THREE.Mesh(
          new THREE.SphereGeometry(0.4 + Math.random() * 0.5, 6, 6),
          new THREE.MeshStandardMaterial({ color: 0x6a6558, roughness: 0.95 })
        );
        rock.position.set(15 + i * 4, 0.3, (i % 2 ? 2.5 : -2.5));
        rock.castShadow = true;
        scene.add(rock);
      }
      const fireLight = new THREE.PointLight(0xff6622, 1.5, 12);
      fireLight.position.set(cfg.goal.x, 1.5, cfg.goal.z);
      scene.add(fireLight);
      const fireMesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.6, 1.2, 8),
        new THREE.MeshBasicMaterial({ color: 0xff4400 })
      );
      fireMesh.position.set(cfg.goal.x, 0.8, cfg.goal.z);
      scene.add(fireMesh);
    }

    if (currentLevel === 2) {
      const house = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 4), wallMat);
      house.position.set(cfg.goal.x + 2, 2.5, 0);
      house.castShadow = true;
      scene.add(house);
    }

    // Level 6 – Ephesus temple ruins
    if (cfg.theme === 'temple') {
      const colMat = new THREE.MeshStandardMaterial({ color: 0x8a8070, roughness: 0.85 });
      for (let i = 0; i < 6; i++) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 6, 12), colMat);
        col.position.set(12 + i * 7, 3, (i % 2 === 0 ? 4.2 : -4.2));
        col.castShadow = true;
        scene.add(col);
        const cap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 1.4), colMat);
        cap.position.set(col.position.x, 6.1, col.position.z);
        scene.add(cap);
      }
      // Central platform (armor goal)
      const plat = new THREE.Mesh(
        new THREE.CylinderGeometry(2.5, 2.8, 0.4, 16),
        new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.4, roughness: 0.4, emissive: 0x553300, emissiveIntensity: 0.25 })
      );
      plat.position.set(cfg.goal.x, 0.2, cfg.goal.z);
      scene.add(plat);
      const glow = new THREE.PointLight(0xffd700, 1.2, 14);
      glow.position.set(cfg.goal.x, 2.5, cfg.goal.z);
      scene.add(glow);
      // Dark "demon" wisps
      for (let i = 0; i < 4; i++) {
        const wisp = new THREE.Mesh(
          new THREE.SphereGeometry(0.35, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0x220011, transparent: true, opacity: 0.7 })
        );
        wisp.position.set(cfg.goal.x + Math.cos(i)*3.5, 1.5, cfg.goal.z + Math.sin(i)*2);
        scene.add(wisp);
      }
    }

    // Level 7 – Roman house arrest
    if (cfg.theme === 'house') {
      // Floor already set via mosaic in ground path - extra furniture
      const desk = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 1.0, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x5a3a18, roughness: 0.8 })
      );
      desk.position.set(cfg.goal.x, 0.5, cfg.goal.z);
      desk.castShadow = true;
      scene.add(desk);
      const scroll = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.9, 8),
        new THREE.MeshStandardMaterial({ color: 0xe8d5a3 })
      );
      scroll.rotation.z = Math.PI / 2;
      scroll.position.set(cfg.goal.x, 1.15, cfg.goal.z);
      scene.add(scroll);
      // Chain / soldier hint
      const chain = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.06, 8, 12),
        new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.3 })
      );
      chain.position.set(cfg.start.x + 1.5, 1.0, 1.5);
      scene.add(chain);
      const lamp = new THREE.PointLight(0xffcc88, 1.0, 12);
      lamp.position.set(cfg.goal.x - 2, 2.8, cfg.goal.z);
      scene.add(lamp);
    }

    // Level 8 – Nero's court
    if (cfg.theme === 'court') {
      const marbleTex = new THREE.TextureLoader().load('assets/textures/marble.jpg');
      marbleTex.wrapS = marbleTex.wrapT = THREE.RepeatWrapping;
      const marMat = new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.4, metalness: 0.15 });
      for (let i = 0; i < 8; i++) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 7, 16), marMat);
        const ang = (i / 8) * Math.PI * 2;
        // line of pillars toward court
        col.position.set(10 + i * 4.5, 3.5, (i % 2 === 0 ? 4.5 : -4.5));
        col.castShadow = true;
        scene.add(col);
      }
      // Raised dais
      const dais = new THREE.Mesh(new THREE.BoxGeometry(8, 0.6, 6), marMat);
      dais.position.set(cfg.goal.x, 0.3, 0);
      dais.receiveShadow = true;
      scene.add(dais);
      // Heavenly light
      const heaven = new THREE.PointLight(0xffe8a0, 1.6, 20);
      heaven.position.set(cfg.goal.x, 8, 0);
      scene.add(heaven);
      const spot = new THREE.SpotLight(0xfff5d0, 0.9, 30, 0.4, 0.4);
      spot.position.set(cfg.goal.x, 12, 0);
      spot.target.position.set(cfg.goal.x, 0, 0);
      scene.add(spot);
      scene.add(spot.target);
    }
  }

  function buildPickup(cfg) {
    if (!window.PaulCharacters.createWaterJar) return;
    const jar = window.PaulCharacters.createWaterJar();
    jar.position.set(JAR_HOME.x, 0.36, JAR_HOME.z);
    scene.add(jar);
    carryState = window.PaulCharacters.createCarryState(jar);

    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 0.36, 0.78),
      new THREE.MeshStandardMaterial({ color: 0x6d675c, roughness: 0.92 })
    );
    plinth.position.set(JAR_HOME.x, 0.18, JAR_HOME.z);
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    scene.add(plinth);

    const lamp = new THREE.PointLight(0xffb060, 0.7, 7, 1.4);
    lamp.position.set(JAR_HOME.x, 1.4, JAR_HOME.z);
    scene.add(lamp);

    carryLabel = addFloatingLabel(JAR_HOME.x, 1.55, JAR_HOME.z, 'WATER JAR', '#e8c547');
  }

  function buildPlayer(cfg) {
    const role = cfg.player || 'paul';
    const scale = currentLevel === 1 ? 1.16 : 1;
    playerMesh = window.PaulCharacters.create(role, { scale: scale });
    playerPos = new THREE.Vector3(cfg.start.x, playerMesh.userData.centerY, cfg.start.z);
    playerMesh.position.copy(playerPos);
    window.PaulCharacters.faceDirection(playerMesh, 1, 0);
    scene.add(playerMesh);
  }

  function buildGuards(cfg) {
    const patrols = [
      { x: 14, z: 0.5, min: 8, max: 24, sp: 3.0 },
      { x: 32, z: -0.5, min: 26, max: 40, sp: 2.5 },
      { x: 50, z: 0.3, min: 44, max: 58, sp: 2.2 }
    ];
    npcs = [];
    patrols.forEach(p => {
      const mesh = window.PaulCharacters.create('guard');
      mesh.position.set(p.x, mesh.userData.centerY, p.z);
      window.PaulCharacters.faceDirection(mesh, 1, 0);
      scene.add(mesh);
      npcs.push({ mesh, min: p.min, max: p.max, speed: p.sp, dir: 1, type: 'guard' });
    });
  }

  function buildNPC(cfg) {
    if (cfg.npc === 'lame') {
      const mesh = window.PaulCharacters.create('lame', { pose: 'sit' });
      mesh.position.set(cfg.goal.x, mesh.userData.centerY, cfg.goal.z);
      window.PaulCharacters.faceDirection(mesh, -1, 0);
      scene.add(mesh);
      addFloatingLabel(cfg.goal.x, 2.2, cfg.goal.z, 'Lame Man', '#e8c547');
      npcs.push({ mesh, type: 'npc', static: true });
      return;
    }
    const role = cfg.npc === 'peter' ? 'peter' : 'paul';
    const mesh = window.PaulCharacters.create(role);
    mesh.position.set(cfg.goal.x, mesh.userData.centerY, cfg.goal.z + 1.5);
    window.PaulCharacters.faceDirection(mesh, -1, 0);
    scene.add(mesh);
    npcs.push({ mesh, type: 'npc', static: true });
  }

  function addFloatingLabel(x, y, z, text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.roundRect(0, 8, 256, 48, 8); ctx.fill();
    ctx.fillStyle = color || '#e8c547';
    ctx.font = 'bold 22px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 128, 40);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const spr = new THREE.Sprite(mat);
    spr.position.set(x, y, z);
    spr.scale.set(4, 1, 1);
    scene.add(spr);
    return spr;
  }

  function onKey(e) {
    keys[e.code] = true;
    if (e.code === 'KeyE' && !e.repeat) commitGrab();
    if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyE'].includes(e.code)) e.preventDefault();
  }
  function onKeyUp(e) { keys[e.code] = false; }
  function onPointerLock() {
    pointerLocked = !!(renderer && renderer.domElement && document.pointerLockElement === renderer.domElement);
  }
  function onMouse(e) {
    if (!pointerLocked || frozen || !renderer) return;
    yaw -= e.movementX * 0.002;
    pitch -= e.movementY * 0.0016;
    pitch = Math.max(-0.35, Math.min(0.55, pitch));
  }
  function onResize() {
    if (!container || !camera || !renderer) return;
    const w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function loop() {
    animId = requestAnimationFrame(loop);
    if (!renderer || !scene || !camera) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    if (catchCooldown > 0) catchCooldown -= dt;
    if (!frozen && !gameWon) {
      updatePlayer(dt);
      updateGuards(dt);
      updateCamera();
      checkHide();
      checkCatch();
      checkGoal();
    } else {
      updateCamera();
    }
    renderer.render(scene, camera);
  }

  function updatePlayer(dt) {
    const cfg = LEVELS[currentLevel];
    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const right = new THREE.Vector3(Math.sin(yaw + Math.PI/2), 0, Math.cos(yaw + Math.PI/2));
    const dir = new THREE.Vector3();
    if (keys['KeyW'] || keys['ArrowUp']) dir.add(forward);
    if (keys['KeyS'] || keys['ArrowDown']) dir.sub(forward);
    if (keys['KeyA'] || keys['ArrowLeft']) dir.sub(right);
    if (keys['KeyD'] || keys['ArrowRight']) dir.add(right);
    // Mobile joystick
    if (window.PaulMobile) {
      const m = window.PaulMobile.getMove();
      if (m.active && (Math.abs(m.dx) > 0.08 || Math.abs(m.dy) > 0.08)) {
        // dy negative = forward on screen stick
        dir.add(forward.clone().multiplyScalar(-m.dy));
        dir.add(right.clone().multiplyScalar(m.dx));
      }
      const look = window.PaulMobile.consumeLook();
      if (look.dx || look.dy) {
        yaw -= look.dx;
        pitch -= look.dy;
        pitch = Math.max(-0.35, Math.min(0.55, pitch));
      }
    }

    updateCarry(dt);
    const moving = dir.lengthSq() > 0;
    if (moving) {
      dir.normalize();
      parkPlayer(playerPos.x + dir.x * SPEED * dt, playerPos.z + dir.z * SPEED * dt);
      window.PaulCharacters.faceDirection(playerMesh, dir.x, dir.z);

      animT += dt;
      if (animT > 0.32) {
        animT = 0;
        if (window.PaulSFX) window.PaulSFX.step();
      }
    }
    window.PaulCharacters.updateWalk(playerMesh, dt, moving, SPEED);
  }

  function parkPlayer(x, z) {
    const cfg = LEVELS[currentLevel] || LEVELS[1];
    if (!isFinite(x)) x = cfg.start.x;
    if (!isFinite(z)) z = cfg.start.z;
    playerPos.x = Math.max(1, Math.min(72, x));
    playerPos.z = Math.max(-4.2, Math.min(4.2, z));
    const cy = playerMesh && playerMesh.userData ? playerMesh.userData.centerY : 1.55;
    playerPos.y = isFinite(cy) ? cy : 1.55;
    if (playerMesh) playerMesh.position.copy(playerPos);
  }

  const _jarPos = new THREE.Vector3();

  function jarInRange() {
    if (!carryState || !carryState.prop || !playerPos) return false;
    if (carryState.phase === 'holding' || carryState.phase === 'placing' || carryState.phase === 'reaching') return false;
    if (carryState.prop.parent !== scene) return false;
    carryState.prop.getWorldPosition(_jarPos);
    const dx = playerPos.x - _jarPos.x;
    const dz = playerPos.z - _jarPos.z;
    return Math.hypot(dx, dz) < 2.8;
  }

  function carryContext(pressed) {
    const inRange = jarInRange();
    if (inRange) nearJarUntil = performance.now() + 1000;
    const near = inRange || performance.now() < nearJarUntil;
    return {
      pressed: !!pressed,
      latched: !!pressed && near,
      inRange: inRange,
      playerMesh: playerMesh,
      scene: scene,
      placeAt: placePoint()
    };
  }

  function applyCarryResult(result) {
    if (!result || !carryState) return;
    if (result.event === 'grabbed' && window.PaulSFX) window.PaulSFX.goal();
    if (result.event === 'placed' && window.PaulSFX) window.PaulSFX.click();
    const prop = carryState.prop;
    const inRange = jarInRange();
    if (prop && prop.userData.bodyMat && prop.parent === scene) {
      prop.userData.bodyMat.emissiveIntensity = inRange ? 0.45 : 0.16;
    }
    if (carryLabel) {
      const loose = prop && prop.parent === scene;
      carryLabel.visible = !!loose;
      if (loose) carryLabel.position.set(prop.position.x, prop.position.y + 1.4, prop.position.z);
    }
    if (carryHintEl) {
      carryHintEl.style.display = result.hint ? 'block' : 'none';
      carryHintEl.textContent = result.hint || '';
    }
    if (carryBtn) {
      const show = result.phase === 'holding' || result.phase === 'placing' || result.phase === 'reaching' || inRange;
      carryBtn.style.display = show ? 'block' : 'none';
      carryBtn.textContent = (result.phase === 'holding' || result.phase === 'placing') ? 'Place' : 'Pick up';
    }
  }

  function commitGrab() {
    if (!carryState || !window.PaulCharacters.stepCarry || !playerMesh || frozen || gameWon) return;
    const result = window.PaulCharacters.stepCarry(carryState, 0, carryContext(true));
    applyCarryResult(result);
    if (playerMesh) window.PaulCharacters.updateWalk(playerMesh, 0, false, 0);
  }

  function placePoint() {
    const yawC = playerMesh ? playerMesh.rotation.y : (Math.PI / 2);
    let x = playerPos.x + Math.cos(yawC) * 0.95;
    let z = playerPos.z - Math.sin(yawC) * 0.95;
    x = Math.max(1.2, Math.min(70.5, x));
    z = Math.max(-3.6, Math.min(3.6, z));
    if (goalZone) {
      const dist = Math.hypot(x - goalZone.x, z - goalZone.z);
      if (dist < goalZone.r + 0.6) {
        const side = z >= goalZone.z ? 1 : -1;
        z = Math.max(-3.6, Math.min(3.6, goalZone.z + side * (goalZone.r + 0.75)));
        if (Math.hypot(x - goalZone.x, z - goalZone.z) < goalZone.r + 0.3) {
          x = Math.min(70.5, Math.max(1.2, goalZone.x - goalZone.r - 0.8));
        }
      }
    }
    return { x: x, y: 0, z: z };
  }

  function updateCarry(dt) {
    if (!carryState || !window.PaulCharacters.stepCarry || frozen || gameWon || !playerMesh) return;
    const result = window.PaulCharacters.stepCarry(carryState, dt, carryContext(false));
    applyCarryResult(result);
  }

  function updateCamera() {
    if (!camera || !playerPos || !playerMesh) return;
    if (!isFinite(playerPos.x) || !isFinite(playerPos.z)) return;
    const body = isFinite(playerPos.y) ? playerPos.y : 1.2;
    const close = currentLevel === 1;
    // Level 1 sits close and off the shoulder so the waist, limbs, and face card read in play.
    const dist = (close ? 1.55 : 6.4) + Math.max(0, body - 1.2) * 0.25;
    const height = (close ? 1.22 : 2.35) + body * (close ? 0.05 : 0.38);
    const shoulder = close ? 2.85 : 0.35;
    const offset = new THREE.Vector3(
      -Math.sin(yaw) * dist + Math.cos(yaw) * shoulder,
      height + Math.sin(pitch) * 1.2,
      -Math.cos(yaw) * dist - Math.sin(yaw) * shoulder
    );
    const desired = new THREE.Vector3().copy(playerPos).add(offset);
    if (close) desired.z = Math.max(-4.7, Math.min(4.7, desired.z));
    camera.position.lerp(desired, 0.14);
    camera.lookAt(playerPos.x, playerPos.y + (close ? 0.82 : 0.45), playerPos.z);
    if (playerFill) {
      playerFill.position.set(
        playerPos.x - Math.sin(yaw) * 1.2 + Math.cos(yaw) * 0.8,
        playerPos.y + 1.6,
        playerPos.z - Math.cos(yaw) * 1.2 - Math.sin(yaw) * 0.8
      );
    }
    if (window.PaulCharacters.presentHead) {
      window.PaulCharacters.presentHead(playerMesh, camera);
      npcs.forEach(function (g) {
        if (g.mesh) window.PaulCharacters.presentHead(g.mesh, camera);
      });
    }
  }

  function updateGuards(dt) {
    npcs.forEach(g => {
      if (g.type === 'guard' && !g.static) {
        g.mesh.position.x += g.dir * g.speed * dt;
        if (g.mesh.position.x > g.max) g.dir = -1;
        if (g.mesh.position.x < g.min) g.dir = 1;
        window.PaulCharacters.faceDirection(g.mesh, g.dir, 0);
        window.PaulCharacters.updateWalk(g.mesh, dt, true, g.speed);
      } else if (g.mesh) {
        window.PaulCharacters.updateWalk(g.mesh, dt, false);
      }
    });
  }

  function checkHide() {
    const cfg = LEVELS[currentLevel];
    if (!cfg.hide) return;
    isHidden = false;
    hideZones.forEach(z => {
      if (Math.abs(playerPos.x - z.x) < z.rx && Math.abs(playerPos.z - z.z) < z.rz) isHidden = true;
    });
    window.PaulCharacters.setOpacity(playerMesh, isHidden ? 0.45 : 1);
    if (isHidden && statusEl && !gameWon) {
      statusEl.innerHTML = '<span style="color:#90ee90">Hidden — guards cannot see you</span>';
      if (window.PaulSFX && !playerMesh.userData.wasHidden) window.PaulSFX.hide();
      playerMesh.userData.wasHidden = true;
    } else if (playerMesh) {
      playerMesh.userData.wasHidden = false;
    }
  }

  function checkCatch() {
    const cfg = LEVELS[currentLevel];
    if (!cfg.guards || isHidden || frozen || gameWon || catchCooldown > 0) return;
    for (let i = 0; i < npcs.length; i++) {
      const g = npcs[i];
      if (g.type !== 'guard' || !g.mesh) continue;
      const dx = playerPos.x - g.mesh.position.x;
      const dz = playerPos.z - g.mesh.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist >= 2.0) continue;
      catchCooldown = 1.4;
      lives--;
      if (livesEl) livesEl.textContent = '❤️ ' + lives;
      if (statusEl) statusEl.innerHTML = '<span style="color:#ff6b6b">Caught! −1 life</span>';
      if (window.PaulSFX) window.PaulSFX.catch();
      const len = Math.max(dist, 0.001);
      parkPlayer(playerPos.x + (dx / len) * 3.4, playerPos.z + (dz / len) * 3.4);
      if (Math.hypot(playerPos.x - g.mesh.position.x, playerPos.z - g.mesh.position.z) < 2.45) {
        parkPlayer(Math.max(1, g.mesh.position.x - 3.3), playerPos.z);
      }
      g.mesh.position.x += g.dir * 5;
      if (onLifeLost) onLifeLost(lives);
      if (lives <= 0) {
        frozen = true;
        if (document.pointerLockElement) document.exitPointerLock();
        setTimeout(() => { destroyAdventure3D(); if (onGameOver) onGameOver(); }, 1000);
      }
      break;
    }
  }

  function checkGoal() {
    if (gameWon || frozen) return;
    const dx = playerPos.x - goalZone.x;
    const dz = playerPos.z - goalZone.z;
    if (Math.sqrt(dx*dx + dz*dz) < goalZone.r) {
      frozen = true;
      if (document.pointerLockElement) document.exitPointerLock();
      const cfg = LEVELS[currentLevel];
      if (cfg.interact && onInteract) {
        // Hand control back to story UI for choice/verse
        if (statusEl) statusEl.innerHTML = '<span style="color:#2ecc71">Arrived! Make your choice…</span>';
        if (window.PaulSFX) window.PaulSFX.goal();
        onInteract();
      } else {
        gameWon = true;
        if (statusEl) statusEl.innerHTML = '<span style="color:#2ecc71;font-size:16px">🎉 Objective complete!</span>';
        if (window.PaulSFX) window.PaulSFX.success();
        setTimeout(() => {
          destroyAdventure3D();
          if (onComplete) onComplete();
        }, 1400);
      }
    }
  }

  // Called by main game after player makes the correct choice
  function resumeAndComplete() {
    gameWon = true;
    if (statusEl) statusEl.innerHTML = '<span style="color:#2ecc71">Level complete!</span>';
    setTimeout(() => {
      destroyAdventure3D();
      if (onComplete) onComplete();
    }, 900);
  }

  function destroyAdventure3D() {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousemove', onMouse);
    document.removeEventListener('pointerlockchange', onPointerLock);
    window.removeEventListener('resize', onResize);
    if (document.pointerLockElement) document.exitPointerLock();
    if (renderer) {
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode)
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      renderer = null;
    }
    scene = null; camera = null; playerMesh = null; npcs = [];
    carryState = null; carryLabel = null; carryHintEl = null; carryBtn = null;
    nearJarUntil = 0;
    playerFill = null;
    catchCooldown = 0;
    const ui = document.getElementById('adv3d-ui');
    if (ui) ui.remove();
    if (window.PaulMobile) window.PaulMobile.remove();
    if (window.PaulSFX) try { window.PaulSFX.ambientStop(); } catch(e){}
  }

  window.startAdventure3D = startAdventure3D;
  window.destroyAdventure3D = destroyAdventure3D;
  window.resumeAdventure3DComplete = resumeAndComplete;
})();
