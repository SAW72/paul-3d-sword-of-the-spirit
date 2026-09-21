// ============================================================
// PAUL: From Hunted to Hunter – Sword of the Spirit
// Super-polished realistic character edition (ages 8-15)
// ============================================================

const gameState = {
  lives: 3,
  currentLevel: 0,
  score: 0,
  completed: []
};

// ========== Progress save (PAUL-3D-SWORD-2026) ==========
const SAVE_KEY = 'PAUL_3D_SWORD_2026';

function saveProgress() {
  try {
    const data = {
      level: gameState.currentLevel,
      lives: gameState.lives,
      score: gameState.score,
      completed: gameState.completed || [],
      maxUnlocked: Math.max(
        gameState.currentLevel || 1,
        ...((gameState.completed || []).concat([1]))
      ),
      savedAt: Date.now()
    };
    // max unlocked = highest completed + 1 or current
    const maxC = (gameState.completed || []).reduce((a, b) => Math.max(a, b), 0);
    data.maxUnlocked = Math.min(8, Math.max(data.maxUnlocked, maxC + 1, gameState.currentLevel || 1));
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {}
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}

function clearProgress() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}

function continueGame() {
  const data = loadProgress();
  if (!data) {
    alert('No saved journey yet — press Begin the Journey first.');
    return;
  }
  if (window.PaulAudio) window.PaulAudio.unlock();
  gameState.lives = data.lives != null ? data.lives : 3;
  gameState.score = data.score || 0;
  gameState.completed = data.completed || [];
  const lvl = Math.min(8, Math.max(1, data.level || 1));
  gameState.currentLevel = lvl;
  document.getElementById('title-screen').style.display = 'none';
  document.getElementById('game-area').style.display = 'block';
  document.getElementById('progress-container').style.display = 'block';
  loadLevel(lvl);
}



// Character image map
const chars = {
  disciple: 'assets/characters/young_disciple.jpg',
  ananias: 'assets/characters/ananias.jpg',
  saul: 'assets/characters/young_saul.jpg',
  paul: 'assets/characters/paul_mature.jpg',
  peter: 'assets/characters/peter.jpg',
  final: 'assets/characters/paul_final.jpg',
  guard: 'assets/characters/guard.jpg'
};

const scenes = {
  lystra: 'assets/scenes/lystra_lame.jpg',
  armor: 'assets/scenes/armor_of_god.jpg'
};

const levels = [
  {
    id: 1,
    name: "Jerusalem Escape",
    difficulty: "Easy",
    location: "Jerusalem – Alleys & House Church",
    lives: true,
    portrait: 'disciple',
    intro: `You are a young disciple in Jerusalem. Saul’s men are searching street by street. The house church is no longer safe.<br><br>You must sneak through the alleys, hide behind market stalls, and slip out the city gate before they catch you.<br><br><strong>Three lives. No verses needed. Just timing and quick feet.</strong>`,
    type: "stealth"
  },
  {
    id: 2,
    name: "Damascus – Ananias’ Choice",
    difficulty: "Easy",
    location: "Damascus, Straight Street",
    lives: false,
    portrait: 'ananias',
    intro: `You are now <strong>Ananias</strong>. God has spoken clearly:<br><br>“Go to the house of Judas on Straight Street and ask for a man from Tarsus named Saul… Place your hands on him to restore his sight.”<br><br>This is the same man who has been hunting believers like you. Guards still roam the streets.`,
    type: "choice",
    choices: [
      { text: "Trust the Lord and go lay hands on Saul", correct: true, result: "You walk past the guards in perfect peace. You find Saul, lay your hands on him, and scales fall from his eyes. He is baptized. The hunter has become your brother. Level cleared!" },
      { text: "This is too dangerous — I will run and hide", correct: false, result: "You turn away. That night a deep sorrow fills your heart. The Lord does not speak again. You remain in fear… and the story of grace is delayed. Try again." }
    ]
  },
  {
    id: 3,
    name: "Lystra – The Lame Man Walks",
    difficulty: "Medium",
    location: "Lystra (Acts 14)",
    lives: true,
    portrait: 'paul',
    scene: 'lystra',
    intro: `Paul is converted. You are now playing as <strong>Paul</strong>.<br><br>In Lystra you see a man who has been lame from birth. He is listening intently. Faith rises in his heart. You must speak the right words from Acts 14 and call him to stand.`,
    type: "verse",
    question: "Which words do you speak as you look at the lame man?",
    options: [
      { text: "“In the name of Jesus Christ of Nazareth, rise up and walk!” (Acts 3 style)", correct: false },
      { text: "“Stand up on your feet!” (Acts 14:10 – Paul’s exact words)", correct: true },
      { text: "“Be healed according to your faith, brother.”", correct: false },
      { text: "“The gods have come down to us in human form!”", correct: false }
    ],
    success: "The man jumps up and begins to walk! The crowd is amazed… then almost sacrifices to you and Barnabas as Zeus and Hermes. You tear your clothes and point them to the living God. Miracle complete!",
    fail: "The man stays lame. The crowd looks confused and begins to drift away. You lose a life."
  },
  {
    id: 4,
    name: "Malta – The Viper",
    difficulty: "Medium",
    location: "Island of Malta (Acts 28)",
    lives: true,
    portrait: 'paul',
    intro: `Shipwrecked. Cold rain. The locals kindle a fire. As you gather brushwood a viper, driven out by the heat, fastens onto your hand.<br><br>The islanders wait for you to swell up or drop dead. What do you do?`,
    type: "choice",
    choices: [
      { text: "Panic — scream and thrash in terror", correct: false, result: "Fear floods you. The islanders say “This man is a murderer… justice will not let him live.” You lose a life and the moment of testimony is lost." },
      { text: "Shake the snake off into the fire with calm courage (Acts 28:5)", correct: true, result: "You shake the creature off into the fire and suffer no harm. The people are astonished. Later you heal the father of Publius and many others. Courage wins!" },
      { text: "Beg the locals for medicine right away", correct: false, result: "They have none. You still look afraid. Opportunity lost. Lose a life." }
    ]
  },
  {
    id: 5,
    name: "Antioch – Confronting Peter",
    difficulty: "Hard",
    location: "Antioch (Galatians 2:11-14)",
    lives: true,
    portrait: 'peter',
    secondary: 'paul',
    intro: `Peter has been eating freely with Gentile believers. Then men from James arrive… and Peter draws back and separates himself, fearing the circumcision group.<br><br>You are Paul. The gospel of grace is at stake. You must confront him — publicly, but in love.`,
    type: "verse",
    question: "Which statement best captures your public confrontation (Galatians 2:11-14)?",
    options: [
      { text: "“If you, though a Jew, live like a Gentile and not like a Jew, how can you force the Gentiles to live like Jews?”", correct: true },
      { text: "“Peter, you are the rock — I will never oppose you publicly.”", correct: false },
      { text: "“Let’s discuss this privately later so we don’t divide the church.”", correct: false },
      { text: "“The men from James are right — Gentiles must be circumcised.”", correct: false }
    ],
    success: "Peter receives the rebuke. He repents. The truth of the gospel is preserved and the church stays united. You have fought for freedom in Christ!",
    fail: "You stay silent or say the wrong thing. The church begins to split along Jewish/Gentile lines. You lose a life. The gospel of grace is blurred."
  },
  {
    id: 6,
    name: "Ephesus – Real Authority",
    difficulty: "Hard",
    location: "Ephesus (Acts 19 & Ephesians 6)",
    lives: true,
    portrait: 'paul',
    scene: 'armor',
    intro: `Seven sons of Sceva try to cast out a demon using Jesus’ name like a magic formula: “I adjure you by the Jesus whom Paul proclaims.”<br><br>The demon answers: “Jesus I know, and Paul I know, but who are you?” Then leaps on them.<br><br>You must choose the real source of authority.`,
    type: "verse",
    question: "What is the true way to stand against the powers of darkness? (Ephesians 6:10-18)",
    options: [
      { text: "Put on the full armor of God: belt of truth, breastplate of righteousness, gospel of peace, shield of faith, helmet of salvation, sword of the Spirit, praying always", correct: true },
      { text: "Repeat the name of Jesus three times loudly as a formula", correct: false },
      { text: "Use holy water and special Jewish incantations", correct: false },
      { text: "Rely only on personal spiritual feelings and experiences", correct: false }
    ],
    success: "You stand in the full armor of God. The demon flees. Many who practiced magic bring their scrolls and burn them. The word of the Lord spreads widely. True authority wins!",
    fail: "You try a formula. The demon overpowers you. You lose a life and must recover."
  },
  {
    id: 7,
    name: "Rome – The Prison Letters",
    difficulty: "Hard",
    location: "Rome, under house arrest",
    lives: false,
    portrait: 'paul',
    intro: `You are under house arrest in Rome, chained to a soldier, yet free to preach. You dictate letters that will shape the church forever.<br><br>Match each letter to its heart-theme.`,
    type: "match",
    pairs: [
      { letter: "Ephesians", correctTheme: "The Church as the body of Christ & the armor of God" },
      { letter: "Philippians", correctTheme: "Joy in suffering & the mind of Christ" },
      { letter: "Colossians", correctTheme: "The supremacy of Christ over all things" }
    ],
    distractors: [
      "Justification by faith alone",
      "The gifts of the Spirit for the local church",
      "End-times prophecy and the rapture"
    ]
  },
  {
    id: 8,
    name: "Final Stand – Sword of the Spirit",
    difficulty: "Final",
    location: "Rome – Before Nero’s court",
    lives: false,
    portrait: 'final',
    intro: `This is it. Paul’s last stand. You stand before the imperial court. The sentence of death is near.<br><br>You must declare the final words of 2 Timothy 4:6-8 cleanly and boldly.`,
    type: "final",
    question: "Recite the heart of Paul’s last testimony:",
    options: [
      { text: "“I have fought the good fight, I have finished the race, I have kept the faith. Now there is in store for me the crown of righteousness…”", correct: true },
      { text: "“I have planted many churches and written many letters — that is enough.”", correct: false },
      { text: "“Caesar is lord — spare my life and I will be quiet.”", correct: false },
      { text: "“My grace is sufficient for you, for my power is made perfect in weakness.”", correct: false }
    ],
    success: "The words ring out. The court is silent. You have finished the race. The sword of the Spirit has done its work. A crown of righteousness awaits you… and all who have loved His appearing."
  }
];

// DOM helpers
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function updateHUD() {
  const hud = $('#hud');
  const pc = $('#progress-container');
  if (gameState.currentLevel === 0) {
    hud.style.display = 'none';
    if (pc) pc.style.display = 'none';
    return;
  }
  hud.style.display = 'flex';
  if (pc) pc.style.display = 'block';
  $('#lives-display').innerHTML = `❤️ <span>${gameState.lives}</span>`;
  const lvl = levels[gameState.currentLevel - 1];
  $('#level-display').textContent = `Level ${lvl.id}: ${lvl.name}`;
  $('#diff-display').textContent = lvl.difficulty;
  const pct = ((gameState.currentLevel - 1) / levels.length) * 100;
  $('#progress-fill').style.width = `${pct}%`;
}

function showMessage(text, type = 'info') {
  const msg = $('#message');
  msg.innerHTML = text;
  msg.className = type;
  msg.style.display = 'block';
}

function hideMessage() {
  $('#message').style.display = 'none';
}

function loseLife() {
  gameState.lives--;
  updateHUD();
  if (gameState.lives <= 0) {
    setTimeout(() => gameOver(), 1400);
    return true;
  }
  return false;
}


// ========== 3D Adventure launcher for Levels 1-8 ==========

function renderMatchInto(container, lvl) {
  let currentPair = 0;
  const pairs = lvl.pairs;
  const allThemes = pairs.map(p => p.correctTheme).concat(lvl.distractors);
  const shuffled = [...allThemes].sort(() => Math.random() - 0.5);

  function showNext() {
    if (currentPair >= pairs.length) {
      showMessage('All letters matched correctly! The churches receive pure doctrine.', 'success');
      setTimeout(() => {
        if (window.resumeAdventure3DComplete) window.resumeAdventure3DComplete();
        else completeLevel();
      }, 1800);
      return;
    }
    const pair = pairs[currentPair];
    container.innerHTML = `<div class="verse-box">Letter: <strong>${pair.letter}</strong><br>What is its core theme?</div><div class="choices" id="theme-choices-3d"></div>`;
    const choicesDiv = document.getElementById('theme-choices-3d');
    shuffled.forEach(theme => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = theme;
      btn.onclick = () => {
        if (theme === pair.correctTheme) {
          btn.classList.add('correct');
          showMessage('Correct! ' + pair.letter, 'success');
          currentPair++;
          setTimeout(() => { hideMessage(); showNext(); }, 1200);
        } else {
          btn.classList.add('wrong');
          showMessage('Wrong theme — try again.', 'fail');
          setTimeout(() => { hideMessage(); showNext(); }, 1400);
        }
      };
      choicesDiv.appendChild(btn);
    });
  }
  showNext();
}

function launch3DLevel(num) {
  const content = $('#level-content');
  const lvl = levels[num - 1];
  content.innerHTML = `
    <div class="level-header">
      <img src="${chars[lvl.portrait]}" alt="Character" class="char-portrait" />
      <div class="level-meta">
        <h2>Level ${lvl.id}: ${lvl.name}</h2>
        <div class="location">${lvl.location}</div>
        <span class="diff-badge">${lvl.difficulty} • FULL 3D</span>
      </div>
    </div>
    <div class="narrative" style="padding-bottom:8px;">${lvl.intro}</div>
    <div id="phaser-container" style="width:100%;height:520px;border-radius:12px;overflow:hidden;border:2px solid rgba(232,197,71,0.4);margin:8px 0 12px;background:#050408;position:relative;"></div>
    <div id="interact-panel" style="display:none;padding:0 16px 20px;"></div>
    <div style="text-align:center;padding-bottom:12px;">
      <button class="btn secondary" style="padding:8px 18px;font-size:0.85rem;" onclick="skip3DLevel()">Skip 3D (story only)</button>
    </div>
  `;

  setTimeout(() => {
    if (typeof startAdventure3D !== 'function') {
      showMessage('3D engine not loaded – falling back', 'info');
      // fallback to old non-3d
      if (lvl.type === 'stealth') renderStealth(content, lvl);
      else if (lvl.type === 'choice') renderChoice(content, lvl);
      else if (lvl.type === 'verse' || lvl.type === 'final') renderVerse(content, lvl);
      return;
    }
    startAdventure3D(num, 'phaser-container', {
      lives: gameState.lives,
      onComplete: () => {
        showMessage('Level ' + num + ' complete!', 'success');
        setTimeout(() => completeLevel(), 1600);
      },
      onLifeLost: (remaining) => {
        gameState.lives = remaining;
        updateHUD();
      },
      onGameOver: () => {
        gameState.lives = 0;
        updateHUD();
        setTimeout(() => gameOver(), 400);
      },
      onInteract: () => {
        const panel = document.getElementById('interact-panel');
        if (!panel) return;
        panel.style.display = 'block';
        panel.innerHTML = '';
        if (lvl.type === 'choice') {
          renderChoiceInto(panel, lvl);
        } else if (lvl.type === 'verse' || lvl.type === 'final') {
          renderVerseInto(panel, lvl);
        } else if (lvl.type === 'match') {
          renderMatchInto(panel, lvl);
        } else {
          if (window.resumeAdventure3DComplete) window.resumeAdventure3DComplete();
        }
      }
    });
  }, 120);
}

function skip3DLevel() {
  if (window.destroyAdventure3D) window.destroyAdventure3D();
  if (window.destroyLevel1_3D) window.destroyLevel1_3D();
  if (window.phaserGame) { window.phaserGame.destroy(true); window.phaserGame = null; }
  // Fall through to pure narrative for current level
  const num = gameState.currentLevel;
  const lvl = levels[num - 1];
  const content = $('#level-content');
  content.innerHTML = `
    <div class="level-header">
      <img src="${chars[lvl.portrait]}" class="char-portrait" />
      <div class="level-meta">
        <h2>Level ${lvl.id}: ${lvl.name}</h2>
        <div class="location">${lvl.location}</div>
        <span class="diff-badge">${lvl.difficulty}</span>
      </div>
    </div>
    <div class="narrative">${lvl.intro}</div>
  `;
  if (lvl.type === 'choice') renderChoice(content, lvl);
  else if (lvl.type === 'verse' || lvl.type === 'final') renderVerse(content, lvl);
  else if (lvl.type === 'match') renderMatch(content, lvl);
  else if (lvl.type === 'stealth') {
    showMessage('You move carefully and escape the city.', 'success');
    setTimeout(() => completeLevel(), 1600);
  } else if (lvl.type === 'match') renderMatch(content, lvl);
}

function renderChoiceInto(container, lvl) {
  const choicesDiv = document.createElement('div');
  choicesDiv.className = 'choices';
  lvl.choices.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = c.text;
    btn.onclick = () => {
      document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
      if (c.correct) {
        btn.classList.add('correct');
        if (window.PaulSFX) window.PaulSFX.success(); showMessage(c.result, 'success');
        setTimeout(() => {
          if (window.resumeAdventure3DComplete) window.resumeAdventure3DComplete();
          else completeLevel();
        }, 2000);
      } else {
        btn.classList.add('wrong');
        if (window.PaulSFX) window.PaulSFX.fail(); showMessage(c.result, 'fail');
        if (lvl.lives) {
          if (!loseLife()) {
            setTimeout(() => {
              hideMessage();
              document.querySelectorAll('.choice-btn').forEach(b => { b.disabled = false; b.classList.remove('wrong'); });
            }, 2000);
          }
        } else {
          setTimeout(() => {
            hideMessage();
            document.querySelectorAll('.choice-btn').forEach(b => { b.disabled = false; b.classList.remove('wrong'); });
          }, 2000);
        }
      }
    };
    choicesDiv.appendChild(btn);
  });
  container.appendChild(choicesDiv);
}

function renderVerseInto(container, lvl) {
  container.innerHTML += `<div class="verse-box">${lvl.question}</div>`;
  const choicesDiv = document.createElement('div');
  choicesDiv.className = 'choices';
  const opts = [...lvl.options].sort(() => Math.random() - 0.5);
  opts.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = opt.text;
    btn.onclick = () => {
      document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
      if (opt.correct) {
        btn.classList.add('correct');
        if (window.PaulSFX) window.PaulSFX.success(); showMessage(lvl.success, 'success');
        setTimeout(() => {
          if (window.resumeAdventure3DComplete) window.resumeAdventure3DComplete();
          else completeLevel();
        }, 2200);
      } else {
        btn.classList.add('wrong');
        if (window.PaulSFX) window.PaulSFX.fail(); showMessage(lvl.fail || 'Incorrect.', 'fail');
        if (lvl.lives !== false) {
          if (!loseLife()) {
            setTimeout(() => { hideMessage(); loadLevel(gameState.currentLevel); }, 1800);
          }
        } else {
          setTimeout(() => { hideMessage(); loadLevel(gameState.currentLevel); }, 1800);
        }
      }
    };
    choicesDiv.appendChild(btn);
  });
  container.appendChild(choicesDiv);
}


function startGame() {
  if (window.PaulAudio) window.PaulAudio.unlock();
  gameState.lives = 3;
  gameState.currentLevel = 1;
  gameState.completed = [];
  gameState.score = 0;
  $('#title-screen').style.display = 'none';
  $('#game-area').style.display = 'block';
  $('#progress-container').style.display = 'block';
  loadLevel(1);
}

function loadLevel(num) {
  if (window.currentStealthInterval) {
    clearInterval(window.currentStealthInterval);
    window.currentStealthInterval = null;
  }
  if (window.destroyAdventure3D) window.destroyAdventure3D();
  if (window.destroyLevel1_3D) window.destroyLevel1_3D();
  if (window.phaserGame) { try { window.phaserGame.destroy(true); } catch(e){} window.phaserGame = null; }

  gameState.currentLevel = num;
  hideMessage();
  updateHUD();
  try { saveProgress(); } catch(e) {}
  const lvl = levels[num - 1];
  const content = $('#level-content');
  content.innerHTML = '';
  content.classList.add('active');

  // Levels 1–8 → full 3D third-person adventure
  if (num >= 1 && num <= 8) {
    launch3DLevel(num);
    return;
  }

  // (all story levels now 3D; fallback below unused for 1-8)
  let headerHTML = `
    <div class="level-header">
      <img src="${chars[lvl.portrait]}" alt="Character" class="char-portrait" />
      <div class="level-meta">
        <h2>Level ${lvl.id}: ${lvl.name}</h2>
        <div class="location">${lvl.location}</div>
        <span class="diff-badge">${lvl.difficulty}</span>
      </div>
    </div>
  `;
  if (lvl.scene) {
    headerHTML += `<img src="${scenes[lvl.scene]}" alt="Scene" class="scene-image" />`;
  }
  headerHTML += `<div class="narrative">${lvl.intro}</div>`;
  content.innerHTML = headerHTML;

  if (lvl.type === 'stealth') renderStealth(content, lvl);
  else if (lvl.type === 'choice') renderChoice(content, lvl);
  else if (lvl.type === 'verse' || lvl.type === 'final') renderVerse(content, lvl);
  else if (lvl.type === 'match') renderMatch(content, lvl);
}

function renderStealth(container, lvl) {
  // FULL 3D third-person controllable Level 1
  container.innerHTML += `
    <div style="padding:8px 16px;color:#c9b37a;font-size:0.95rem;text-align:center;line-height:1.5;">
      <strong style="color:var(--gold);">FULL 3D MODE</strong> — Click the view, then use <b>WASD</b> to move & mouse to look.<br>
      Hide behind the wooden stalls when guards approach. Reach the glowing green City Gate!
    </div>
    <div id="phaser-container" style="width:100%;height:560px;border-radius:12px;overflow:hidden;border:2px solid rgba(232,197,71,0.45);margin:0 0 10px;background:#050408;position:relative;"></div>
    <div style="text-align:center;padding-bottom:16px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
      <button class="btn secondary" style="padding:10px 20px;font-size:0.85rem;" onclick="skipStealth()">Skip (story only)</button>
      <button class="btn secondary" style="padding:10px 20px;font-size:0.85rem;" onclick="switchTo2D()">Switch to 2D Phaser version</button>
    </div>
  `;

  setTimeout(() => {
    if (typeof startLevel1_3D === 'function') {
      startLevel1_3D('phaser-container',
        () => {
          showMessage("You escaped through the city gate under cover of night! Level Complete!", "success");
          setTimeout(() => completeLevel(), 1800);
        },
        (remaining) => {
          gameState.lives = remaining;
          updateHUD();
        },
        gameState.lives,
        () => {
          gameState.lives = 0;
          updateHUD();
          setTimeout(() => gameOver(), 400);
        }
      );
    } else {
      // fallback
      showMessage("3D engine loading… try the 2D version", "info");
    }
  }, 150);

  window.handlePhaserGameOver = () => {
    gameState.lives = 0;
    updateHUD();
    setTimeout(() => gameOver(), 500);
  };
}

function switchTo2D() {
  if (window.destroyLevel1_3D) window.destroyLevel1_3D();
  const container = document.getElementById('phaser-container');
  if (!container) return;
  container.innerHTML = '';
  if (typeof startLevel1Phaser === 'function') {
    startLevel1Phaser('phaser-container',
      () => {
        showMessage("Escaped! Level Complete!", "success");
        setTimeout(() => completeLevel(), 1600);
      },
      (remaining) => { gameState.lives = remaining; updateHUD(); },
      gameState.lives
    );
  }
}

function skipStealth() {
  if (window.destroyLevel1_3D) window.destroyLevel1_3D();
  if (window.phaserGame) { window.phaserGame.destroy(true); window.phaserGame = null; }
  if (window.currentStealthInterval) clearInterval(window.currentStealthInterval);
  showMessage("You move carefully from shadow to shadow… and make it out the gate just as torches round the corner.", "success");
  setTimeout(() => completeLevel(), 1800);
}

function renderChoice(container, lvl) {
  const choicesDiv = document.createElement('div');
  choicesDiv.className = 'choices';
  lvl.choices.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = c.text;
    btn.onclick = () => {
      $$('.choice-btn').forEach(b => b.disabled = true);
      if (c.correct) {
        btn.classList.add('correct');
        showMessage(c.result, "success");
        setTimeout(() => completeLevel(), 2600);
      } else {
        btn.classList.add('wrong');
        showMessage(c.result, "fail");
        if (lvl.lives) {
          if (!loseLife()) {
            setTimeout(() => {
              hideMessage();
              $$('.choice-btn').forEach(b => { b.disabled = false; b.classList.remove('wrong'); });
            }, 2200);
          }
        } else {
          setTimeout(() => {
            hideMessage();
            $$('.choice-btn').forEach(b => { b.disabled = false; b.classList.remove('wrong'); });
          }, 2200);
        }
      }
    };
    choicesDiv.appendChild(btn);
  });
  container.appendChild(choicesDiv);
}

function renderVerse(container, lvl) {
  container.innerHTML += `<div class="verse-box">${lvl.question}</div>`;
  const choicesDiv = document.createElement('div');
  choicesDiv.className = 'choices';
  const opts = [...lvl.options].sort(() => Math.random() - 0.5);
  opts.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = opt.text;
    btn.onclick = () => {
      $$('.choice-btn').forEach(b => b.disabled = true);
      if (opt.correct) {
        btn.classList.add('correct');
        showMessage(lvl.success, "success");
        setTimeout(() => completeLevel(), 2800);
      } else {
        btn.classList.add('wrong');
        showMessage(lvl.fail || "Incorrect. The moment is lost.", "fail");
        if (lvl.lives !== false) {
          if (!loseLife()) {
            setTimeout(() => { hideMessage(); loadLevel(gameState.currentLevel); }, 2000);
          }
        } else {
          setTimeout(() => { hideMessage(); loadLevel(gameState.currentLevel); }, 2000);
        }
      }
    };
    choicesDiv.appendChild(btn);
  });
  container.appendChild(choicesDiv);
}

function renderMatch(container, lvl) {
  let currentPair = 0;
  const pairs = lvl.pairs;
  const allThemes = pairs.map(p => p.correctTheme).concat(lvl.distractors);
  const shuffled = [...allThemes].sort(() => Math.random() - 0.5);

  function showNextPair() {
    if (currentPair >= pairs.length) {
      showMessage("All letters matched correctly! The churches receive pure doctrine.", "success");
      setTimeout(() => completeLevel(), 2200);
      return;
    }
    const pair = pairs[currentPair];
    // Rebuild keeping header
    const content = $('#level-content');
    content.innerHTML = `
      <div class="level-header">
        <img src="${chars.paul}" alt="Paul" class="char-portrait" />
        <div class="level-meta">
          <h2>Level ${lvl.id}: ${lvl.name}</h2>
          <div class="location">${lvl.location}</div>
          <span class="diff-badge">${lvl.difficulty}</span>
        </div>
      </div>
      <div class="narrative">${lvl.intro}</div>
      <div class="verse-box">Letter: <strong>${pair.letter}</strong><br>What is its core theme?</div>
      <div class="choices" id="theme-choices"></div>
    `;
    const choicesDiv = $('#theme-choices');
    shuffled.forEach(theme => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = theme;
      btn.onclick = () => {
        if (theme === pair.correctTheme) {
          btn.classList.add('correct');
          showMessage(`Correct! ${pair.letter} → ${theme}`, "success");
          currentPair++;
          setTimeout(() => { hideMessage(); showNextPair(); }, 1400);
        } else {
          btn.classList.add('wrong');
          showMessage("Wrong theme — the church gets confused doctrine. Try again.", "fail");
          setTimeout(() => { hideMessage(); showNextPair(); }, 1500);
        }
      };
      choicesDiv.appendChild(btn);
    });
  }
  showNextPair();
}

function completeLevel() {
  if (window.destroyAdventure3D) window.destroyAdventure3D();
  if (window.destroyLevel1_3D) window.destroyLevel1_3D();
  if (window.currentStealthInterval) {
    clearInterval(window.currentStealthInterval);
    window.currentStealthInterval = null;
  }
  gameState.completed.push(gameState.currentLevel);
  try { saveProgress(); } catch(e) {}
  // Achievements
  if (window.PaulAchievements) {
    const def = window.PaulAchievements.unlockForLevel(gameState.currentLevel);
    if (def) window.PaulAchievements.showToast(def);
    const specials = window.PaulAchievements.checkSpecials({
      saved: true,
      fullLives: gameState.lives >= 3,
      allEight: gameState.currentLevel >= (levels && levels.length ? levels.length : 8)
    });
    specials.forEach(d => window.PaulAchievements.showToast(d));
  }
  if (window.PaulVFX) {
    try { window.PaulVFX.confetti({ count: 50, duration: 2000 }); } catch(e) {}
  }
  gameState.score += 100 * gameState.currentLevel;
  if (gameState.currentLevel >= levels.length) {
    victory();
  } else {
    showMessage(`Level ${gameState.currentLevel} complete! +${100 * gameState.currentLevel} faith points`, "success");
    setTimeout(() => {
      hideMessage();
      loadLevel(gameState.currentLevel + 1);
    }, 1800);
  }
}

function victory() {
  if (window.PaulVFX) { try { window.PaulVFX.confetti({ count: 120, duration: 4000 }); } catch(e) {} }
  if (window.PaulAchievements) {
    window.PaulAchievements.checkSpecials({ allEight: true }).forEach(d => window.PaulAchievements.showToast(d));
  }
  $('#game-area').style.display = 'none';
  $('#hud').style.display = 'none';
  $('#progress-container').style.display = 'none';
  const v = $('#victory-screen');
  v.style.display = 'block';
  v.innerHTML = `
    <img src="${chars.final}" alt="Paul crowned" class="final-portrait" />
    <h1>YOU FINISHED THE RACE</h1>
    <p class="final-quote">
      “I have fought the good fight, I have finished the race, I have kept the faith.<br>
      Now there is in store for me the crown of righteousness…”
      <br><br>— 2 Timothy 4:7-8
    </p>
    <p style="margin:16px 0;color:var(--gold);font-size:1.05rem;">From hunted disciple to the one who heals, confronts, writes, and stands.<br>The same hands that once dragged believers now build the church.</p>
    <p style="color:#c9b37a;margin-bottom:12px;">Final Score: <strong>${gameState.score}</strong> faith points • Lives left: ${gameState.lives}</p>
    <p style="color:var(--gold);margin-bottom:20px;">Faith Stickers: <strong>${window.PaulAchievements ? window.PaulAchievements.count() : 0}</strong> / 12</p>
    <button class="btn" onclick="location.reload()">Play Again</button>
    <button class="btn secondary" style="margin-left:8px;" onclick="showAchievements()">View Stickers</button>
  `;
}

function gameOver() {
  $('#game-area').style.display = 'none';
  $('#hud').style.display = 'none';
  $('#progress-container').style.display = 'none';
  const go = $('#gameover-screen');
  go.style.display = 'block';
  go.innerHTML = `
    <h1 style="color:#ff6b6b;font-family:Cinzel,serif;margin-bottom:16px;">The Road Ended… For Now</h1>
    <p style="font-size:1.15rem;margin-bottom:20px;">You have no lives left. But the story of grace is never truly over.</p>
    <p style="color:#c9b37a;margin-bottom:28px;font-style:italic;">“My grace is sufficient for you.”</p>
    <button class="btn" onclick="location.reload()">Rise Again</button>
  `;
}

function showCharacters() {
  const names = [
    { key: 'disciple', name: 'Young Disciple' },
    { key: 'ananias', name: 'Ananias' },
    { key: 'saul', name: 'Young Saul' },
    { key: 'paul', name: 'Paul the Apostle' },
    { key: 'peter', name: 'Peter' },
    { key: 'final', name: 'Paul – Final Stand' },
    { key: 'guard', name: 'Saul’s Guard' }
  ];
  let html = '<div style="padding:20px;text-align:center;"><h2 style="font-family:Cinzel,serif;color:var(--gold);margin-bottom:16px;">Characters</h2><div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;">';
  names.forEach(c => {
    html += `<div style="width:100px;"><img src="${chars[c.key]}" style="width:100px;height:120px;object-fit:cover;border-radius:10px;border:2px solid var(--gold);"><div style="font-size:0.8rem;margin-top:6px;color:#e8d5a3;">${c.name}</div></div>`;
  });
  html += '</div><br><button class="btn secondary" onclick="document.getElementById(\'char-modal\').remove()">Close</button></div>';
  const modal = document.createElement('div');
  modal.id = 'char-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;';
  modal.innerHTML = `<div style="background:#1a140f;border:2px solid var(--gold);border-radius:16px;max-width:600px;width:100%;max-height:90vh;overflow:auto;">${html}</div>`;
  document.body.appendChild(modal);
}


function showLevelSelect() {
  if (window.PaulAudio) window.PaulAudio.unlock();
  if (window.PaulAchievements) {
    const got = window.PaulAchievements.checkSpecials({ levelSelect: true });
    got.forEach(d => window.PaulAchievements.showToast(d));
  }
  const names = [
    '1 · Jerusalem Escape',
    '2 · Damascus (Ananias)',
    '3 · Lystra Miracle',
    '4 · Malta Viper',
    '5 · Antioch (Peter)',
    '6 · Ephesus Armor',
    '7 · Rome Letters',
    '8 · Final Stand'
  ];
  let html = '<div style="padding:20px;text-align:center;"><h2 style="font-family:Cinzel,serif;color:var(--gold);margin-bottom:8px;">Level Select</h2>';
  html += '<p style="color:#c9b37a;font-size:0.9rem;margin-bottom:16px;">Jump to any stage (debug / practice)</p><div style="display:flex;flex-direction:column;gap:8px;max-width:360px;margin:0 auto;">';
  names.forEach((n, i) => {
    html += `<button class="choice-btn" style="text-align:center;" onclick="jumpToLevel(${i+1})">${n}</button>`;
  });
  html += '</div><br><button class="btn secondary" onclick="document.getElementById(\'level-modal\').remove()">Close</button></div>';
  const modal = document.createElement('div');
  modal.id = 'level-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;';
  modal.innerHTML = `<div style="background:#1a140f;border:2px solid var(--gold);border-radius:16px;max-width:420px;width:100%;max-height:90vh;overflow:auto;">${html}</div>`;
  document.body.appendChild(modal);
}

function jumpToLevel(num) {
  const m = document.getElementById('level-modal');
  if (m) m.remove();
  gameState.lives = 3;
  gameState.score = 0;
  gameState.completed = [];
  gameState.currentLevel = num;
  document.getElementById('title-screen').style.display = 'none';
  document.getElementById('game-area').style.display = 'block';
  document.getElementById('progress-container').style.display = 'block';
  if (window.PaulAudio) window.PaulAudio.unlock();
  loadLevel(num);
}


window.startGame = startGame;
window.showLevelSelect = showLevelSelect;

function showSettings() {
  const preset = (window.PaulAudio && window.PaulAudio.getVolumePreset) ? window.PaulAudio.getVolumePreset() : 'normal';
  const data = loadProgress();
  let saveInfo = data ? `Saved: Level ${data.level} · Score ${data.score} · Lives ${data.lives}` : 'No save yet';
  const modal = document.createElement('div');
  modal.id = 'settings-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;';
  modal.innerHTML = `<div style="background:#1a140f;border:2px solid var(--gold);border-radius:16px;max-width:400px;width:100%;padding:24px;text-align:center;">
    <h2 style="font-family:Cinzel,serif;color:var(--gold);margin-bottom:12px;">Settings</h2>
    <p style="color:#c9b37a;font-size:0.9rem;margin-bottom:16px;">${saveInfo}</p>
    <p style="color:var(--gold);margin-bottom:8px;">Music / SFX volume</p>
    <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:20px;">
      <button class="choice-btn" onclick="window.PaulAudio&&PaulAudio.setVolumePreset('mute');if(window.PaulSFX)PaulSFX.click();">Mute</button>
      <button class="choice-btn" onclick="window.PaulAudio&&PaulAudio.setVolumePreset('low');if(window.PaulSFX)PaulSFX.click();">Low</button>
      <button class="choice-btn" onclick="window.PaulAudio&&PaulAudio.setVolumePreset('normal');if(window.PaulSFX)PaulSFX.click();">Normal</button>
      <button class="choice-btn" onclick="window.PaulAudio&&PaulAudio.setVolumePreset('high');if(window.PaulSFX)PaulSFX.click();">High</button>
    </div>
    <button class="btn secondary" style="margin:4px;" onclick="if(confirm('Clear saved progress?')){clearProgress();alert('Progress cleared.');}">Clear Save</button>
    <br><br>
    <button class="btn secondary" onclick="document.getElementById('settings-modal').remove()">Close</button>
  </div>`;
  document.body.appendChild(modal);
}
window.showSettings = showSettings;

window.continueGame = continueGame;
window.clearProgress = clearProgress;
window.saveProgress = saveProgress;
window.jumpToLevel = jumpToLevel;
window.skip3DLevel = skip3DLevel;
window.skipStealth = skipStealth;
window.showCharacters = showCharacters;

document.addEventListener('DOMContentLoaded', () => {
  updateHUD();
});

function showAchievements() {
  if (window.PaulAchievements) window.PaulAchievements.showBoard();
}
window.showAchievements = showAchievements;
