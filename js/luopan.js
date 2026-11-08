/* ═══════════════════════════════════════════════
 * 三维分层罗盘 luopan.js  v2 · 真实罗盘制式
 * 外盘方座 + 七层盘面悬浮展开(爆炸图式)
 *   底座 → 二十八宿 → 廿四节气 → 二十四山
 *        → 洛书九星 → 先天八卦 → 天池磁针
 * 性能:全部盘面预烘离屏精灵,每帧仅仿射贴图
 * 交互:拖动旋转视角(上拖合拢/下拖展开)· 滚轮缩放 · 层距调节
 * ═══════════════════════════════════════════════ */
(function () {
  'use strict';

  const cv = document.getElementById('luopan');
  if (!cv) return;
  const ctx = cv.getContext('2d');

  /* ─────────── 盘面数据 ─────────── */
  const XIU = ['角','亢','氐','房','心','尾','箕','斗','牛','女','虚','危','室','壁','奎','娄','胃','昴','毕','觜','参','井','鬼','柳','星','张','翼','轸'];
  const SHAN = ['壬','子','癸','丑','艮','寅','甲','卯','乙','辰','巽','巳','丙','午','丁','未','坤','申','庚','酉','辛','戌','乾','亥']; // 子正北(下)
  const JIE = LUNAR_TABLE.solarTerm; // 小寒..冬至
  const LUOSHU = ['九紫','二黑','七赤','六白','一白','八白','三碧','四绿']; // 自上(离南)顺时针,五黄居中
  const BAGUA = ['乾','巽','坎','艮','坤','震','离','兑']; // 先天方位:乾南(上)顺时针
  const BAGUA_ROWS = { '乾':[1,1,1], '兑':[0,1,1], '离':[1,0,1], '震':[0,0,1], '巽':[1,1,0], '坎':[0,1,0], '艮':[1,0,0], '坤':[0,0,0] };

  const GOLD = '#e8c37a', GOLD_HI = '#f7e3b1', RED = 'rgba(186,62,58,';
  const FONT = "'Noto Serif SC','KaiTi','STKaiti',serif";

  /* 层定义:自下而上。rIn/rOut 为圈层带半径,unit 为盘单位半径 */
  const LAYERS = [
    { id: 'base',    kind: 'base', R: 1.36, rot: 0 },
    { id: 'xiu',     kind: 'ring', R: 1.20, rIn: 0.985, rOut: 1.165, n: 28, text: XIU,  color: '#9fc6ff', fs: 0.062, rot: 0.028,  start: 90 },
    { id: 'jie',     kind: 'ring', R: 0.99, rIn: 0.805, rOut: 0.975, n: 24, text: JIE,  color: '#7de8a8', fs: 0.055, rot: -0.022, start: 195, two: true },
    { id: 'shan',    kind: 'ring', R: 0.80, rIn: 0.605, rOut: 0.795, n: 24, text: SHAN, color: GOLD_HI,   fs: 0.100, rot: 0.016,  start: 165 },
    { id: 'luoshu',  kind: 'ring', R: 0.60, rIn: 0.435, rOut: 0.595, n: 8,  text: LUOSHU, color: '#6fd3ff', fs: 0.070, rot: -0.026, start: 0, two: true },
    { id: 'bagua',   kind: 'bagua', R: 0.44, rIn: 0.175, rOut: 0.435, n: 8, text: BAGUA, color: '#f0a56a', rot: 0.034, start: 0 },
    { id: 'tianchi', kind: 'tianchi', R: 0.30, rot: -0.02 }
  ];
  const MID = (LAYERS.length - 1) / 2;

  /* ─────────── 离屏精灵烘焙 ─────────── */
  const BAKE = 1120;                 // 最大精灵边长(px)
  const K = BAKE / 2 / 1.37;         // 烘焙比例尺 px/unit(按最大盘定)
  const rr = (r) => r * K;           // 单位半径 → 烘焙像素
  const sprites = {};
  let haloSprite = null;

  function mkCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  function bakeDisc(layer) {
    const size = Math.ceil(layer.R * 2 * K) + 8;
    const c = mkCanvas(size, size);
    const g = c.getContext('2d');
    const cx = size / 2, cy = size / 2, k = K;
    g.translate(cx, cy);

    if (layer.kind === 'base') return bakeBase(c, g, k);
    if (layer.kind === 'tianchi') return bakeTianchi(c, g, k);

    /* 盘面:半透明琉璃圈带 */
    g.beginPath();
    g.arc(0, 0, rr(layer.R - 0.012), 0, 6.2832);
    g.arc(0, 0, rr(layer.rIn + 0.008), 0, 6.2832, true);
    g.fillStyle = 'rgba(9, 12, 28, 0.80)';
    g.fill();
    /* 内孔微光 */
    g.beginPath(); g.arc(0, 0, rr(layer.rIn + 0.008), 0, 6.2832);
    g.strokeStyle = 'rgba(232,195,122,0.14)'; g.lineWidth = 1.5; g.stroke();

    /* 外缘金环(烘焙光晕) */
    g.beginPath(); g.arc(0, 0, rr(layer.R - 0.012), 0, 6.2832);
    g.strokeStyle = 'rgba(232,195,122,0.85)'; g.lineWidth = 2.6;
    g.shadowColor = 'rgba(232,195,122,0.8)'; g.shadowBlur = 12; g.stroke();
    g.shadowBlur = 0;
    g.beginPath(); g.arc(0, 0, rr(layer.R - 0.012) - 4, 0, 6.2832);
    g.strokeStyle = 'rgba(232,195,122,0.22)'; g.lineWidth = 1; g.stroke();

    /* 辐条分区线(与文字起始角对齐,字符位于扇区中央) */
    const n = layer.n, step = Math.PI * 2 / n;
    const a0 = layer.start * Math.PI / 180 - Math.PI / 2;
    for (let i = 0; i < n; i++) {
      const a = a0 + i * step;
      g.beginPath();
      g.moveTo(Math.cos(a) * rr(layer.rIn + 0.01), Math.sin(a) * rr(layer.rIn + 0.01));
      g.lineTo(Math.cos(a) * rr(layer.rOut - 0.01), Math.sin(a) * rr(layer.rOut - 0.01));
      g.strokeStyle = 'rgba(232,195,122,0.20)';
      g.lineWidth = layer.id === 'shan' ? 1.6 : 1;
      g.stroke();
    }

    if (layer.kind === 'bagua') { bakeBagua(g, layer, k); return c; }

    /* 环上文字:字头朝外 */
    const rMid = (layer.rIn + layer.rOut) / 2;
    g.fillStyle = layer.color;
    g.shadowColor = layer.color; g.shadowBlur = 7;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `600 ${Math.round(rr(layer.fs))}px ${FONT}`;
    for (let i = 0; i < n; i++) {
      const a = (layer.start * Math.PI / 180) + (i + 0.5) * step;
      g.save();
      g.rotate(a);
      g.translate(0, -rr(rMid));   // 该处字头朝外(上方)
      const txt = layer.text[i];
      if (layer.two) {
        const half = rr(layer.fs) * 0.62;
        g.fillText(txt[0], 0, -half);
        g.fillText(txt[1], 0, half);
      } else {
        g.fillText(txt, 0, 0);
      }
      g.restore();
    }
    g.shadowBlur = 0;

    /* 二十八宿盘:外缘细分刻度环 */
    if (layer.id === 'xiu') {
      for (let i = 0; i < 72; i++) {
        const a = i / 72 * Math.PI * 2;
        const r0 = rr(layer.R - 0.052), r1 = rr(layer.R - 0.028);
        g.beginPath();
        g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
        g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
        g.strokeStyle = i % 9 === 0 ? 'rgba(159,198,255,0.6)' : 'rgba(159,198,255,0.22)';
        g.lineWidth = i % 9 === 0 ? 2 : 1;
        g.stroke();
      }
    }
    return c;
  }

  /* 先天八卦:三爻横条(垂直于半径)+ 卦名 */
  function bakeBagua(g, layer, k) {
    const n = 8, step = Math.PI * 2 / n;
    for (let i = 0; i < n; i++) {
      const a = (layer.start * Math.PI / 180) + (i + 0.5) * step;
      g.save();
      g.rotate(a);
      g.translate(0, -rr((layer.rIn + layer.rOut) / 2));
      const name = layer.text[i];
      const rows = BAGUA_ROWS[name];
      const w = rr(0.135), lw = rr(0.02), gap = rr(0.045);
      g.strokeStyle = layer.color;
      g.shadowColor = layer.color; g.shadowBlur = 6;
      g.lineCap = 'round';
      g.lineWidth = lw;
      for (let r = 0; r < 3; r++) {   // 自外向内为上爻→下爻
        const yy = -rr(0.022) + (r - 1) * gap;
        if (rows[r] === 1) {
          g.beginPath(); g.moveTo(-w / 2, yy); g.lineTo(w / 2, yy); g.stroke();
        } else {
          g.beginPath(); g.moveTo(-w / 2, yy); g.lineTo(-w / 8, yy); g.stroke();
          g.beginPath(); g.moveTo(w / 8, yy); g.lineTo(w / 2, yy); g.stroke();
        }
      }
      /* 卦名 */
      g.shadowBlur = 5;
      g.fillStyle = layer.color;
      g.font = `600 ${Math.round(rr(0.062))}px ${FONT}`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(name, 0, rr(0.135));
      g.restore();
    }
    g.shadowBlur = 0;
  }

  /* 外盘方座:天圆地方 · 红十字定向线 · 四角添盘 */
  function bakeBase(c, g, k) {
    const half = rr(1.34);
    g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 26;
    g.fillStyle = 'rgba(15, 11, 22, 0.88)';
    g.beginPath();
    if (g.roundRect) g.roundRect(-half, -half, half * 2, half * 2, 14);
    else g.rect(-half, -half, half * 2, half * 2);
    g.fill();
    g.shadowBlur = 0;
    /* 双层金边 */
    g.strokeStyle = 'rgba(232,195,122,0.8)'; g.lineWidth = 3;
    g.beginPath();
    if (g.roundRect) g.roundRect(-half + 3, -half + 3, half * 2 - 6, half * 2 - 6, 12);
    else g.rect(-half + 3, -half + 3, half * 2 - 6, half * 2 - 6);
    g.stroke();
    g.strokeStyle = 'rgba(232,195,122,0.25)'; g.lineWidth = 1;
    g.beginPath();
    if (g.roundRect) g.roundRect(-half + 12, -half + 12, half * 2 - 24, half * 2 - 24, 9);
    else g.rect(-half + 12, -half + 12, half * 2 - 24, half * 2 - 24);
    g.stroke();
    /* 红十字定向线 */
    g.strokeStyle = RED + '0.85)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-half + 14, 0); g.lineTo(half - 14, 0); g.stroke();
    g.beginPath(); g.moveTo(0, -half + 14); g.lineTo(0, half - 14); g.stroke();
    g.strokeStyle = RED + '0.35)'; g.lineWidth = 1;
    for (const d of [-0.62, 0.62]) {
      g.beginPath(); g.moveTo(-half + 14, d * k); g.lineTo(half - 14, d * k); g.stroke();
      g.beginPath(); g.moveTo(d * k, -half + 14); g.lineTo(d * k, half - 14); g.stroke();
    }
    /* 四角添盘(装饰圆) */
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const x = sx * half * 0.66, y = sy * half * 0.66;
      g.beginPath(); g.arc(x, y, rr(0.085), 0, 6.2832);
      g.fillStyle = 'rgba(26, 19, 34, 0.9)'; g.fill();
      g.strokeStyle = 'rgba(232,195,122,0.55)'; g.lineWidth = 1.6; g.stroke();
      g.beginPath(); g.arc(x, y, rr(0.045), 0, 6.2832);
      g.strokeStyle = RED + '0.7)'; g.lineWidth = 1.2; g.stroke();
    }
    return c;
  }

  /* 天池:太极伏针 */
  function bakeTianchi(c, g, k) {
    const R = 0.30 * k;
    /* 盘体 */
    g.beginPath(); g.arc(0, 0, R, 0, 6.2832);
    g.fillStyle = 'rgba(9, 12, 28, 0.92)'; g.fill();
    g.strokeStyle = 'rgba(232,195,122,0.9)'; g.lineWidth = 2.8;
    g.shadowColor = 'rgba(232,195,122,0.9)'; g.shadowBlur = 14; g.stroke();
    g.shadowBlur = 0;
    /* 天池内圈 + 卯酉十字红线 */
    g.beginPath(); g.arc(0, 0, R * 0.66, 0, 6.2832);
    g.fillStyle = 'rgba(16, 20, 44, 0.95)'; g.fill();
    g.strokeStyle = RED + '0.75)'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(-R * 0.66, 0); g.lineTo(R * 0.66, 0); g.stroke();
    g.beginPath(); g.moveTo(0, -R * 0.66); g.lineTo(0, R * 0.66); g.stroke();
    g.strokeStyle = 'rgba(232,195,122,0.5)'; g.lineWidth = 1.2;
    g.beginPath(); g.arc(0, 0, R * 0.66, 0, 6.2832); g.stroke();
    /* 太极 */
    const r = R * 0.46;
    g.beginPath(); g.arc(0, 0, r, 0, 6.2832); g.fillStyle = '#0d1130'; g.fill();
    g.beginPath(); g.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false); g.closePath();
    g.fillStyle = GOLD; g.shadowColor = 'rgba(232,195,122,0.85)'; g.shadowBlur = 12; g.fill();
    g.beginPath(); g.arc(0, -r / 2, r / 2, 0, 6.2832); g.fill();
    g.shadowBlur = 0;
    g.beginPath(); g.arc(0, r / 2, r / 2, 0, 6.2832); g.fillStyle = '#0d1130'; g.fill();
    g.beginPath(); g.arc(0, -r / 2, r / 6.5, 0, 6.2832); g.fillStyle = '#0d1130'; g.fill();
    g.beginPath(); g.arc(0, r / 2, r / 6.5, 0, 6.2832); g.fillStyle = GOLD; g.fill();
    return c;
  }

  function bakeShadows() {
    /* 整体背景光晕精灵(单次贴图,替代逐层柔影) */
    const s = 512;
    haloSprite = mkCanvas(s, s);
    const g = haloSprite.getContext('2d');
    const grad = g.createRadialGradient(s / 2, s / 2, s * 0.08, s / 2, s / 2, s / 2);
    grad.addColorStop(0, 'rgba(232,195,122,0.13)');
    grad.addColorStop(0.45, 'rgba(120,90,180,0.08)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.beginPath(); g.arc(s / 2, s / 2, s / 2, 0, 6.2832); g.fill();
  }

  function bakeAll() {
    for (const layer of LAYERS) sprites[layer.id] = bakeDisc(layer);
  }

  /* ─────────── 视图状态 ─────────── */
  let W = 0, H = 0, CX = 0, CY = 0, U = 0, dpr = 1, px = 1;
  let yaw = -0.55, pitch = 0.95, pitchTarget = 0.95;
  let zoom = 1, targetZoom = 1;
  let gapFactor = 1.0;
  let vyaw = 0, dragging = false, lastX = 0, lastY = 0, lastInteract = -1e9;
  let visible = true;

  /* 层世界高度(单位) */
  const Y_STEP = 0.30;
  function layerY(k, t) {
    const bob = Math.sin(t * 0.0009 + k * 0.9) * 0.012;
    return (k - MID) * Y_STEP * gapFactor + bob;
  }
  /* 仿射矩阵:盘面(unit) → 屏幕。返回 {a,b,c,d,tx,ty,sinP} */
  function layerMatrix(k, alphaSelf, t) {
    const y = layerY(k, t);
    const cy_ = Math.cos(yaw), sy_ = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const depthScale = 1 + 0.05 * (y / (LAYERS.length * Y_STEP)) * sp; // 轻透视感
    const a = cy_ * U * zoom * depthScale;
    const b = -sy_ * sp * U * zoom * depthScale;
    const c = sy_ * U * zoom * depthScale;
    const d = cy_ * sp * U * zoom * depthScale;
    const tx = CX, ty = CY - y * cp * U * zoom;
    const ca = Math.cos(alphaSelf), sa = Math.sin(alphaSelf);
    return {
      a: a * ca + c * sa, b: b * ca + d * sa,
      c: c * ca - a * sa, d: d * ca - b * sa,
      tx, ty
    };
  }
  /* 盘面局部坐标 → 屏幕(用于磁针) */
  function localToScreen(m, lx, ly) {
    return { x: m.a * lx + m.c * ly + m.tx, y: m.b * lx + m.d * ly + m.ty };
  }

  /* ─────────── 主循环 ─────────── */
  let lastT = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || document.hidden || W === 0) { lastT = now; return; }
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;

    if (!dragging) {
      yaw += vyaw; vyaw *= 0.93;
      if (now - lastInteract > 2600) yaw += 0.05 * dt;
    }
    pitch += (pitchTarget - pitch) * 0.07;
    zoom += (targetZoom - zoom) * 0.1;
    drawFrame(now);
  }

  /* 纯绘制(可独立调用,便于性能诊断) */
  function drawFrame(now) {
    const sp = Math.sin(pitch);
    const spinK = 1.2 - sp;   // 合拢时近乎静止(真实罗盘制式)

    ctx.setTransform(px, 0, 0, px, 0, 0);
    ctx.clearRect(0, 0, W, H);
    CX = W / 2; CY = H * 0.485 + Math.sin(now * 0.0006) * 3;

    /* 整体光晕(单次贴图) */
    const haloSize = 3.4 * U * zoom;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(haloSprite, CX - haloSize / 2, CY - haloSize / 2, haloSize, haloSize);
    ctx.globalAlpha = 1;

    /* 由下而上贴层(全盘同轴慢旋 —— 真实罗盘各圈层铆合对齐) */
    const spin = now * 0.000022 * spinK + 0.4;
    for (let k = 0; k < LAYERS.length; k++) {
      const layer = LAYERS[k];
      const m = layerMatrix(k, spin, now);
      const spr = sprites[layer.id];
      ctx.save();
      ctx.setTransform(m.a * px, m.b * px, m.c * px, m.d * px, m.tx * px, m.ty * px);
      ctx.scale(1 / K, 1 / K);
      ctx.globalAlpha = layer.kind === 'base' ? 1 : 0.96;
      ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
      ctx.restore();
    }

    /* 磁针(画于天池层坐标系:锁定卯酉线,红针指南,微微游摆) */
    const topK = LAYERS.length - 1;
    const nm = layerMatrix(topK, spin, now);
    const na = Math.sin(now * 0.0009) * 0.05 + Math.sin(now * 0.0021) * 0.02;
    const ca = Math.cos(na), sa = Math.sin(na);
    const P = (lx, ly) => localToScreen(nm, lx * ca - ly * sa, lx * sa + ly * ca);
    const tipS = P(0, -0.19), tipN = P(0, 0.19), w1 = P(0.024, 0.012), w2 = P(-0.024, 0.012);
    ctx.save();
    ctx.setTransform(px, 0, 0, px, 0, 0);
    /* 南针(朱砂,指向盘面上方=午位) */
    ctx.beginPath();
    ctx.moveTo(tipS.x, tipS.y); ctx.lineTo(w1.x, w1.y); ctx.lineTo(w2.x, w2.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(196, 66, 60, 0.95)';
    ctx.shadowColor = 'rgba(196,66,60,0.8)'; ctx.shadowBlur = 8; ctx.fill();
    /* 北针(鎏金,指向子位) */
    ctx.beginPath();
    ctx.moveTo(tipN.x, tipN.y); ctx.lineTo(w1.x, w1.y); ctx.lineTo(w2.x, w2.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(240, 220, 170, 0.95)';
    ctx.shadowColor = 'rgba(240,220,170,0.9)'; ctx.shadowBlur = 8; ctx.fill();
    ctx.shadowBlur = 0;
    /* 天心 pivot */
    ctx.beginPath();
    ctx.arc((tipN.x + tipS.x) / 2, (tipN.y + tipS.y) / 2, 2.6 * zoom, 0, 6.2832);
    ctx.fillStyle = GOLD; ctx.fill();
    ctx.restore();

    ctx.globalAlpha = 1;
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
    /* 上拖(dy<0)增大俯角 → 合拢成正对罗盘;下拖 → 展开分层 */
    pitchTarget = Math.max(0.42, Math.min(1.53, pitchTarget - dy * 0.006));
    pitch = Math.max(0.42, Math.min(1.53, pitch - dy * 0.006));
    vyaw = dx * 0.0022;
    lastInteract = performance.now();
  });
  const endDrag = () => { dragging = false; lastInteract = performance.now(); };
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', endDrag);
  cv.addEventListener('wheel', (e) => {
    e.preventDefault();
    targetZoom = Math.max(0.72, Math.min(1.45, targetZoom * (e.deltaY < 0 ? 1.09 : 0.92)));
    lastInteract = performance.now();
  }, { passive: false });

  /* 控件:层距滑杆 + 合拢/展开 */
  const gapRange = document.getElementById('gapRange');
  if (gapRange) gapRange.addEventListener('input', () => { gapFactor = gapRange.value / 100; });
  const btnCollapse = document.getElementById('btnCollapse');
  if (btnCollapse) btnCollapse.addEventListener('click', () => { pitchTarget = 1.52; lastInteract = performance.now(); });
  const btnExpand = document.getElementById('btnExpand');
  if (btnExpand) btnExpand.addEventListener('click', () => { pitchTarget = 0.62; lastInteract = performance.now(); });

  /* ─────────── 尺寸 ─────────── */
  /* 性能:内部分辨率封顶(软件渲染友好),CSS 负责放大 */
  function resize() {
    const rect = cv.getBoundingClientRect();
    W = Math.max(200, rect.width);
    H = Math.max(220, rect.height);
    const dprRaw = window.devicePixelRatio || 1;
    dpr = dprRaw;
    px = Math.min(dprRaw, 1.25) * Math.min(1, 860 / W);
    cv.width = Math.round(W * px); cv.height = Math.round(H * px);
    CX = W / 2; CY = H * 0.485;
    U = Math.min(W * 0.42, H * 0.30);
  }
  new ResizeObserver(resize).observe(cv);
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.02 }).observe(cv);

  /* ─────────── 启动 ─────────── */
  bakeShadows();
  bakeAll();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => bakeAll());   // 字体就绪后重烘,保证字形
  }
  resize();
  requestAnimationFrame(frame);

  /* 性能诊断钩子(不影响运行) */
  window.__luopanDebug = {
    drawFrame,
    set(p, g) { if (p !== undefined) { pitch = pitchTarget = p; } if (g !== undefined) { gapFactor = g; } }
  };
})();
