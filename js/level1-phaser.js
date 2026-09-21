// ============================================================
// Level 1 – Controllable Third-Person Style Stealth
// WASD / Arrow keys to move the Young Disciple
// Camera follows • Animated walk cycle • Hide from guards
// ============================================================

const Level1Config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: 'phaser-container',
  backgroundColor: '#0d0a08',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: { preload, create, update },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

let player, cursors, wasd, guards = [], hideZones = [], gate;
let isHidden = false, animTimer = 0, walkFrame = 0;
let statusText, livesText, gameWon = false, lives = 3;
let onLevelComplete = null, onLifeLost = null;

function startLevel1Phaser(containerId, completeCb, lifeCb, startLives = 3) {
  lives = startLives;
  gameWon = false;
  onLevelComplete = completeCb;
  onLifeLost = lifeCb;
  // Clear previous if any
  if (window.phaserGame) {
    window.phaserGame.destroy(true);
    window.phaserGame = null;
  }
  const cfg = { ...Level1Config, parent: containerId };
  window.phaserGame = new Phaser.Game(cfg);
  return window.phaserGame;
}

function preload() {
  this.load.image('bg', 'assets/sprites/alley_bg.png');
  this.load.image('idle', 'assets/sprites/disciple_idle.png');
  this.load.image('walk1', 'assets/sprites/disciple_walk1.png');
  this.load.image('walk2', 'assets/sprites/disciple_walk2.png');
  this.load.image('guard', 'assets/sprites/guard.png');
}

function create() {
  // World larger than screen for camera follow (third-person feel)
  this.physics.world.setBounds(0, 0, 1920, 720);
  this.cameras.main.setBounds(0, 0, 1920, 720);

  // Background
  const bg = this.add.image(960, 360, 'bg');
  bg.setDisplaySize(1920, 720);

  // Hide zones (stalls, cart, doorway)
  const zoneData = [
    { x: 280, y: 520, w: 100, h: 80, label: 'Stall' },
    { x: 620, y: 520, w: 100, h: 80, label: 'Cart' },
    { x: 980, y: 520, w: 100, h: 80, label: 'Doorway' },
    { x: 1400, y: 520, w: 110, h: 80, label: 'Arch' }
  ];
  hideZones = [];
  zoneData.forEach(z => {
    const zone = this.add.rectangle(z.x, z.y, z.w, z.h, 0x5a4020, 0.45)
      .setStrokeStyle(2, 0xc9a227);
    zone.setData('label', z.label);
    this.physics.add.existing(zone, true); // static
    hideZones.push(zone);
    this.add.text(z.x, z.y - 50, z.label, {
      fontSize: '14px', fontFamily: 'Cinzel, serif', color: '#e8c547'
    }).setOrigin(0.5);
  });

  // Gate (win zone)
  gate = this.add.rectangle(1800, 500, 120, 160, 0x2ecc71, 0.25)
    .setStrokeStyle(3, 0x2ecc71);
  this.physics.add.existing(gate, true);
  this.add.text(1800, 380, 'CITY GATE →', {
    fontSize: '18px', fontFamily: 'Cinzel, serif', color: '#2ecc71', fontStyle: 'bold'
  }).setOrigin(0.5);

  // Player (Young Disciple) – controllable
  player = this.physics.add.sprite(120, 520, 'idle');
  player.setCollideWorldBounds(true);
  player.setScale(0.85);
  player.setDepth(10);
  player.body.setSize(50, 80);
  player.body.setOffset(35, 100);

  // Camera follows player (third-person style follow)
  this.cameras.main.startFollow(player, true, 0.08, 0.08);
  this.cameras.main.setZoom(1.15);

  // Guards that patrol
  const guardPositions = [
    { x: 450, y: 480, minX: 300, maxX: 700, speed: 90 },
    { x: 1100, y: 490, minX: 900, maxX: 1350, speed: 70 },
    { x: 1550, y: 470, minX: 1450, maxX: 1700, speed: 60 }
  ];
  guards = [];
  guardPositions.forEach((g, i) => {
    const guard = this.physics.add.sprite(g.x, g.y, 'guard');
    guard.setScale(0.7);
    guard.setDepth(9);
    guard.setData('minX', g.minX);
    guard.setData('maxX', g.maxX);
    guard.setData('speed', g.speed);
    guard.setData('dir', 1);
    guard.body.setSize(40, 100);
    guards.push(guard);
  });

  // Input
  cursors = this.input.keyboard.createCursorKeys();
  wasd = this.input.keyboard.addKeys('W,A,S,D');

  // UI overlay (fixed to camera)
  statusText = this.add.text(20, 20, 'WASD / Arrows to move • Hide in stalls when guards near', {
    fontSize: '16px', fontFamily: 'Inter, sans-serif', color: '#e8d5a3',
    backgroundColor: '#000000aa', padding: { x: 12, y: 8 }
  }).setScrollFactor(0).setDepth(100);

  livesText = this.add.text(20, 55, '❤️ ' + lives, {
    fontSize: '20px', fontFamily: 'Inter, sans-serif', color: '#ff6b6b',
    backgroundColor: '#000000aa', padding: { x: 10, y: 6 }
  }).setScrollFactor(0).setDepth(100);

  // Instructions popup
  const tip = this.add.text(480, 500, 'Reach the green CITY GATE\nHide behind stalls to avoid Saul’s men!', {
    fontSize: '18px', fontFamily: 'Cinzel, serif', color: '#e8c547',
    align: 'center', backgroundColor: '#1a1208cc', padding: { x: 20, y: 14 }
  }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
  this.time.delayedCall(4000, () => tip.destroy());

  // Collisions / overlaps
  this.physics.add.overlap(player, gate, () => {
    if (!gameWon) {
      gameWon = true;
      statusText.setText('🎉 You escaped Jerusalem! Level Complete!');
      statusText.setColor('#2ecc71');
      player.setVelocity(0, 0);
      this.time.delayedCall(1500, () => {
        if (onLevelComplete) onLevelComplete();
        if (window.phaserGame) {
          window.phaserGame.destroy(true);
          window.phaserGame = null;
        }
      });
    }
  });

  // Guard detection (if close and not hidden)
  guards.forEach(g => {
    this.physics.add.overlap(player, g, () => {
      if (isHidden || gameWon) return;
      // Caught!
      lives--;
      livesText.setText('❤️ ' + lives);
      statusText.setText('Caught by the guard! −1 life  •  Hide next time!');
      statusText.setColor('#ff6b6b');
      // Knockback
      player.x -= 80;
      player.setTint(0xff6666);
      this.time.delayedCall(400, () => player.clearTint());
      if (onLifeLost) onLifeLost(lives);
      if (lives <= 0) {
        statusText.setText('No lives left…');
        this.time.delayedCall(1200, () => {
          if (window.phaserGame) {
            window.phaserGame.destroy(true);
            window.phaserGame = null;
          }
          // Let main game handle game over
          if (window.handlePhaserGameOver) window.handlePhaserGameOver();
        });
      }
    });
  });
}

function update(time, delta) {
  if (gameWon || !player) return;

  const speed = 180;
  let vx = 0, vy = 0;

  if (cursors.left.isDown || wasd.A.isDown) vx = -speed;
  else if (cursors.right.isDown || wasd.D.isDown) vx = speed;
  if (cursors.up.isDown || wasd.W.isDown) vy = -speed * 0.7;
  else if (cursors.down.isDown || wasd.S.isDown) vy = speed * 0.7;

  player.setVelocity(vx, vy);

  // Flip sprite for direction
  if (vx < 0) player.setFlipX(true);
  else if (vx > 0) player.setFlipX(false);

  // Walk animation (simple 2-frame cycle)
  animTimer += delta;
  const moving = Math.abs(vx) > 10 || Math.abs(vy) > 10;
  if (moving) {
    if (animTimer > 180) {
      animTimer = 0;
      walkFrame = 1 - walkFrame;
      player.setTexture(walkFrame === 0 ? 'walk1' : 'walk2');
    }
  } else {
    player.setTexture('idle');
  }

  // Check if inside a hide zone
  isHidden = false;
  hideZones.forEach(zone => {
    if (Phaser.Geom.Rectangle.Contains(
      new Phaser.Geom.Rectangle(zone.x - zone.width/2, zone.y - zone.height/2, zone.width, zone.height),
      player.x, player.y
    )) {
      isHidden = true;
      player.setAlpha(0.55);
      player.setTint(0x88ff88);
    }
  });
  if (!isHidden) {
    player.setAlpha(1);
    if (!player.isTinted) player.clearTint();
  }

  // Patrol guards
  guards.forEach(g => {
    let dir = g.getData('dir');
    const speedG = g.getData('speed');
    g.x += dir * speedG * (delta / 1000);
    if (g.x > g.getData('maxX')) { g.setData('dir', -1); g.setFlipX(true); }
    if (g.x < g.getData('minX')) { g.setData('dir', 1); g.setFlipX(false); }
  });

  // Status when hidden
  if (isHidden && !gameWon) {
    statusText.setText('Hidden… guards cannot see you here. Stay until clear!');
    statusText.setColor('#90ee90');
  } else if (!gameWon && lives > 0 && !statusText.text.includes('Caught')) {
    statusText.setText('WASD / Arrows to move • Hide in stalls when guards near');
    statusText.setColor('#e8d5a3');
  }
}

// Export
window.startLevel1Phaser = startLevel1Phaser;
