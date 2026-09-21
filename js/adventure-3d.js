// ============================================================
// PAUL Adventure 3D Engine – Levels 1–5
// Shared third-person controller + per-level scene builders
// ============================================================

(function () {
  let renderer, scene, camera, clock, animId;
  let playerMesh, playerPos, animTextures = [], animIdx = 0, animT = 0;
  let keys = {}, yaw = 0, pitch = 0.2, pointerLocked = false;
  let npcs = [], hideZones = [], goalZone = null, interactZone = null;
  let isHidden = false, frozen = false, gameWon = false, lives = 3;
  let statusEl, livesEl, container, currentLevel = 1;
  let onComplete, onLifeLost, onGameOver, onInteract;
  let SPEED = 8.5;

  const LEVELS = {
    1: {
      name: 'Jerusalem Escape',
      player: 'disciple',
      walk: true,
      theme: 'night',
      objective: 'Reach the City Gate. Hide behind stalls from guards.',
      start: { x: 2, z: 0 },
      goal: { x: 68, z: 0, r: 3.5, label: 'CITY GATE' },
      guards: true,
      hide: true
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
      <div style="position:absolute;top:50%;left:50%;width:10px;height:10px;margin:-5px;border:2px solid rgba(232,197,71,0.5);border-radius:50%;"></div>
    `;
    container.style.position = 'relative';
    container.appendChild(ui);
    statusEl = document.getElementById('adv-status');
    livesEl = document.getElementById('adv-lives');
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
      if (window.PaulAudio) window.PaulAudio.unlock();
      if (window.PaulSFX) { try { window.PaulSFX.levelStart(); } catch (e) {} }
      if (!isTouch && renderer.domElement.requestPointerLock) {
        try { renderer.domElement.requestPointerLock(); } catch (e) {}
      }
    });
    document.addEventListener('pointerlockchange', () => {
      pointerLocked = document.pointerLockElement === renderer.domElement;
    });
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
      scene.add(new THREE.AmbientLight(0x404050, 0.4));
      const moon = new THREE.DirectionalLight(0x8899bb, 0.3);
      moon.position.set(-15, 35, -8);
      moon.castShadow = true;
      moon.shadow.mapSize.set(1024, 1024);
      scene.add(moon);
      [-20, -5, 12, 28, 45].forEach((x, i) => {
        const pl = new THREE.PointLight(0xffaa44, 1.3, 16, 1.4);
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

  function buildPlayer(cfg) {
    const loader = new THREE.TextureLoader();
    let idlePath, walk1 = null, walk2 = null;
    if (cfg.player === 'disciple') {
      idlePath = 'assets/sprites/disciple_idle.png';
      walk1 = 'assets/sprites/disciple_walk1.png';
      walk2 = 'assets/sprites/disciple_walk2.png';
    } else if (cfg.player === 'ananias') {
      idlePath = 'assets/sprites/ananias_idle.png';
      walk1 = 'assets/sprites/ananias_walk1.png';
      walk2 = 'assets/sprites/ananias_walk2.png';
    } else {
      idlePath = 'assets/sprites/paul_idle.png';
      walk1 = 'assets/sprites/paul_walk1.png';
      walk2 = 'assets/sprites/paul_walk2.png';
    }

    animTextures = [loader.load(idlePath)];
    // Always animate walk when frames exist (Paul + Disciple)
    if (walk1 && walk2) {
      animTextures.push(loader.load(walk1), loader.load(walk2));
    }
    animTextures.forEach(t => {
      t.encoding = THREE.sRGBEncoding;
      t.minFilter = THREE.LinearFilter;
    });

    const mat = new THREE.MeshBasicMaterial({
      map: animTextures[0], transparent: true, side: THREE.DoubleSide, alphaTest: 0.25, depthWrite: true
    });
    playerMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.4), mat);
    playerPos = new THREE.Vector3(cfg.start.x, 1.2, cfg.start.z);
    playerMesh.position.copy(playerPos);
    playerMesh.castShadow = true;
    scene.add(playerMesh);
  }

  function buildGuards(cfg) {
    const loader = new THREE.TextureLoader();
    const gTex = loader.load('assets/sprites/guard.png');
    gTex.encoding = THREE.sRGBEncoding;
    const patrols = [
      { x: 14, z: 0.5, min: 8, max: 24, sp: 3.0 },
      { x: 32, z: -0.5, min: 26, max: 40, sp: 2.5 },
      { x: 50, z: 0.3, min: 44, max: 58, sp: 2.2 }
    ];
    npcs = [];
    patrols.forEach(p => {
      const mat = new THREE.MeshBasicMaterial({ map: gTex, transparent: true, side: THREE.DoubleSide, alphaTest: 0.3 });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 2.0), mat);
      mesh.position.set(p.x, 1.0, p.z);
      scene.add(mesh);
      npcs.push({ mesh, min: p.min, max: p.max, speed: p.sp, dir: 1, type: 'guard' });
    });
  }

  function buildNPC(cfg) {
    const loader = new THREE.TextureLoader();
    if (cfg.npc === 'lame') {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xc9a227, emissive: 0x886600, emissiveIntensity: 0.3 })
      );
      marker.position.set(cfg.goal.x, 0.4, cfg.goal.z);
      scene.add(marker);
      addFloatingLabel(cfg.goal.x, 2.2, cfg.goal.z, 'Lame Man', '#e8c547');
      return;
    }
    // Peter (or other) with idle + walk cycle for living presence
    const idlePath = cfg.npc === 'peter' ? 'assets/sprites/peter_idle.png' : 'assets/sprites/paul_idle.png';
    const w1 = cfg.npc === 'peter' ? 'assets/sprites/peter_walk1.png' : null;
    const w2 = cfg.npc === 'peter' ? 'assets/sprites/peter_walk2.png' : null;
    const texs = [loader.load(idlePath)];
    if (w1 && w2) { texs.push(loader.load(w1), loader.load(w2)); }
    texs.forEach(t => { t.encoding = THREE.sRGBEncoding; t.minFilter = THREE.LinearFilter; });
    const mat = new THREE.MeshBasicMaterial({ map: texs[0], transparent: true, side: THREE.DoubleSide, alphaTest: 0.25 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.4), mat);
    mesh.position.set(cfg.goal.x, 1.2, cfg.goal.z + 1.5);
    scene.add(mesh);
    npcs.push({ mesh, type: 'npc', static: true, animTexs: texs, animT: 0, animI: 0 });
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
  }

  function onKey(e) {
    keys[e.code] = true;
    if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  }
  function onKeyUp(e) { keys[e.code] = false; }
  function onMouse(e) {
    if (!pointerLocked || frozen) return;
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
    if (!renderer) return;
    const dt = Math.min(clock.getDelta(), 0.05);
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
    // Face camera
    if (playerMesh) playerMesh.lookAt(camera.position.x, playerMesh.position.y, camera.position.z);
    npcs.forEach(n => {
      if (n.mesh) n.mesh.lookAt(camera.position.x, n.mesh.position.y, camera.position.z);
    });
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

    if (dir.lengthSq() > 0) {
      dir.normalize();
      playerPos.x += dir.x * SPEED * dt;
      playerPos.z += dir.z * SPEED * dt;
      playerPos.x = Math.max(1, Math.min(72, playerPos.x));
      playerPos.z = Math.max(-4.2, Math.min(4.2, playerPos.z));
      playerMesh.position.copy(playerPos);

      if (animTextures.length > 1) {
        animT += dt;
        if (animT > 0.17) {
          animT = 0;
          animIdx = animIdx === 1 ? 2 : 1;
          playerMesh.material.map = animTextures[animIdx];
          playerMesh.material.needsUpdate = true;
          if (window.PaulSFX) window.PaulSFX.step();
        }
      } else {
        animT += dt;
        if (animT > 0.35) { animT = 0; if (window.PaulSFX) window.PaulSFX.step(); }
      }
    } else if (animTextures.length) {
      if (playerMesh.material.map !== animTextures[0]) {
        playerMesh.material.map = animTextures[0];
        playerMesh.material.needsUpdate = true;
      }
    }
  }

  function updateCamera() {
    const dist = 6.2, height = 3.0;
    const offset = new THREE.Vector3(-Math.sin(yaw) * dist, height + Math.sin(pitch) * 1.8, -Math.cos(yaw) * dist);
    const desired = new THREE.Vector3().copy(playerPos).add(offset);
    camera.position.lerp(desired, 0.12);
    camera.lookAt(playerPos.x, playerPos.y + 1.0, playerPos.z);
  }

  function updateGuards(dt) {
    npcs.forEach(g => {
      if (g.type === 'guard' && !g.static) {
        g.mesh.position.x += g.dir * g.speed * dt;
        if (g.mesh.position.x > g.max) g.dir = -1;
        if (g.mesh.position.x < g.min) g.dir = 1;
      }
      // Living NPC idle-walk cycle (Peter)
      if (g.animTexs && g.animTexs.length > 1 && g.mesh) {
        g.animT = (g.animT || 0) + dt;
        if (g.animT > 0.45) {
          g.animT = 0;
          g.animI = ((g.animI || 0) + 1) % g.animTexs.length;
          g.mesh.material.map = g.animTexs[g.animI];
          g.mesh.material.needsUpdate = true;
        }
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
    playerMesh.material.opacity = isHidden ? 0.5 : 1;
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
    if (!cfg.guards || isHidden || frozen || gameWon) return;
    npcs.forEach(g => {
      if (g.type !== 'guard') return;
      const dx = playerPos.x - g.mesh.position.x;
      const dz = playerPos.z - g.mesh.position.z;
      if (Math.sqrt(dx*dx + dz*dz) < 2.0) {
        lives--;
        if (livesEl) livesEl.textContent = '❤️ ' + lives;
        if (statusEl) statusEl.innerHTML = '<span style="color:#ff6b6b">Caught! −1 life</span>';
        if (window.PaulSFX) window.PaulSFX.catch();
        playerPos.x -= 3.5;
        playerMesh.position.copy(playerPos);
        if (onLifeLost) onLifeLost(lives);
        if (lives <= 0) {
          setTimeout(() => { destroyAdventure3D(); if (onGameOver) onGameOver(); }, 1000);
        }
        g.mesh.position.x += g.dir * 5;
      }
    });
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
    window.removeEventListener('resize', onResize);
    if (document.pointerLockElement) document.exitPointerLock();
    if (renderer) {
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode)
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      renderer = null;
    }
    scene = null; camera = null; playerMesh = null; npcs = [];
    const ui = document.getElementById('adv3d-ui');
    if (ui) ui.remove();
    if (window.PaulMobile) window.PaulMobile.remove();
    if (window.PaulSFX) try { window.PaulSFX.ambientStop(); } catch(e){}
  }

  window.startAdventure3D = startAdventure3D;
  window.destroyAdventure3D = destroyAdventure3D;
  window.resumeAdventure3DComplete = resumeAndComplete;
})();
