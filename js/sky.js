/* ═══════════════
 * 星空背景 sky.js
 * 繁星明灭 · 流星曳空 · 灵尘浮游
 * ═══════════════ */
(function () {
  'use strict';
  const cv = document.getElementById('sky');
  const ctx = cv.getContext('2d');
  let W, H, dpr;
  let stars = [], motes = [], meteors = [];
  let nextMeteor = 2.5;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    init();
  }
  function init() {
    stars = [];
    const n = Math.min(320, Math.floor(W * H / 5200));
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 0.3 + Math.random() * 1.4,
        a: 0.25 + Math.random() * 0.65,
        sp: 0.4 + Math.random() * 1.6,
        ph: Math.random() * Math.PI * 2,
        warm: Math.random() < 0.22
      });
    }
    motes = [];
    for (let i = 0; i < 14; i++) {
      motes.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 1.4 + Math.random() * 2.6,
        vy: -(3 + Math.random() * 8) / 60,
        vx: (Math.random() - 0.5) * 6 / 60,
        a: 0.06 + Math.random() * 0.14,
        gold: Math.random() < 0.6
      });
    }
  }

  function spawnMeteor() {
    const x = Math.random() * W * 0.85 + W * 0.1;
    const y = Math.random() * H * 0.35;
    const ang = Math.PI * (0.72 + Math.random() * 0.2);
    const sp = 9 + Math.random() * 7;
    meteors.push({ x, y, vx: Math.cos(ang) * sp, vy: -Math.sin(ang) * sp, life: 1, len: 90 + Math.random() * 70 });
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ctx.clearRect(0, 0, W, H);

    /* 繁星 */
    for (const s of stars) {
      const tw = 0.55 + 0.45 * Math.sin(now / 1000 * s.sp + s.ph);
      ctx.globalAlpha = s.a * tw;
      ctx.fillStyle = s.warm ? '#ffe8bd' : '#cfe0ff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 6.2832);
      ctx.fill();
      if (s.r > 1.15) {
        ctx.globalAlpha = s.a * tw * 0.28;
        ctx.shadowColor = s.warm ? '#ffd88a' : '#9db8ff';
        ctx.shadowBlur = 7;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    /* 灵尘(金色浮尘缓升) */
    for (const m of motes) {
      m.x += m.vx; m.y += m.vy;
      if (m.y < -10) { m.y = H + 10; m.x = Math.random() * W; }
      if (m.x < -10) m.x = W + 10; else if (m.x > W + 10) m.x = -10;
      ctx.globalAlpha = m.a;
      ctx.fillStyle = m.gold ? '#e8c37a' : '#8fb4ff';
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.2832); ctx.fill();
    }

    /* 流星 */
    nextMeteor -= dt;
    if (nextMeteor <= 0) { spawnMeteor(); nextMeteor = 5 + Math.random() * 9; }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx; m.y += m.vy; m.life -= dt * 0.7;
      if (m.life <= 0 || m.x > W + 150 || m.y > H + 150) { meteors.splice(i, 1); continue; }
      const dx = m.x - m.vx * (m.len / 10), dy = m.y - m.vy * (m.len / 10);
      const grad = ctx.createLinearGradient(m.x, m.y, dx, dy);
      grad.addColorStop(0, `rgba(255, 240, 200, ${0.85 * m.life})`);
      grad.addColorStop(1, 'rgba(255, 240, 200, 0)');
      ctx.globalAlpha = 1;
      ctx.strokeStyle = grad; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(dx, dy); ctx.stroke();
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);
})();
