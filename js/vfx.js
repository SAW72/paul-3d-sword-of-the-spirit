// PAUL-3D-SWORD-2026 — Lightweight confetti / spark VFX
(function () {
  function confetti(opts) {
    opts = opts || {};
    const duration = opts.duration || 2800;
    const count = opts.count || 80;
    const canvas = document.createElement('canvas');
    canvas.id = 'paul-confetti';
    canvas.style.cssText = 'position:fixed;inset:0;z-index:500;pointer-events:none;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const colors = ['#e8c547', '#f5e6a3', '#2ecc71', '#c9a227', '#fff8e0', '#ff6b6b', '#7ec8e3'];
    const parts = [];
    for (let i = 0; i < count; i++) {
      parts.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        w: 6 + Math.random() * 8,
        h: 8 + Math.random() * 10,
        vx: -3 + Math.random() * 6,
        vy: 2 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        vr: -0.2 + Math.random() * 0.4,
        color: colors[i % colors.length],
        g: 0.08 + Math.random() * 0.1
      });
    }
    const start = performance.now();
    function frame(t) {
      const elapsed = t - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      parts.forEach(p => {
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - elapsed / duration);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (elapsed < duration) requestAnimationFrame(frame);
      else canvas.remove();
    }
    requestAnimationFrame(frame);
  }

  function sparkBurst(x, y) {
    // DOM sparks for goal moments
    const host = document.createElement('div');
    host.style.cssText = `position:fixed;left:${x}px;top:${y}px;z-index:400;pointer-events:none;`;
    document.body.appendChild(host);
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('div');
      const ang = (i / 12) * Math.PI * 2;
      const dist = 40 + Math.random() * 50;
      s.style.cssText = `position:absolute;width:8px;height:8px;border-radius:50%;background:#e8c547;box-shadow:0 0 10px #e8c547;
        transform:translate(-50%,-50%);transition:transform 0.6s ease-out,opacity 0.6s;opacity:1;`;
      host.appendChild(s);
      requestAnimationFrame(() => {
        s.style.transform = `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px))`;
        s.style.opacity = '0';
      });
    }
    setTimeout(() => host.remove(), 700);
  }

  window.PaulVFX = { confetti, sparkBurst };
})();
