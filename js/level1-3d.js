// ============================================================
// PAUL – Level 1 FULL 3D Third-Person Stealth
// Real 3D world • Third-person camera • Animated character
// WASD move • Mouse look (or always-behind camera) • Hide & escape
// ============================================================

(function () {
  let renderer, scene, camera, clock;
  let player, playerMesh, animTime = 0;
  let guards = [];
  let keys = {};
  let yaw = Math.PI / 2, pitch = 0.25;
  let isHidden = false, gameWon = false, lives = 3;
  let statusEl, livesEl, container;
  let onComplete, onLifeLost, onGameOver;
  let hideMeshes = [], gateMesh;
  let velocity = new THREE.Vector3();
  let direction = new THREE.Vector3();
  let animationId = null;
  let pointerLocked = false;
  let carryState = null, carryLabel = null, carryHintEl = null, carryBtn = null;
  let grabQueued = false;
  let catchCooldown = 0;
  let playerFill = null;
  const JAR_HOME = { x: 60.6, z: 3.25 };

  const SPEED = 8.5;
  const WORLD_LEN = 80;

  function startLevel1_3D(containerId, completeCb, lifeCb, startLives, gameOverCb) {
    // Cleanup previous
    destroy3D();
    container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    lives = startLives || 3;
    gameWon = false;
    isHidden = false;
    catchCooldown = 0;
    playerFill = null;
    yaw = Math.PI / 2;
    pitch = 0.05;
    pointerLocked = false;
    onComplete = completeCb;
    onLifeLost = lifeCb;
    onGameOver = gameOverCb;

    // UI overlay
    const ui = document.createElement('div');
    ui.id = 'td-ui';
    ui.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:10;font-family:Inter,sans-serif;';
    ui.innerHTML = `
      <div id="td-status" style="position:absolute;top:12px;left:12px;background:rgba(0,0,0,0.7);color:#e8d5a3;padding:10px 16px;border-radius:10px;font-size:14px;max-width:420px;border:1px solid rgba(232,197,71,0.3);">
        Click the game to capture mouse • WASD move • Mouse look • Hide in stalls • Reach the green gate
      </div>
      <div id="td-lives" style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.7);color:#ff6b6b;padding:10px 14px;border-radius:10px;font-size:18px;font-weight:bold;">❤️ ${lives}</div>
      <div id="td-carry" style="position:absolute;left:50%;bottom:18px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;">
        <div id="td-carry-hint" style="display:none;background:rgba(0,0,0,0.78);color:#e8d5a3;border:1px solid rgba(232,197,71,0.45);border-radius:10px;padding:8px 14px;font-size:14px;font-weight:600;"></div>
        <button id="td-carry-btn" type="button" style="display:none;pointer-events:auto;background:#c9a227;color:#1a1208;border:none;border-radius:12px;padding:10px 18px;font-weight:700;font-size:15px;cursor:pointer;">Pick up</button>
      </div>
      <div id="td-cross" style="position:absolute;top:50%;left:50%;width:8px;height:8px;margin:-4px;border:2px solid rgba(232,197,71,0.6);border-radius:50%;pointer-events:none;"></div>
    `;
    container.style.position = 'relative';
    container.appendChild(ui);
    statusEl = document.getElementById('td-status');
    livesEl = document.getElementById('td-lives');
    carryHintEl = document.getElementById('td-carry-hint');
    carryBtn = document.getElementById('td-carry-btn');
    grabQueued = false;
    if (carryBtn) {
      carryBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        grabQueued = true;
      });
    }

    // Three.js setup
    const w = container.clientWidth || 960;
    const h = container.clientHeight || 540;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050408);
    scene.fog = new THREE.FogExp2(0x0a0810, 0.018);

    camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 200);
    camera.position.set(0, 4, 8);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.borderRadius = '12px';
    renderer.domElement.style.cursor = 'pointer';
    container.insertBefore(renderer.domElement, ui);

    clock = new THREE.Clock();

    // Lights
    const ambient = new THREE.AmbientLight(0x667088, 0.72);
    playerFill = new THREE.PointLight(0xfff1d6, 0.85, 8);
    playerFill.position.set(2, 3, 0);
    scene.add(playerFill);
    scene.add(ambient);

    // Moon / sky light
    const moon = new THREE.DirectionalLight(0xc4d0e8, 0.85);
    moon.position.set(-20, 40, -10);
    moon.castShadow = true;
    moon.shadow.mapSize.set(1024, 1024);
    moon.shadow.camera.near = 1;
    moon.shadow.camera.far = 100;
    moon.shadow.camera.left = -40;
    moon.shadow.camera.right = 40;
    moon.shadow.camera.top = 40;
    moon.shadow.camera.bottom = -40;
    scene.add(moon);

    // Torch lights along the alley
    const torchPositions = [-25, -10, 5, 20, 32];
    torchPositions.forEach((x, i) => {
      const light = new THREE.PointLight(0xffaa44, 1.7, 18, 1.3);
      light.position.set(x, 3.2, (i % 2 === 0 ? 3.5 : -3.5));
      light.castShadow = true;
      light.shadow.mapSize.set(512, 512);
      scene.add(light);

      // Torch mesh
      const torchGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.2, 8);
      const torchMat = new THREE.MeshStandardMaterial({ color: 0x3a2a18, roughness: 0.9 });
      const torch = new THREE.Mesh(torchGeo, torchMat);
      torch.position.copy(light.position);
      torch.position.y = 2.4;
      torch.castShadow = true;
      scene.add(torch);

      // Flame sprite (simple)
      const flameGeo = new THREE.SphereGeometry(0.25, 8, 8);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xff6622 });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.copy(light.position);
      flame.position.y += 0.4;
      scene.add(flame);
    });

    // Ground
    const groundTex = new THREE.TextureLoader().load('assets/textures/ground.jpg');
    groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
    groundTex.repeat.set(12, 4);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD_LEN * 1.2, 18),
      new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.95, metalness: 0.05 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(WORLD_LEN / 2 - 5, 0, 0);
    ground.receiveShadow = true;
    scene.add(ground);

    // Walls
    const wallTex = new THREE.TextureLoader().load('assets/textures/wall.jpg');
    wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
    wallTex.repeat.set(8, 2);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 });

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(WORLD_LEN, 6, 1.2), wallMat);
    leftWall.position.set(WORLD_LEN / 2 - 5, 3, -6);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(WORLD_LEN, 6, 1.2), wallMat);
    rightWall.position.set(WORLD_LEN / 2 - 5, 3, 6);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Stalls (hide spots) – 3D boxes
    const woodTex = new THREE.TextureLoader().load('assets/textures/wood.jpg');
    woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85 });
    const stallData = [
      { x: 8, z: 3.8, label: 'Stall' },
      { x: 22, z: -3.5, label: 'Cart' },
      { x: 36, z: 3.6, label: 'Doorway' },
      { x: 50, z: -3.4, label: 'Arch' }
    ];
    hideMeshes = [];
    stallData.forEach(s => {
      const stall = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.8, 2.2), woodMat);
      stall.position.set(s.x, 1.4, s.z);
      stall.castShadow = true;
      stall.receiveShadow = true;
      stall.userData = { isHide: true, label: s.label };
      scene.add(stall);
      hideMeshes.push(stall);

      // Canopy
      const canopy = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 0.15, 2.8),
        new THREE.MeshStandardMaterial({ color: 0x5a3a18, roughness: 0.8 })
      );
      canopy.position.set(s.x, 2.9, s.z);
      canopy.castShadow = true;
      scene.add(canopy);
    });

    // Water jar by the gate — pick up with E, place with E
    if (window.PaulCharacters.createWaterJar) {
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
      const jarLight = new THREE.PointLight(0xffb060, 0.7, 7, 1.4);
      jarLight.position.set(JAR_HOME.x, 1.4, JAR_HOME.z);
      scene.add(jarLight);
    }

    // City Gate (win)
    const gateMat = new THREE.MeshStandardMaterial({ color: 0x1a5c2e, emissive: 0x0a3a1a, emissiveIntensity: 0.4 });
    gateMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 5, 4), gateMat);
    gateMesh.position.set(68, 2.5, 0);
    gateMesh.castShadow = true;
    scene.add(gateMesh);
    // Gate glow
    const gateLight = new THREE.PointLight(0x2ecc71, 1.2, 12);
    gateLight.position.set(66, 3, 0);
    scene.add(gateLight);

    // Player – fuller low-poly disciple, a bit larger than the alley NPCs
    playerMesh = window.PaulCharacters.create('disciple', { scale: 1.16 });
    playerMesh.position.set(2, playerMesh.userData.centerY, 0);
    window.PaulCharacters.faceDirection(playerMesh, 1, 0);
    scene.add(playerMesh);

    // Invisible body for collision / logic
    player = {
      position: playerMesh.position,
      mesh: playerMesh
    };

    // Guards
    const guardPositions = [
      { x: 15, z: 0, minX: 10, maxX: 28, speed: 3.2 },
      { x: 40, z: 1, minX: 32, maxX: 48, speed: 2.6 },
      { x: 55, z: -1, minX: 48, maxX: 62, speed: 2.2 }
    ];
    guards = [];
    guardPositions.forEach(g => {
      const gMesh = window.PaulCharacters.create('guard');
      gMesh.position.set(g.x, gMesh.userData.centerY, g.z);
      window.PaulCharacters.faceDirection(gMesh, 1, 0);
      scene.add(gMesh);
      guards.push({
        mesh: gMesh,
        minX: g.minX,
        maxX: g.maxX,
        speed: g.speed,
        dir: 1
      });
    });

    // Input
    keys = {};
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    renderer.domElement.addEventListener('click', () => {
      if (!renderer || !renderer.domElement) return;
      try { renderer.domElement.requestPointerLock(); } catch (e) {}
    });
    document.addEventListener('pointerlockchange', onPointerLock);
    document.addEventListener('mousemove', onMouseMove);

    // Resize
    window.addEventListener('resize', onResize);

    // Start loop
    animationId = requestAnimationFrame(animate);
    statusEl.innerHTML = 'Click the view to look around • <b>WASD</b> move • <b>E</b> pick up the jar by the gate • Hide behind stalls • Reach the <span style="color:#2ecc71">green gate</span>';
  }

  function onKeyDown(e) {
    keys[e.code] = true;
    if (e.code === 'KeyE' && !e.repeat) grabQueued = true;
    if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyE'].includes(e.code)) {
      e.preventDefault();
    }
  }
  function onKeyUp(e) { keys[e.code] = false; }

  function onPointerLock() {
    pointerLocked = !!(renderer && renderer.domElement && document.pointerLockElement === renderer.domElement);
  }

  function onMouseMove(e) {
    if (!pointerLocked || !renderer) return;
    yaw -= e.movementX * 0.0022;
    pitch -= e.movementY * 0.0018;
    pitch = Math.max(-0.4, Math.min(0.65, pitch));
  }

  function onResize() {
    if (!container || !camera || !renderer) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function animate() {
    animationId = requestAnimationFrame(animate);
    if (!renderer || !scene || !camera) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    if (catchCooldown > 0) catchCooldown -= dt;

    if (!gameWon) {
      updatePlayer(dt);
      updateGuards(dt);
      updateCamera();
      checkHide();
      checkCatch();
      checkWin();
    }

    renderer.render(scene, camera);
  }

  function updatePlayer(dt) {
    direction.set(0, 0, 0);
    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const right = new THREE.Vector3(Math.sin(yaw + Math.PI/2), 0, Math.cos(yaw + Math.PI/2));

    if (keys['KeyW'] || keys['ArrowUp']) direction.add(forward);
    if (keys['KeyS'] || keys['ArrowDown']) direction.sub(forward);
    if (keys['KeyA'] || keys['ArrowLeft']) direction.sub(right);
    if (keys['KeyD'] || keys['ArrowRight']) direction.add(right);

    const moving = direction.lengthSq() > 0;
    if (moving) {
      direction.normalize();
      parkPlayer(player.position.x + direction.x * SPEED * dt, player.position.z + direction.z * SPEED * dt);
      const reachingJar = carryState && (carryState.phase === 'reaching' || (grabQueued && jarInRange()));
      if (!reachingJar) window.PaulCharacters.faceDirection(playerMesh, direction.x, direction.z);

      animTime += dt;
      if (animTime > 0.32) {
        animTime = 0;
        if (window.PaulSFX) window.PaulSFX.step();
      }
    }

    // Keep feet on ground
    parkPlayer(player.position.x, player.position.z);
    updateCarry(dt);
    window.PaulCharacters.updateWalk(playerMesh, dt, moving, SPEED);
  }

  function parkPlayer(x, z) {
    if (!player) return;
    if (!isFinite(x)) x = 2;
    if (!isFinite(z)) z = 0;
    player.position.x = Math.max(1, Math.min(WORLD_LEN - 2, x));
    player.position.z = Math.max(-4.5, Math.min(4.5, z));
    const cy = playerMesh && playerMesh.userData ? playerMesh.userData.centerY : 1.55;
    player.position.y = isFinite(cy) ? cy : 1.55;
  }

  function jarInRange() {
    if (!carryState || !carryState.prop || !scene) return false;
    if (carryState.phase === 'holding' || carryState.phase === 'placing') return false;
    if (carryState.prop.parent !== scene) return false;
    const p = carryState.prop.position;
    const dx = player.position.x - p.x;
    const dz = player.position.z - p.z;
    return Math.hypot(dx, dz) < 1.75;
  }

  function placePoint() {
    const yawC = playerMesh.rotation.y;
    let x = player.position.x + Math.sin(yawC) * 1.3;
    let z = player.position.z + Math.cos(yawC) * 1.3;
    x = Math.max(1.2, Math.min(WORLD_LEN - 4, x));
    z = Math.max(-4.0, Math.min(4.0, z));
    return { x: x, y: 0, z: z };
  }

  function updateCarry(dt) {
    if (!carryState || !window.PaulCharacters.stepCarry || gameWon) return;
    const inRange = jarInRange();
    if (carryState.phase === 'reaching' || (grabQueued && inRange)) {
      const p = carryState.prop.position;
      if (carryState.prop.parent === scene) {
        window.PaulCharacters.faceDirection(playerMesh, p.x - player.position.x, p.z - player.position.z);
        const dx = p.x - player.position.x;
        const dz = p.z - player.position.z;
        const dist = Math.hypot(dx, dz) || 1;
        const want = 0.98;
        if (dist > want) {
          const step = Math.min(dist - want, 7 * dt);
          const nx = player.position.x + (dx / dist) * step;
          const nz = player.position.z + (dz / dist) * step;
          const gx = gateMesh ? gateMesh.position.x : 68;
          const gz = gateMesh ? gateMesh.position.z : 0;
          if (Math.hypot(nx - gx, nz - gz) >= 3.85) parkPlayer(nx, nz);
        }
      }
    }
    const pressed = grabQueued;
    grabQueued = false;
    const result = window.PaulCharacters.stepCarry(carryState, dt, {
      pressed: pressed,
      inRange: inRange,
      playerMesh: playerMesh,
      scene: scene,
      placeAt: placePoint()
    });
    if (result.event === 'grabbed' && window.PaulSFX) window.PaulSFX.goal();
    if (result.event === 'placed' && window.PaulSFX) window.PaulSFX.click();
    const prop = carryState.prop;
    if (prop && prop.userData.bodyMat && prop.parent === scene) {
      prop.userData.bodyMat.emissiveIntensity = inRange ? 0.45 : 0.16;
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

  function updateCamera() {
    if (!camera || !player || !playerMesh) return;
    if (!isFinite(player.position.x) || !isFinite(player.position.z)) return;
    const body = isFinite(player.position.y) ? player.position.y : 1.2;
    const dist = 1.55 + Math.max(0, body - 1.2) * 0.25;
    const height = 1.22 + body * 0.05;
    const shoulder = 2.85;
    const offset = new THREE.Vector3(
      -Math.sin(yaw) * dist + Math.cos(yaw) * shoulder,
      height + Math.sin(pitch) * 1.2,
      -Math.cos(yaw) * dist - Math.sin(yaw) * shoulder
    );
    const desired = new THREE.Vector3().copy(player.position).add(offset);
    desired.z = Math.max(-4.7, Math.min(4.7, desired.z));
    camera.position.lerp(desired, 0.14);
    camera.lookAt(player.position.x, player.position.y + 0.82, player.position.z);
    if (playerFill) {
      playerFill.position.set(
        player.position.x - Math.sin(yaw) * 1.2,
        player.position.y + 1.6,
        player.position.z - Math.sin(yaw) * 0.8
      );
    }
    if (window.PaulCharacters.presentHead) {
      window.PaulCharacters.presentHead(playerMesh, camera);
      guards.forEach(function (g) {
        if (g.mesh) window.PaulCharacters.presentHead(g.mesh, camera);
      });
    }
  }

  function updateGuards(dt) {
    guards.forEach(g => {
      g.mesh.position.x += g.dir * g.speed * dt;
      if (g.mesh.position.x > g.maxX) g.dir = -1;
      if (g.mesh.position.x < g.minX) g.dir = 1;
      g.mesh.position.y = g.mesh.userData.centerY;
      window.PaulCharacters.faceDirection(g.mesh, g.dir, 0);
      window.PaulCharacters.updateWalk(g.mesh, dt, true, g.speed);
    });
  }

  function checkHide() {
    isHidden = false;
    const px = player.position.x;
    const pz = player.position.z;
    hideMeshes.forEach(m => {
      const dx = Math.abs(px - m.position.x);
      const dz = Math.abs(pz - m.position.z);
      if (dx < 2.2 && dz < 1.8) {
        isHidden = true;
      }
    });
    if (isHidden) {
      window.PaulCharacters.setOpacity(playerMesh, 0.45);
      if (statusEl && !gameWon) {
        statusEl.innerHTML = '<span style="color:#90ee90">Hidden behind cover — guards cannot see you</span>';
      }
    } else {
      window.PaulCharacters.setOpacity(playerMesh, 1);
      if (statusEl && !gameWon && !statusEl.innerHTML.includes('Caught')) {
        statusEl.innerHTML = 'WASD move • <b>E</b> grabs or places the water jar • Hide in stalls • Reach the <span style="color:#2ecc71">green gate</span>';
      }
    }
  }

  function checkCatch() {
    if (isHidden || gameWon || catchCooldown > 0 || !player) return;
    for (let i = 0; i < guards.length; i++) {
      const g = guards[i];
      if (!g.mesh) continue;
      const dx = player.position.x - g.mesh.position.x;
      const dz = player.position.z - g.mesh.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist >= 2.0) continue;
      catchCooldown = 1.4;
      lives--;
      if (livesEl) livesEl.textContent = '❤️ ' + lives;
      if (statusEl) {
        statusEl.innerHTML = '<span style="color:#ff6b6b">Caught by Saul’s men! −1 life — hide next time!</span>';
      }
      const len = Math.max(dist, 0.001);
      parkPlayer(player.position.x + (dx / len) * 3.4, player.position.z + (dz / len) * 3.4);
      if (Math.hypot(player.position.x - g.mesh.position.x, player.position.z - g.mesh.position.z) < 2.45) {
        parkPlayer(Math.max(1, g.mesh.position.x - 3.3), player.position.z);
      }
      g.mesh.position.x += g.dir * 4;
      if (onLifeLost) onLifeLost(lives);
      if (lives <= 0) {
        gameWon = true;
        if (statusEl) statusEl.innerHTML = 'No lives left…';
        if (document.pointerLockElement) document.exitPointerLock();
        setTimeout(() => {
          destroy3D();
          if (onGameOver) onGameOver();
        }, 1200);
      }
      break;
    }
  }

  function checkWin() {
    if (gameWon) return;
    const dx = player.position.x - gateMesh.position.x;
    const dz = player.position.z - gateMesh.position.z;
    if (Math.sqrt(dx*dx + dz*dz) < 3.5) {
      gameWon = true;
      if (statusEl) {
        statusEl.innerHTML = '<span style="color:#2ecc71;font-size:16px">🎉 You escaped Jerusalem through the city gate!</span>';
      }
      setTimeout(() => {
        destroy3D();
        if (onComplete) onComplete();
      }, 1600);
    }
  }

  function destroy3D() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('pointerlockchange', onPointerLock);
    window.removeEventListener('resize', onResize);
    if (document.pointerLockElement) document.exitPointerLock();
    if (renderer) {
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer = null;
    }
    scene = null;
    camera = null;
    player = null;
    playerMesh = null;
    guards = [];
    carryState = null;
    carryHintEl = null;
    carryBtn = null;
    grabQueued = false;
    playerFill = null;
    catchCooldown = 0;
    const ui = document.getElementById('td-ui');
    if (ui) ui.remove();
  }

  window.startLevel1_3D = startLevel1_3D;
  window.destroyLevel1_3D = destroy3D;
})();
