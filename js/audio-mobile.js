// ============================================================
// PAUL – Richer Web Audio music/SFX + Mobile joystick / look
// Project: PAUL-3D-SWORD-2026
// ============================================================

(function () {
  let audioCtx = null;
  let muted = false;
  let masterGain = null;
  let musicNodes = [];
  let musicPlaying = false;

  function ensureAudio() {
    if (muted) return null;
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.4;
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function tone(freq, dur, type, vol, delay) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const t0 = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(masterGain || ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  const SFX = {
    step: () => {
      if (Math.random() > 0.35) tone(70 + Math.random() * 50, 0.06, 'triangle', 0.05);
    },
    hide: () => tone(240, 0.14, 'sine', 0.1),
    catch: () => {
      tone(140, 0.12, 'sawtooth', 0.1);
      tone(90, 0.22, 'sawtooth', 0.09, 0.08);
    },
    success: () => {
      tone(523.25, 0.12, 'sine', 0.11);
      tone(659.25, 0.12, 'sine', 0.11, 0.1);
      tone(783.99, 0.28, 'sine', 0.13, 0.2);
      tone(1046.5, 0.35, 'triangle', 0.08, 0.35);
    },
    fail: () => tone(140, 0.35, 'square', 0.09),
    goal: () => {
      tone(440, 0.1, 'sine', 0.1);
      tone(880, 0.22, 'sine', 0.11, 0.12);
    },
    click: () => tone(620, 0.04, 'square', 0.04),
    levelStart: () => {
      tone(196, 0.2, 'sine', 0.08);
      tone(247, 0.2, 'sine', 0.08, 0.15);
      tone(294, 0.3, 'triangle', 0.07, 0.3);
    },
    // Richer looping ambient / music bed (pentatonic-ish pad + soft pulse)
    ambientStart: function () {
      const ctx = ensureAudio();
      if (!ctx || musicPlaying || muted) return;
      musicPlaying = true;
      this.ambientStop(true);

      const makePad = (freq, type, vol, lfoRate) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lfoG = ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.value = vol;
        lfo.frequency.value = lfoRate;
        lfoG.gain.value = freq * 0.01;
        lfo.connect(lfoG);
        lfoG.connect(o.frequency);
        o.connect(g);
        g.connect(masterGain);
        o.start();
        lfo.start();
        return { o, g, lfo };
      };

      // Low drone
      musicNodes.push(makePad(55, 'sine', 0.025, 0.08));
      musicNodes.push(makePad(82.5, 'triangle', 0.015, 0.05));
      // Soft fifths / warm bed
      musicNodes.push(makePad(110, 'sine', 0.012, 0.12));
      musicNodes.push(makePad(165, 'triangle', 0.008, 0.07));

      // Gentle rhythmic soft click (heartbeat of adventure)
      const pulse = () => {
        if (!musicPlaying || muted) return;
        tone(98, 0.08, 'sine', 0.03);
        tone(147, 0.06, 'triangle', 0.02, 0.05);
        this._pulseTimer = setTimeout(pulse, 2400);
      };
      this._pulseTimer = setTimeout(pulse, 800);
    },
    ambientStop: function (silent) {
      musicPlaying = false;
      if (this._pulseTimer) {
        clearTimeout(this._pulseTimer);
        this._pulseTimer = null;
      }
      musicNodes.forEach(n => {
        try { n.o.stop(); n.lfo.stop(); } catch (e) {}
      });
      musicNodes = [];
    }
  };

  window.PaulSFX = SFX;
  window.PaulAudio = {
    unlock: ensureAudio,
    mute: (m) => {
      muted = !!m;
      if (muted) SFX.ambientStop();
      else if (audioCtx) SFX.ambientStart();
    },
    isMuted: () => muted,
    setVolume: (v) => {
      ensureAudio();
      if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, v));
      try { localStorage.setItem('PAUL_3D_VOL', String(v)); } catch(e) {}
    },
    setVolumePreset: (name) => {
      const map = { mute: 0, low: 0.15, normal: 0.4, high: 0.7 };
      const v = map[name] != null ? map[name] : 0.4;
      if (name === 'mute') { muted = true; SFX.ambientStop(); }
      else { muted = false; }
      if (masterGain) masterGain.gain.value = v;
      else { ensureAudio(); if (masterGain) masterGain.gain.value = v; }
      try { localStorage.setItem('PAUL_3D_VOL', String(v)); localStorage.setItem('PAUL_3D_VOL_PRESET', name); } catch(e) {}
      return v;
    },
    getVolumePreset: () => {
      try { return localStorage.getItem('PAUL_3D_VOL_PRESET') || 'normal'; } catch(e) { return 'normal'; }
    }
  };
  // restore volume
  try {
    const v = parseFloat(localStorage.getItem('PAUL_3D_VOL'));
    if (!isNaN(v) && masterGain) masterGain.gain.value = v;
  } catch(e) {}

  // ---------- Mobile joystick + always-visible on touch ----------
  let joy = { active: false, dx: 0, dy: 0, lookDx: 0, lookDy: 0 };

  function isTouchDevice() {
    return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  }

  function createMobileControls(container) {
    if (!container) return;
    removeMobileControls();

    const wrap = document.createElement('div');
    wrap.id = 'paul-mobile-controls';
    wrap.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:30;';

    const baseEl = document.createElement('div');
    baseEl.id = 'paul-joy-base';
    baseEl.style.cssText = 'position:absolute;left:16px;bottom:20px;width:130px;height:130px;border-radius:50%;background:rgba(0,0,0,0.4);border:2px solid rgba(232,197,71,0.45);pointer-events:auto;touch-action:none;';
    const joyEl = document.createElement('div');
    joyEl.style.cssText = 'position:absolute;left:50%;top:50%;width:56px;height:56px;margin:-28px;border-radius:50%;background:rgba(232,197,71,0.8);border:2px solid rgba(255,255,255,0.25);box-shadow:0 0 14px rgba(232,197,71,0.45);';
    baseEl.appendChild(joyEl);
    wrap.appendChild(baseEl);

    const lookEl = document.createElement('div');
    lookEl.id = 'paul-look-pad';
    lookEl.style.cssText = 'position:absolute;right:16px;bottom:20px;width:130px;height:130px;border-radius:50%;background:rgba(0,0,0,0.35);border:2px solid rgba(232,197,71,0.35);pointer-events:auto;touch-action:none;display:flex;align-items:center;justify-content:center;color:rgba(232,197,71,0.75);font-size:13px;font-family:Inter,sans-serif;font-weight:600;';
    lookEl.textContent = 'LOOK';
    wrap.appendChild(lookEl);

    const muteBtn = document.createElement('button');
    muteBtn.type = 'button';
    muteBtn.textContent = '🔊';
    muteBtn.setAttribute('aria-label', 'Mute');
    muteBtn.style.cssText = 'position:absolute;top:10px;right:64px;pointer-events:auto;background:rgba(0,0,0,0.65);border:1px solid rgba(232,197,71,0.45);color:#e8c547;border-radius:10px;padding:8px 12px;font-size:16px;z-index:40;';
    muteBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      muted = !muted;
      muteBtn.textContent = muted ? '🔇' : '🔊';
      window.PaulAudio.mute(muted);
    };
    wrap.appendChild(muteBtn);

    container.appendChild(wrap);

    const maxR = 42;
    let joyTouchId = null, lookTouchId = null;

    function setStick(clientX, clientY) {
      const rect = baseEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx, dy = clientY - cy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      if (len > maxR) { dx = (dx / len) * maxR; dy = (dy / len) * maxR; }
      joyEl.style.transform = `translate(${dx}px, ${dy}px)`;
      joyEl.style.left = '50%';
      joyEl.style.top = '50%';
      joyEl.style.margin = '-28px';
      joy.dx = dx / maxR;
      joy.dy = dy / maxR;
      joy.active = true;
    }
    function resetStick() {
      joyEl.style.transform = 'translate(0,0)';
      joy.dx = 0; joy.dy = 0; joy.active = false;
    }

    baseEl.addEventListener('touchstart', (e) => {
      e.preventDefault();
      ensureAudio();
      const t = e.changedTouches[0];
      joyTouchId = t.identifier;
      setStick(t.clientX, t.clientY);
    }, { passive: false });
    baseEl.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === joyTouchId) setStick(t.clientX, t.clientY);
      }
    }, { passive: false });
    const endJoy = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === joyTouchId) { joyTouchId = null; resetStick(); }
      }
    };
    baseEl.addEventListener('touchend', endJoy);
    baseEl.addEventListener('touchcancel', endJoy);

    let lastLookX = 0, lastLookY = 0;
    lookEl.addEventListener('touchstart', (e) => {
      e.preventDefault();
      ensureAudio();
      const t = e.changedTouches[0];
      lookTouchId = t.identifier;
      lastLookX = t.clientX; lastLookY = t.clientY;
    }, { passive: false });
    lookEl.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === lookTouchId) {
          joy.lookDx += (t.clientX - lastLookX) * 0.012;
          joy.lookDy += (t.clientY - lastLookY) * 0.01;
          lastLookX = t.clientX; lastLookY = t.clientY;
        }
      }
    }, { passive: false });
    const endLook = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === lookTouchId) lookTouchId = null;
      }
    };
    lookEl.addEventListener('touchend', endLook);
    lookEl.addEventListener('touchcancel', endLook);

    const show = isTouchDevice() || window.innerWidth < 920;
    wrap.style.display = show ? 'block' : 'none';
    // Always show joysticks on coarse pointer
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
      wrap.style.display = 'block';
    }
  }

  function removeMobileControls() {
    const el = document.getElementById('paul-mobile-controls');
    if (el) el.remove();
    joy = { active: false, dx: 0, dy: 0, lookDx: 0, lookDy: 0 };
  }

  function consumeLook() {
    const dx = joy.lookDx, dy = joy.lookDy;
    joy.lookDx = 0; joy.lookDy = 0;
    return { dx, dy };
  }

  function getMove() {
    return { dx: joy.dx, dy: joy.dy, active: joy.active };
  }

  window.PaulMobile = {
    create: createMobileControls,
    remove: removeMobileControls,
    getMove,
    consumeLook,
    isTouch: isTouchDevice
  };
})();
