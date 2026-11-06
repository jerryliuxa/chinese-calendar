/* ═══════════════════════════════════════════════
 * 三维浑天罗盘 luopan.js
 * Canvas 手写 3D 投影:五重环轨 · 太极天心
 * 二十八宿 / 廿四节气 / 十二地支 / 十天干 / 八卦
 * 拖动旋转 · 滚轮缩放 · 闲时自转
 * ═══════════════════════════════════════════════ */
(function () {
  'use strict';

  const cv = document.getElementById('luopan');
  if (!cv) return;
  const ctx = cv.getContext('2d');

  const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const BAGUA_ROWS = { '乾': [1,1,1], '兑': [0,1,1], '离': [1,0,1], '震': [0,0,1], '巽': [1,1,0], '坎': [0,1,0], '艮': [1,0,0], '坤': [0,0,0] };
  const GUAS = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];

  /* 环轨配置:R 半径(外环=1) tilt 基础倾角 speed 环面旋进 selfSpin 环上字转 */
  const RINGS = [
    { R: 1.00, kind: 'xiu',  size: 0.075, color: '#9fc6ff', tilt: 1.16, speed: 0.050,  spin: 0.20,  dir: 1 },
    { R: 0.845, kind: 'jie', size: 0.062, color: '#7de8a8', tilt: 0.72, speed: -0.042, spin: -0.15, dir: -1 },
    { R: 0.67, kind: 'zhi',  size: 0.105, color: '#6fd3ff', tilt: 1.00, speed: 0.060,  spin: -0.24, dir: -1 },
    { R: 0.52, kind: 'gan',  size: 0.105, color: '#f0c674', tilt: 0.50, speed: -0.070, spin: 0.30,  dir: 1 },
    { R: 0.37, kind: 'gua',  size: 0.150, color: '#f0a56a', tilt: 0.88, speed: 0.085,  spin: -0.36, dir: -1 }
  ];

  /* 视角状态 */
  let W = 0, H = 0, CX = 0, CY = 0, U = 0, dpr = 1;
  let yaw = -0.6, pitch = 1.02, zoom = 1, targetZoom = 1;
  let vyaw = 0, dragging = false, lastX = 0, lastY = 0, lastInteract = -1e9;
  let visible = true;

  /* 三维基:环面基矢量(绕 X 倾角 φ,再绕 Y 旋进 ψ) */
  function ringBasis(phi, psi) {
    const cp = Math.cos(phi), sp = Math.sin(phi);
    const cy = Math.cos(psi), sy = Math.sin(psi);
    return {
      u: [cy, 0, -sy],
      v: [cp * sy, -sp, cp * cy]
    };
  }
  /* 世界→视图→投影。返回 {x, y, z, k} */
  function project(p) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const x1 = p[0] * cy + p[2] * sy;
    const z1 = -p[0] * sy + p[2] * cy;
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const y2 = p[1] * cp - z1 * sp;
    const z2 = p[1] * sp + z1 * cp;
    const persp = 3.6;
    const k = persp / (persp - z2);
    return { x: CX + x1 * k * U * zoom, y: CY - y2 * k * U * zoom, z: z2, k };
  }
  const depthAlpha = (z) => { const t = Math.max(0, Math.min(1, (z + 1) / 2)); return 0.16 + 0.84 * Math.pow(t, 1.7); };

  /* ─────────── 绘制元素 ─────────── */
  function drawRingStroke(ring, t, idx) {
    const phi = ring.tilt + 0.10 * Math.sin(t * 0.13 + idx * 1.7);
    const psi = t * ring.speed + idx * 2.1;
    const { u, v } = ringBasis(phi, psi);
    const N = 108;
    /* 分 12 段,按深度分组描线 */
    let prev = null;
    for (let s = 0; s < 12; s++) {
      ctx.beginPath();
      for (let q = 0; q <= N / 12; q++) {
        const a = (s * N / 12 + q) / N * Math.PI * 2;
        const p = project([
          (u[0] * Math.cos(a) + v[0] * Math.sin(a)) * ring.R,
          (u[1] * Math.cos(a) + v[1] * Math.sin(a)) * ring.R,
          (u[2] * Math.cos(a) + v[2] * Math.sin(a)) * ring.R
        ]);
        if (q === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      const aMid = (s + 0.5) / 12 * Math.PI * 2;
      const pm = project([
        (u[0] * Math.cos(aMid) + v[0] * Math.sin(aMid)) * ring.R,
        (u[1] * Math.cos(aMid) + v[1] * Math.sin(aMid)) * ring.R,
        (u[2] * Math.cos(aMid) + v[2] * Math.sin(aMid)) * ring.R
      ]);
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = depthAlpha(pm.z) * 0.34;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    return { phi, psi, u, v };
  }

  function drawTrigram(g, x, y, w, lw, color, alpha) {
    const rows = BAGUA_ROWS[g];
    const gap = lw * 1.75;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    /* rows 自上而下 */
    for (let r = 0; r < 3; r++) {
      const yy = (r - 1) * gap;
      if (rows[r] === 1) {
        ctx.beginPath(); ctx.moveTo(-w / 2, yy); ctx.lineTo(w / 2, yy); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(-w / 2, yy); ctx.lineTo(-w / 6, yy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(w / 6, yy); ctx.lineTo(w / 2, yy); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawTaiji(cx, cy, r, rot, t) {
    const pulse = 1 + 0.045 * Math.sin(t * 0.0016);
    r *= pulse;
    /* 外晕 */
    ctx.save();
    const halo = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 2.6);
    halo.addColorStop(0, 'rgba(232,195,122,0.28)');
    halo.addColorStop(0.5, 'rgba(232,195,122,0.07)');
    halo.addColorStop(1, 'rgba(232,195,122,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(cx, cy, r * 2.6, 0, 6.2832); ctx.fill();
    /* 光环 */
    ctx.strokeStyle = 'rgba(232,195,122,0.55)';
    ctx.lineWidth = 1.2;
    ctx.shadowColor = 'rgba(232,195,122,0.9)';
    ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.22, 0, 6.2832); ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.translate(cx, cy);
    ctx.rotate(rot);
    /* 阴底 */
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832);
    ctx.fillStyle = '#0e1330'; ctx.fill();
    /* 阳半 */
    ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false); ctx.closePath();
    ctx.fillStyle = '#e8c37a';
    ctx.shadowColor = 'rgba(232,195,122,0.8)'; ctx.shadowBlur = 16;
    ctx.fill(); ctx.shadowBlur = 0;
    /* 两仪小圆 */
    ctx.beginPath(); ctx.arc(0, -r / 2, r / 2, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.arc(0, r / 2, r / 2, 0, 6.2832); ctx.fillStyle = '#0e1330'; ctx.fill();
    /* 鱼眼 */
    ctx.beginPath(); ctx.arc(0, -r / 2, r / 6.5, 0, 6.2832); ctx.fillStyle = '#0e1330'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, r / 2, r / 6.5, 0, 6.2832); ctx.fillStyle = '#e8c37a'; ctx.fill();
    ctx.restore();
  }

  function drawDial(t) {
    const R = U * zoom * 1.08;
    ctx.save();
    /* 底盘双环 */
    ctx.strokeStyle = 'rgba(232,195,122,0.30)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, 6.2832); ctx.stroke();
    ctx.strokeStyle = 'rgba(232,195,122,0.14)';
    ctx.beginPath(); ctx.arc(CX, CY, R * 0.985, 0, 6.2832); ctx.stroke();
    /* 刻度:72 符,主刻度加长 */
    for (let i = 0; i < 72; i++) {
      const a = i / 72 * Math.PI * 2 - Math.PI / 2;
      const major = i % 9 === 0;
      const r1 = R * 0.975, r0 = r1 - (major ? 9 : 4.5);
      ctx.strokeStyle = major ? 'rgba(232,195,122,0.5)' : 'rgba(232,195,122,0.22)';
      ctx.lineWidth = major ? 1.4 : 1;
      ctx.beginPath();
      ctx.moveTo(CX + Math.cos(a) * r0, CY + Math.sin(a) * r0);
      ctx.lineTo(CX + Math.cos(a) * r1, CY + Math.sin(a) * r1);
      ctx.stroke();
    }
    /* 后天方位:上离(南)下坎(北)左震(东)右兑(西) */
    const dirs = [['离', 0, -1], ['坎', 0, 1], ['震', -1, 0], ['兑', 1, 0],
      ['巽', -0.72, -0.72], ['坤', -0.72, 0.72], ['乾', 0.72, -0.72], ['艮', 0.72, 0.72]];
    ctx.font = `${Math.max(11, U * 0.075)}px 'Noto Serif SC','KaiTi',serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [ch, dx, dy] of dirs) {
      const x = CX + dx * R * 0.925, y = CY + dy * R * 0.925;
      ctx.fillStyle = 'rgba(232,195,122,0.42)';
      ctx.fillText(ch, x, y);
    }
    ctx.restore();
  }

  /* ─────────── 主循环 ─────────── */
  let lastT = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || W === 0) return;
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    const t = now;

    /* 交互惯性 & 闲时自转 */
    if (!dragging) {
      yaw += vyaw; vyaw *= 0.93;
      if (now - lastInteract > 2600) yaw += 0.05 * dt;
    }
    zoom += (targetZoom - zoom) * 0.12;
    const bob = Math.sin(t * 0.0009) * U * 0.012;

    ctx.clearRect(0, 0, W, H);
    CY = H / 2 + bob;
    CX = W / 2;

    drawDial(t);

    /* 环轨 + 环上字/卦 */
    const items = []; // {z, fn}
    RINGS.forEach((ring, idx) => {
      const { phi, psi, u, v } = drawRingStroke(ring, t, idx);
      const n = ring.kind === 'xiu' ? 28 : ring.kind === 'jie' ? 24 : ring.kind === 'zhi' ? 12 : ring.kind === 'gan' ? 10 : 8;
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2 + t * ring.spin * ring.dir;
        const ca = Math.cos(a), sa = Math.sin(a);
        const p = project([
          (u[0] * ca + v[0] * sa) * ring.R,
          (u[1] * ca + v[1] * sa) * ring.R,
          (u[2] * ca + v[2] * sa) * ring.R
        ]);
        const alpha = depthAlpha(p.z);
        if (ring.kind === 'gua') {
          const g = GUAS[i];
          items.push({ z: p.z, fn: () => drawTrigram(g, p.x, p.y, ring.size * U * zoom * p.k * 0.62, Math.max(1.6, ring.size * U * zoom * p.k * 0.16), ring.color, alpha) });
        } else {
          let text;
          if (ring.kind === 'xiu') text = LC.XINGXIU[i];
          else if (ring.kind === 'jie') text = LUNAR_TABLE.solarTerm[i];
          else if (ring.kind === 'zhi') text = ZHI[i];
          else text = GAN[i];
          const px = ring.size * U * zoom * p.k;
          items.push({ z: p.z, fn: () => {
            ctx.font = `${px}px 'Noto Serif SC','KaiTi',serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = ring.color;
            ctx.globalAlpha = alpha;
            ctx.shadowColor = ring.color; ctx.shadowBlur = 7 * alpha;
            ctx.fillText(text, p.x, p.y);
            ctx.shadowBlur = 0; ctx.globalAlpha = 1;
          } });
        }
      }
    });

    /* 灵尘 */
    for (const m of dust) {
      const A = m.a0 + t * 0.0001 * m.w;
      const p = project([Math.cos(A) * m.R, m.h, Math.sin(A) * m.R]);
      items.push({ z: p.z, fn: () => {
        ctx.globalAlpha = depthAlpha(p.z) * m.al;
        ctx.fillStyle = m.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, m.r * p.k, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = 1;
      } });
    }

    /* 远→近绘制 */
    items.sort((a, b) => a.z - b.z);
    for (const it of items) it.fn();

    /* 太极天心 */
    drawTaiji(CX, CY, U * zoom * 0.135, t * 0.0006, t);
  }

  /* 灵尘初始化 */
  const dust = [];
  function initDust() {
    dust.length = 0;
    for (let i = 0; i < 26; i++) {
      dust.push({
        R: 0.2 + Math.random() * 0.95,
        h: (Math.random() - 0.5) * 1.3,
        a0: Math.random() * 6.2832,
        w: (Math.random() < 0.5 ? -1 : 1) * (30 + Math.random() * 70),
        r: 0.8 + Math.random() * 1.7,
        al: 0.25 + Math.random() * 0.5,
        c: Math.random() < 0.6 ? '#e8c37a' : '#7de8a8'
      });
    }
  }

  /* ─────────── 交互 ─────────── */
  cv.addEventListener('pointerdown', (e) => {
    dragging = true; vyaw = 0;
    lastX = e.clientX; lastY = e.clientY;
    lastInteract = performance.now();
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    yaw += dx * 0.006;
    pitch = Math.max(0.25, Math.min(1.45, pitch + dy * 0.005));
    vyaw = dx * 0.0022;
    lastInteract = performance.now();
  });
  const endDrag = () => { dragging = false; lastInteract = performance.now(); };
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', endDrag);
  cv.addEventListener('wheel', (e) => {
    e.preventDefault();
    targetZoom = Math.max(0.7, Math.min(1.4, targetZoom * (e.deltaY < 0 ? 1.09 : 0.92)));
    lastInteract = performance.now();
  }, { passive: false });

  /* ─────────── 尺寸 ─────────── */
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = cv.getBoundingClientRect();
    W = Math.max(200, rect.width);
    H = Math.max(220, rect.height);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    CX = W / 2; CY = H / 2;
    U = Math.min(W, H) * 0.435;
  }
  new ResizeObserver(resize).observe(cv);
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.02 }).observe(cv);

  initDust();
  resize();
  requestAnimationFrame(frame);
})();
