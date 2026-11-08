/* ═══════════════
 * 星空背景 sky.js  v3 · 性能版
 * #sky  静态全景:星云+繁星只烘焙一次,零逐帧开销
 * #skyfx 特效薄层:微闪星/灵尘/流星,元素稀少,随时可停
 * ═══════════════ */
(function () {
  'use strict';
  const cv = document.getElementById('sky');
  const fx = document.getElementById('skyfx');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const fctx = fx ? fx.getContext('2d') : null;
  let W, H, dpr;
  let twinkles = [], motes = [], meteors = [];
  let nextMeteor = 2.5;

  /* 烘焙静态全景(#sky 只画一次) */
  function bake() {
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* 深空底色 */
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#05060f');
    bg.addColorStop(1, '#04040c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    /* 星云(径向渐变直接入画,零滤镜) */
    ctx.globalCompositeOperation = 'lighter';
    const neb = [
      [W * 0.18, H * 0.12, W * 0.42, 'rgba(96, 62, 190, 0.30)'],
      [W * 0.86, H * 0.30, W * 0.36, 'rgba(28, 96, 150, 0.26)'],
      [W * 0.50, H * 0.94, W * 0.34, 'rgba(190, 130, 44, 0.12)']
    ];
    for (const [x, y, r, col] of neb) {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, col);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    /* 繁星 */
    const n = Math.min(340, Math.floor(W * H / 4900));
    twinkles = [];
    for (let i = 0; i < n; i++) {
      const s = {
        x: Math.random() * W, y: Math.random() * H,
        r: 0.3 + Math.random() * 1.4,
        a: 0.25 + Math.random() * 0.65,
        warm: Math.random() < 0.22
      };
      ctx.globalAlpha = s.a;
      ctx.fillStyle = s.warm ? '#ffe8bd' : '#cfe0ff';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill();
      if (s.r > 1.15) {
        ctx.globalAlpha = s.a * 0.3;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 2.4, 0, 6.2832); ctx.fill();
      }
      if (s.r > 1.2 && twinkles.length < 12) { s.ph = Math.random() * 6.2832; s.sp = 0.5 + Math.random() * 1.4; twinkles.push(s); }
    }
    ctx.globalAlpha = 1;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    W = window.innerWidth; H = window.innerHeight;
    if (fx) { fx.width = Math.round(W * dpr); fx.height = Math.round(H * dpr); fctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    bake();
    motes = [];
    for (let i = 0; i < 12; i++) {
      motes.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 1.4 + Math.random() * 2.4,
        vy: -(3 + Math.random() * 8) / 60,
        vx: (Math.random() - 0.5) * 6 / 60,
        a: 0.06 + Math.random() * 0.13,
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
  let running = true;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!fctx || !running || document.hidden) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    fctx.clearRect(0, 0, W, H);

    /* 微闪亮星(极少量) */
    for (const s of twinkles) {
      const tw = 0.45 + 0.55 * Math.sin(now / 1000 * s.sp + s.ph);
      fctx.globalAlpha = s.a * tw;
      fctx.fillStyle = s.warm ? '#ffe8bd' : '#cfe0ff';
      fctx.beginPath(); fctx.arc(s.x, s.y, s.r, 0, 6.2832); fctx.fill();
    }

    /* 灵尘缓升 */
    for (const m of motes) {
      m.x += m.vx; m.y += m.vy;
      if (m.y < -10) { m.y = H + 10; m.x = Math.random() * W; }
      if (m.x < -10) m.x = W + 10; else if (m.x > W + 10) m.x = -10;
      fctx.globalAlpha = m.a;
      fctx.fillStyle = m.gold ? '#e8c37a' : '#8fb4ff';
      fctx.beginPath(); fctx.arc(m.x, m.y, m.r, 0, 6.2832); fctx.fill();
    }

    /* 流星(偶发) */
    nextMeteor -= dt;
    if (nextMeteor <= 0) { spawnMeteor(); nextMeteor = 6 + Math.random() * 10; }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx; m.y += m.vy; m.life -= dt * 0.7;
      if (m.life <= 0 || m.x > W + 150 || m.y > H + 150) { meteors.splice(i, 1); continue; }
      const dx = m.x - m.vx * (m.len / 10), dy = m.y - m.vy * (m.len / 10);
      const grad = fctx.createLinearGradient(m.x, m.y, dx, dy);
      grad.addColorStop(0, `rgba(255, 240, 200, ${0.85 * m.life})`);
      grad.addColorStop(1, 'rgba(255, 240, 200, 0)');
      fctx.globalAlpha = 1;
      fctx.strokeStyle = grad; fctx.lineWidth = 1.6; fctx.lineCap = 'round';
      fctx.beginPath(); fctx.moveTo(m.x, m.y); fctx.lineTo(dx, dy); fctx.stroke();
    }
    fctx.globalAlpha = 1;
  }

  document.addEventListener('visibilitychange', () => { running = !document.hidden; });
  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);
})();
