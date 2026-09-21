// PAUL-3D-SWORD-2026 — Kid-friendly achievements / stickers
(function () {
  const KEY = 'PAUL_3D_SWORD_2026_ACH';

  const DEFS = [
    { id: 'escape', name: 'Night Runner', emoji: '🏃', desc: 'Escape Jerusalem (Level 1)', level: 1 },
    { id: 'trust', name: 'Trust Walk', emoji: '🙏', desc: 'Ananias chooses trust (Level 2)', level: 2 },
    { id: 'heal', name: 'Healer', emoji: '✨', desc: 'Heal the lame man (Level 3)', level: 3 },
    { id: 'viper', name: 'Unshaken', emoji: '🔥', desc: 'Courage on Malta (Level 4)', level: 4 },
    { id: 'unity', name: 'Peacemaker', emoji: '🤝', desc: 'Confront Peter in love (Level 5)', level: 5 },
    { id: 'armor', name: 'Armor Bearer', emoji: '🛡️', desc: 'Choose the armor of God (Level 6)', level: 6 },
    { id: 'scribe', name: 'Letter Writer', emoji: '📜', desc: 'Match the prison letters (Level 7)', level: 7 },
    { id: 'crown', name: 'Crown of Life', emoji: '👑', desc: 'Finish the race (Level 8)', level: 8 },
    { id: 'first_save', name: 'Journey Keeper', emoji: '💾', desc: 'Save your progress once', special: 'save' },
    { id: 'no_life_lost', name: 'Careful Disciple', emoji: '❤️', desc: 'Complete a level with 3 lives', special: 'full_lives' },
    { id: 'explorer', name: 'Explorer', emoji: '🗺️', desc: 'Use Level Select', special: 'level_select' },
    { id: 'all_eight', name: 'Sword of the Spirit', emoji: '⚔️', desc: 'Complete all 8 levels', special: 'all' }
  ];

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : { unlocked: {}, when: {} };
    } catch (e) {
      return { unlocked: {}, when: {} };
    }
  }

  function save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }

  function unlock(id) {
    const data = load();
    if (data.unlocked[id]) return false;
    data.unlocked[id] = true;
    data.when[id] = Date.now();
    save(data);
    return true;
  }

  function has(id) {
    return !!load().unlocked[id];
  }

  function unlockForLevel(levelNum) {
    const def = DEFS.find(d => d.level === levelNum);
    if (!def) return null;
    if (unlock(def.id)) return def;
    return null;
  }

  function checkSpecials(ctx) {
    const got = [];
    if (ctx && ctx.saved && unlock('first_save')) {
      got.push(DEFS.find(d => d.id === 'first_save'));
    }
    if (ctx && ctx.fullLives && unlock('no_life_lost')) {
      got.push(DEFS.find(d => d.id === 'no_life_lost'));
    }
    if (ctx && ctx.levelSelect && unlock('explorer')) {
      got.push(DEFS.find(d => d.id === 'explorer'));
    }
    if (ctx && ctx.allEight && unlock('all_eight')) {
      got.push(DEFS.find(d => d.id === 'all_eight'));
    }
    return got.filter(Boolean);
  }

  function list() {
    const data = load();
    return DEFS.map(d => ({
      ...d,
      unlocked: !!data.unlocked[d.id],
      when: data.when[d.id] || null
    }));
  }

  function count() {
    const data = load();
    return Object.keys(data.unlocked).filter(k => data.unlocked[k]).length;
  }

  function showToast(def) {
    if (!def) return;
    let host = document.getElementById('ach-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'ach-toast-host';
      host.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
      document.body.appendChild(host);
    }
    const el = document.createElement('div');
    el.style.cssText = 'pointer-events:auto;background:linear-gradient(135deg,#1a140f,#2a2010);border:2px solid #e8c547;border-radius:14px;padding:12px 16px;color:#e8d5a3;box-shadow:0 8px 24px rgba(0,0,0,0.5);min-width:220px;animation:achIn 0.4s ease;';
    el.innerHTML = `<div style="font-size:1.6rem;margin-bottom:4px;">${def.emoji}</div>
      <div style="font-family:Cinzel,serif;color:#e8c547;font-weight:700;">Sticker unlocked!</div>
      <div style="font-size:0.95rem;margin-top:2px;">${def.name}</div>
      <div style="font-size:0.8rem;opacity:0.8;">${def.desc}</div>`;
    host.appendChild(el);
    if (window.PaulSFX) try { window.PaulSFX.success(); } catch (e) {}
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.4s';
      setTimeout(() => el.remove(), 400);
    }, 3200);
  }

  function showBoard() {
    const items = list();
    const n = count();
    const modal = document.createElement('div');
    modal.id = 'ach-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;';
    let grid = items.map(d => {
      const op = d.unlocked ? '1' : '0.35';
      const filter = d.unlocked ? 'none' : 'grayscale(1)';
      return `<div style="background:#1a140f;border:1px solid ${d.unlocked ? '#e8c547' : '#444'};border-radius:12px;padding:12px;text-align:center;opacity:${op};filter:${filter};">
        <div style="font-size:2rem;">${d.emoji}</div>
        <div style="color:#e8c547;font-family:Cinzel,serif;font-size:0.85rem;margin-top:6px;">${d.name}</div>
        <div style="color:#c9b37a;font-size:0.75rem;margin-top:4px;">${d.desc}</div>
        ${d.unlocked ? '<div style="color:#2ecc71;font-size:0.7rem;margin-top:6px;">✓ Unlocked</div>' : '<div style="color:#666;font-size:0.7rem;margin-top:6px;">Locked</div>'}
      </div>`;
    }).join('');
    modal.innerHTML = `<div style="background:#120e0a;border:2px solid #e8c547;border-radius:16px;max-width:640px;width:100%;max-height:90vh;overflow:auto;padding:20px;">
      <h2 style="font-family:Cinzel,serif;color:#e8c547;text-align:center;margin:0 0 8px;">Faith Stickers</h2>
      <p style="text-align:center;color:#c9b37a;margin:0 0 16px;">${n} / ${items.length} collected</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;">${grid}</div>
      <div style="text-align:center;margin-top:18px;">
        <button class="btn secondary" onclick="document.getElementById('ach-modal').remove()">Close</button>
      </div>
    </div>`;
    document.body.appendChild(modal);
  }

  // Inject keyframes once
  if (!document.getElementById('ach-style')) {
    const s = document.createElement('style');
    s.id = 'ach-style';
    s.textContent = '@keyframes achIn{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}';
    document.head.appendChild(s);
  }

  window.PaulAchievements = {
    unlock,
    unlockForLevel,
    checkSpecials,
    list,
    count,
    showToast,
    showBoard,
    has
  };
})();
