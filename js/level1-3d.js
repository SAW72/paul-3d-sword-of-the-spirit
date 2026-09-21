// ============================================================
// PAUL – Level 1 FULL 3D Third-Person Stealth
// Real 3D world • Third-person camera • Animated character
// WASD move • Mouse look (or always-behind camera) • Hide & escape
// ============================================================

(function () {
  let renderer, scene, camera, clock;
  let player, playerMesh, animTextures = [], currentFrame = 0, animTime = 0;
  let guards = [];
  let keys = {};
  let yaw = 0, pitch = 0.25;
  let isHidden = false, gameWon = false, lives = 3;
  let statusEl, livesEl, container;
  let onComplete, onLifeLost, onGameOver;
  let hideMeshes = [], gateMesh;
  let velocity = new THREE.Vector3();
  let direction = new THREE.Vector3();
  let animationId = null;
  let pointerLocked = false;

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
      <div id="td-cross" style="position:absolute;top:50%;left:50%;width:8px;height:8px;margin:-4px;border:2px solid rgba(232,197,71,0.6);border-radius:50%;pointer-events:none;"></div>
    `;
    container.style.position = 'relative';
    container.appendChild(ui);
    statusEl = document.getElementById('td-status');
    livesEl = document.getElementById('td-lives');

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
    const ambient = new THREE.AmbientLight(0x404050, 0.45);
    scene.add(ambient);

    // Moon / sky light
    const moon = new THREE.DirectionalLight(0x8899bb, 0.35);
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
      const light = new THREE.PointLight(0xffaa44, 1.4, 18, 1.5);
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

    // Player character – animated billboard (realistic look)
    const loader = new THREE.TextureLoader();
    animTextures = [
      loader.load('assets/sprites/disciple_idle.png'),
      loader.load('assets/sprites/disciple_walk1.png'),
      loader.load('assets/sprites/disciple_walk2.png')
    ];
    animTextures.forEach(t => {
      t.encoding = THREE.sRGBEncoding;
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
    });

    const planeGeo = new THREE.PlaneGeometry(1.4, 2.3);
    const planeMat = new THREE.MeshBasicMaterial({
      map: animTextures[0],
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
      alphaTest: 0.3
    });
    playerMesh = new THREE.Mesh(planeGeo, planeMat);
    playerMesh.position.set(2, 1.15, 0);
    playerMesh.castShadow = true;
    scene.add(playerMesh);

    // Invisible body for collision / logic
    player = {
      position: playerMesh.position,
      mesh: playerMesh
    };

    // Guards
    const guardTex = loader.load('assets/sprites/guard.png');
    guardTex.encoding = THREE.sRGBEncoding;
    const guardPositions = [
      { x: 15, z: 0, minX: 10, maxX: 28, speed: 3.2 },
      { x: 40, z: 1, minX: 32, maxX: 48, speed: 2.6 },
      { x: 55, z: -1, minX: 48, maxX: 62, speed: 2.2 }
    ];
    guards = [];
    guardPositions.forEach(g => {
      const gMat = new THREE.MeshBasicMaterial({ map: guardTex, transparent: true, side: THREE.DoubleSide, alphaTest: 0.3 });
      const gMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.0), gMat);
      gMesh.position.set(g.x, 1.0, g.z);
      gMesh.castShadow = true;
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
      renderer.domElement.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', () => {
      pointerLocked = document.pointerLockElement === renderer.domElement;
    });
    document.addEventListener('mousemove', onMouseMove);

    // Resize
    window.addEventListener('resize', onResize);

    // Start loop
    animationId = requestAnimationFrame(animate);
    statusEl.innerHTML = 'Click the view to look around • <b>WASD</b> move • Hide behind stalls • Reach the <span style="color:#2ecc71">green gate</span>';
  }

  function onKeyDown(e) {
    keys[e.code] = true;
    if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
      e.preventDefault();
    }
  }
  function onKeyUp(e) { keys[e.code] = false; }

  function onMouseMove(e) {
    if (!pointerLocked) return;
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

    if (!gameWon) {
      updatePlayer(dt);
      updateGuards(dt);
      updateCamera();
      checkHide();
      checkCatch();
      checkWin();
    }

    // Make character billboards face roughly the camera (or forward)
    if (playerMesh) {
      // Soft face camera for better look
      playerMesh.lookAt(camera.position.x, playerMesh.position.y, camera.position.z);
    }
    guards.forEach(g => {
      g.mesh.lookAt(camera.position.x, g.mesh.position.y, camera.position.z);
    });

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

    if (direction.lengthSq() > 0) {
      direction.normalize();
      player.position.x += direction.x * SPEED * dt;
      player.position.z += direction.z * SPEED * dt;

      // Clamp inside alley
      player.position.x = Math.max(1, Math.min(WORLD_LEN - 2, player.position.x));
      player.position.z = Math.max(-4.5, Math.min(4.5, player.position.z));

      // Walk animation
      animTime += dt;
      if (animTime > 0.18) {
        animTime = 0;
        currentFrame = currentFrame === 1 ? 2 : 1;
        playerMesh.material.map = animTextures[currentFrame];
        playerMesh.material.needsUpdate = true;
      }
    } else {
      // Idle
      if (playerMesh.material.map !== animTextures[0]) {
        playerMesh.material.map = animTextures[0];
        playerMesh.material.needsUpdate = true;
      }
    }

    // Keep feet on ground
    player.position.y = 1.15;
  }

  function updateCamera() {
    // Third-person camera behind player
    const dist = 6.5;
    const height = 3.2;
    const offset = new THREE.Vector3(
      -Math.sin(yaw) * dist,
      height + Math.sin(pitch) * 2,
      -Math.cos(yaw) * dist
    );
    const target = new THREE.Vector3().copy(player.position).add(new THREE.Vector3(0, 1.2, 0));
    const desired = new THREE.Vector3().copy(player.position).add(offset);
    camera.position.lerp(desired, 0.12);
    camera.lookAt(target);
  }

  function updateGuards(dt) {
    guards.forEach(g => {
      g.mesh.position.x += g.dir * g.speed * dt;
      if (g.mesh.position.x > g.maxX) g.dir = -1;
      if (g.mesh.position.x < g.minX) g.dir = 1;
      g.mesh.position.y = 1.0;
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
      playerMesh.material.opacity = 0.55;
      playerMesh.material.transparent = true;
      if (statusEl && !gameWon) {
        statusEl.innerHTML = '<span style="color:#90ee90">Hidden behind cover — guards cannot see you</span>';
      }
    } else {
      playerMesh.material.opacity = 1;
      if (statusEl && !gameWon && !statusEl.innerHTML.includes('Caught')) {
        statusEl.innerHTML = 'WASD move • Mouse look • Hide in stalls • Reach the <span style="color:#2ecc71">green gate</span>';
      }
    }
  }

  function checkCatch() {
    if (isHidden || gameWon) return;
    const px = player.position.x;
    const pz = player.position.z;
    guards.forEach(g => {
      const dx = px - g.mesh.position.x;
      const dz = pz - g.mesh.position.z;
      const dist = Math.sqrt(dx*dx + dz*dz);
      if (dist < 2.0) {
        // Caught
        lives--;
        if (livesEl) livesEl.textContent = '❤️ ' + lives;
        if (statusEl) {
          statusEl.innerHTML = '<span style="color:#ff6b6b">Caught by Saul’s men! −1 life — hide next time!</span>';
        }
        // Knockback
        player.position.x -= 3;
        if (onLifeLost) onLifeLost(lives);
        if (lives <= 0) {
          if (statusEl) statusEl.innerHTML = 'No lives left…';
          setTimeout(() => {
            destroy3D();
            if (onGameOver) onGameOver();
          }, 1200);
        }
        // Brief invuln by moving
        g.mesh.position.x += g.dir * 4;
      }
    });
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
    const ui = document.getElementById('td-ui');
    if (ui) ui.remove();
  }

  window.startLevel1_3D = startLevel1_3D;
  window.destroyLevel1_3D = destroy3D;
})();
