/* ═══════════════
 * 背景 sky.js · 古风卷轴版
 * #sky  静态全景:宣纸底 · 水墨远山 · 云纹 · 淡金尘,只烘焙一次
 * #skyfx 特效薄层:飘落花瓣 · 偶发曳光,元素稀少,随时可停
 * ═══════════════ */
(function () {
  'use strict';
  const cv = document.getElementById('sky');
  const fx = document.getElementById('skyfx');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const fctx = fx ? fx.getContext('2d') : null;
  let W, H, dpr;
  let petals = [], motes = [], meteors = [];
  let nextMeteor = 6;

  /* 一条水墨山脊线(确定性随机) */
  function ridge(seed, baseY, amp, wavelength) {
    const pts = [];
    let s = seed;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const seg = Math.ceil(W / wavelength) + 2;
    for (let i = 0; i <= seg; i++) {
      pts.push(baseY - Math.sin(i * 1.7 + seed) * amp * (0.5 + rnd() * 0.5) - rnd() * amp * 0.3);
    }
    return pts;
  }
  function drawRidge(g, pts, wavelength, color) {
    g.beginPath();
    g.moveTo(-10, H + 10);
    const seg = pts.length - 1;
    for (let i = 0; i <= seg; i++) {
      const x = -10 + i * wavelength;
      g.lineTo(x, pts[i]);
    }
    g.lineTo(W + 10, H + 10);
    g.closePath();
    g.fillStyle = color;
    g.fill();
  }

  /* 烘焙静态全景(#sky 只画一次) */
  function bake() {
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* 宣纸底 */
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#f3ead6');
    bg.addColorStop(0.62, '#eee2c8');
    bg.addColorStop(1, '#e6d7b8');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    /* 纸上暖晕 */
    const wash = ctx.createRadialGradient(W * 0.5, H * 0.34, 0, W * 0.5, H * 0.34, W * 0.62);
    wash.addColorStop(0, 'rgba(255, 250, 235, 0.5)');
    wash.addColorStop(1, 'rgba(210, 180, 120, 0.10)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, W, H);
    /* 云纹(淡墨软云) */
    let s0 = 11;
    const rnd0 = () => (s0 = (s0 * 16807) % 2147483647) / 2147483647;
    for (let c = 0; c < 7; c++) {
      const cx = rnd0() * W, cy = rnd0() * H * 0.55, scale = 0.7 + rnd0() * 1.3;
      ctx.fillStyle = 'rgba(255, 252, 244, 0.5)';
      for (let k = 0; k < 5; k++) {
        ctx.beginPath();
        ctx.ellipse(cx + (k - 2) * 60 * scale, cy + Math.abs(k - 2) * 7 * scale,
          95 * scale * (1 - Math.abs(k - 2) * 0.16), 24 * scale, 0, 0, 6.2832);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(90, 76, 56, 0.08)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - 150 * scale, cy + 18 * scale);
      ctx.quadraticCurveTo(cx, cy + 34 * scale, cx + 150 * scale, cy + 18 * scale);
      ctx.stroke();
    }
    /* 淡金尘 */
    for (let i = 0; i < 70; i++) {
      ctx.globalAlpha = 0.10 + rnd0() * 0.14;
      ctx.fillStyle = '#a5813c';
      ctx.beginPath();
      ctx.arc(rnd0() * W, rnd0() * H, 0.6 + rnd0() * 1.2, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    /* 水墨远山(三叠) */
    const mountains = [
      [3, H * 0.66, H * 0.10, W * 0.30, 'rgba(58, 50, 38, 0.10)'],
      [5, H * 0.74, H * 0.13, W * 0.24, 'rgba(58, 50, 38, 0.17)'],
      [9, H * 0.84, H * 0.16, W * 0.19, 'rgba(58, 50, 38, 0.26)']
    ];
    for (const [sd, by, amp, wl, col] of mountains) {
      drawRidge(ctx, ridge(sd, by, amp, wl), wl, col);
    }
    /* 山脚淡雾 */
    const mist = ctx.createLinearGradient(0, H * 0.80, 0, H);
    mist.addColorStop(0, 'rgba(238, 226, 200, 0)');
    mist.addColorStop(1, 'rgba(238, 226, 200, 0.55)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, H * 0.80, W, H * 0.20);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    W = window.innerWidth; H = window.innerHeight;
    if (fx) { fx.width = Math.round(W * dpr); fx.height = Math.round(H * dpr); fctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    bake();
    petals = [];
    for (let i = 0; i < 11; i++) {
      petals.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 3.2 + Math.random() * 3.4,
        vy: 0.25 + Math.random() * 0.45,
        vx: 0.12 + Math.random() * 0.3,
        ang: Math.random() * 6.2832,
        spin: (Math.random() - 0.5) * 0.02,
        a: 0.30 + Math.random() * 0.30,
        pink: Math.random() < 0.62
      });
    }
    motes = [];
    for (let i = 0; i < 8; i++) {
      motes.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 1.2 + Math.random() * 2.0,
        vy: -(2 + Math.random() * 6) / 60,
        vx: (Math.random() - 0.5) * 5 / 60,
        a: 0.08 + Math.random() * 0.12
      });
    }
  }

  function spawnMeteor() {
    const x = Math.random() * W * 0.85 + W * 0.1;
    const y = Math.random() * H * 0.30;
    const ang = Math.PI * (0.72 + Math.random() * 0.2);
    const sp = 8 + Math.random() * 6;
    meteors.push({ x, y, vx: Math.cos(ang) * sp, vy: -Math.sin(ang) * sp, life: 1, len: 80 + Math.random() * 60 });
  }

  let last = performance.now();
  let running = true;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!fctx || !running || document.hidden) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    fctx.clearRect(0, 0, W, H);

    /* 花瓣飘落 */
    for (const p of petals) {
      p.y += p.vy; p.x += p.vx + Math.sin(now / 1000 + p.ang) * 0.3;
      p.ang += p.spin;
      if (p.y > H + 15) { p.y = -15; p.x = Math.random() * W; }
      if (p.x > W + 15) p.x = -15;
      fctx.save();
      fctx.translate(p.x, p.y);
      fctx.rotate(p.ang);
      fctx.globalAlpha = p.a;
      fctx.fillStyle = p.pink ? '#d8a0a8' : '#d9b26a';
      fctx.beginPath();
      fctx.ellipse(0, 0, p.r, p.r * 0.45, 0, 0, 6.2832);
      fctx.fill();
      fctx.restore();
    }

    /* 淡金浮尘缓升 */
    for (const m of motes) {
      m.x += m.vx; m.y += m.vy;
      if (m.y < -10) { m.y = H + 10; m.x = Math.random() * W; }
      if (m.x < -10) m.x = W + 10; else if (m.x > W + 10) m.x = -10;
      fctx.globalAlpha = m.a;
      fctx.fillStyle = '#a5813c';
      fctx.beginPath(); fctx.arc(m.x, m.y, m.r, 0, 6.2832); fctx.fill();
    }

    /* 偶发曳光(墨白) */
    nextMeteor -= dt;
    if (nextMeteor <= 0) { spawnMeteor(); nextMeteor = 8 + Math.random() * 12; }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx; m.y += m.vy; m.life -= dt * 0.7;
      if (m.life <= 0 || m.x > W + 150 || m.y > H + 150) { meteors.splice(i, 1); continue; }
      const dx = m.x - m.vx * (m.len / 10), dy = m.y - m.vy * (m.len / 10);
      const grad = fctx.createLinearGradient(m.x, m.y, dx, dy);
      grad.addColorStop(0, `rgba(120, 100, 70, ${0.5 * m.life})`);
      grad.addColorStop(1, 'rgba(120, 100, 70, 0)');
      fctx.globalAlpha = 1;
      fctx.strokeStyle = grad; fctx.lineWidth = 1.4; fctx.lineCap = 'round';
      fctx.beginPath(); fctx.moveTo(m.x, m.y); fctx.lineTo(dx, dy); fctx.stroke();
    }
    fctx.globalAlpha = 1;
  }

  document.addEventListener('visibilitychange', () => { running = !document.hidden; });
  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);
})();
