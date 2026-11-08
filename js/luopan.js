/* ═══════════════════════════════════════════════
 * 三维分层罗盘 luopan.js  v3 · 珐琅鎏金制式
 * 外盘方座 + 七层盘面悬浮展开(爆炸图式)
 *   底座 → 二十八宿 → 廿四节气 → 二十四山
 *        → 洛书九星 → 先天八卦 → 天池磁针
 * 视觉:每层珐琅釉色渐变 · 多重细金线 · 密集刻度环 · 扇界珠饰
 * 性能:全部盘面预烘离屏精灵,每帧仅十余次仿射贴图
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

  /* 层定义:自下而上。rIn/rOut 圈层带,unit 为盘单位半径
   * tintIn/tintOut:圈带珐琅釉色渐变(内→外) */
  const LAYERS = [
    { id: 'base',    kind: 'base', R: 1.36, rot: 0 },
    { id: 'xiu',     kind: 'ring', R: 1.20, rIn: 0.975, rOut: 1.155, n: 28, text: XIU,  color: '#b4d4ff', fs: 0.070, start: 90,  two: false,
      tintIn: 'rgba(30,48,102,0.92)',  tintOut: 'rgba(12,20,52,0.94)',  edge: '#8fb8ff' },
    { id: 'jie',     kind: 'ring', R: 0.99, rIn: 0.795, rOut: 0.970, n: 24, text: JIE,  color: '#93f0bc', fs: 0.064, start: 195, two: true,
      tintIn: 'rgba(16,66,50,0.92)',   tintOut: 'rgba(8,38,30,0.94)',   edge: '#7de8a8' },
    { id: 'shan',    kind: 'ring', R: 0.80, rIn: 0.585, rOut: 0.790, n: 24, text: SHAN, color: '#ffe6a8', fs: 0.118, start: 165, two: false, hero: true,
      tintIn: 'rgba(96,68,22,0.92)',   tintOut: 'rgba(44,30,10,0.94)',  edge: '#e8c37a' },
    { id: 'luoshu',  kind: 'ring', R: 0.60, rIn: 0.425, rOut: 0.590, n: 8,  text: LUOSHU, color: '#93d8ff', fs: 0.080, start: 0, two: true,
      tintIn: 'rgba(22,54,96,0.92)',   tintOut: 'rgba(10,30,58,0.94)',  edge: '#6fd3ff' },
    { id: 'bagua',   kind: 'bagua', R: 0.44, rIn: 0.170, rOut: 0.435, n: 8,  text: BAGUA, color: '#ffbe86', start: 0,
      tintIn: 'rgba(84,46,20,0.92)',   tintOut: 'rgba(40,22,10,0.94)',  edge: '#f0a56a' },
    { id: 'tianchi', kind: 'tianchi', R: 0.30 }
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

  /* 通用:圈带珐琅底 + 双重金缘 + 辐线 + 刻度环 + 扇界珠饰 */
  function paintRingFace(g, layer) {
    const rIn = rr(layer.rIn), rOut = rr(layer.rOut), rD = rr(layer.R - 0.012);
    /* 珐琅釉色渐变 */
    const gr = g.createRadialGradient(0, 0, rIn, 0, 0, rD);
    gr.addColorStop(0, layer.tintIn);
    gr.addColorStop(1, layer.tintOut);
    g.beginPath();
    g.arc(0, 0, rD, 0, 6.2832);
    g.arc(0, 0, rIn, 0, 6.2832, true);
    g.fillStyle = gr;
    g.fill();

    /* 外缘:鎏金双环 */
    g.beginPath(); g.arc(0, 0, rD, 0, 6.2832);
    g.strokeStyle = 'rgba(232,195,122,0.95)'; g.lineWidth = 3;
    g.shadowColor = 'rgba(232,195,122,0.85)'; g.shadowBlur = 13; g.stroke();
    g.shadowBlur = 0;
    g.beginPath(); g.arc(0, 0, rD - 5, 0, 6.2832);
    g.strokeStyle = 'rgba(232,195,122,0.30)'; g.lineWidth = 1; g.stroke();
    /* 内缘:亮线 + 柔线 */
    g.beginPath(); g.arc(0, 0, rIn, 0, 6.2832);
    g.strokeStyle = 'rgba(232,195,122,0.55)'; g.lineWidth = 1.6;
    g.shadowColor = 'rgba(232,195,122,0.5)'; g.shadowBlur = 7; g.stroke();
    g.shadowBlur = 0;
    g.beginPath(); g.arc(0, 0, rIn + 4, 0, 6.2832);
    g.strokeStyle = 'rgba(232,195,122,0.16)'; g.lineWidth = 1; g.stroke();

    /* 外缘细刻度环(余量区) */
    const tickN = layer.hero ? 96 : 72;
    for (let i = 0; i < tickN; i++) {
      const a = i / tickN * 6.2832;
      const major = i % (tickN / (layer.hero ? 24 : 12)) === 0;
      const r1 = rD - 3.5, r0 = r1 - (major ? 9 : 5);
      g.beginPath();
      g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      g.strokeStyle = major ? 'rgba(232,195,122,0.65)' : 'rgba(232,195,122,0.26)';
      g.lineWidth = major ? 1.8 : 1;
      g.stroke();
    }

    /* 辐条分区线(对齐文字起始角) */
    const n = layer.n, step = Math.PI * 2 / n;
    const a0 = layer.start * Math.PI / 180 - Math.PI / 2;
    g.strokeStyle = 'rgba(232,195,122,0.30)';
    g.lineWidth = layer.hero ? 1.8 : 1.2;
    for (let i = 0; i < n; i++) {
      const a = a0 + i * step;
      g.beginPath();
      g.moveTo(Math.cos(a) * (rIn + 3), Math.sin(a) * (rIn + 3));
      g.lineTo(Math.cos(a) * (rD - 5), Math.sin(a) * (rD - 5));
      g.stroke();
    }
    /* 扇区中线(若每扇区两行字则分隔) */
    if (layer.two) {
      g.strokeStyle = 'rgba(232,195,122,0.12)'; g.lineWidth = 1;
      for (let i = 0; i < n; i++) {
        const a = a0 + (i + 0.5) * step;
        g.beginPath();
        g.moveTo(Math.cos(a) * (rIn + 3), Math.sin(a) * (rIn + 3));
        g.lineTo(Math.cos(a) * (rOut - 2), Math.sin(a) * (rOut - 2));
        g.stroke();
      }
    }
    /* 扇界珠饰 */
    const rMid = (layer.rIn + layer.rOut) / 2;
    g.fillStyle = GOLD;
    g.shadowColor = 'rgba(232,195,122,0.9)'; g.shadowBlur = 6;
    for (let i = 0; i < n; i++) {
      const a = a0 + i * step;
      g.beginPath();
      g.arc(Math.cos(a) * rr(rMid), Math.sin(a) * rr(rMid), layer.hero ? 3 : 2.2, 0, 6.2832);
      g.fill();
    }
    g.shadowBlur = 0;
  }

  function bakeDisc(layer) {
    const size = Math.ceil(layer.R * 2 * K) + 8;
    const c = mkCanvas(size, size);
    const g = c.getContext('2d');
    g.translate(size / 2, size / 2);

    if (layer.kind === 'base') return bakeBase(c, g);
    if (layer.kind === 'tianchi') return bakeTianchi(c, g);

    paintRingFace(g, layer);

    if (layer.kind === 'bagua') { bakeBagua(g, layer); return c; }

    /* 环上文字:字头朝外,鎏光 */
    const rMid = (layer.rIn + layer.rOut) / 2;
    const n = layer.n, step = Math.PI * 2 / n;
    g.fillStyle = layer.color;
    g.shadowColor = layer.hero ? 'rgba(255,214,130,0.95)' : layer.color;
    g.shadowBlur = layer.hero ? 10 : 7;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `${layer.hero ? 900 : 600} ${Math.round(rr(layer.fs))}px ${FONT}`;
    for (let i = 0; i < n; i++) {
      const a = (layer.start * Math.PI / 180) + (i + 0.5) * step;
      g.save();
      g.rotate(a);
      g.translate(0, -rr(rMid));
      const txt = layer.text[i];
      if (layer.two) {
        const half = rr(layer.fs) * 0.60;
        g.fillText(txt[0], 0, -half);
        g.fillText(txt[1], 0, half);
      } else {
        g.fillText(txt, 0, 0);
      }
      g.restore();
    }
    g.shadowBlur = 0;
    return c;
  }

  /* 先天八卦:三爻横条(垂直于半径)+ 卦名 */
  function bakeBagua(g, layer) {
    const n = 8, step = Math.PI * 2 / n;
    for (let i = 0; i < n; i++) {
      const a = (layer.start * Math.PI / 180) + (i + 0.5) * step;
      g.save();
      g.rotate(a);
      g.translate(0, -rr((layer.rIn + layer.rOut) / 2));
      const name = layer.text[i];
      const rows = BAGUA_ROWS[name];
      const w = rr(0.150), lw = rr(0.024), gap = rr(0.052);
      g.strokeStyle = layer.color;
      g.shadowColor = layer.color; g.shadowBlur = 8;
      g.lineCap = 'round';
      g.lineWidth = lw;
      for (let r = 0; r < 3; r++) {   // 自外向内为上爻→下爻
        const yy = -rr(0.030) + (r - 1) * gap;
        if (rows[r] === 1) {
          g.beginPath(); g.moveTo(-w / 2, yy); g.lineTo(w / 2, yy); g.stroke();
        } else {
          g.beginPath(); g.moveTo(-w / 2, yy); g.lineTo(-w / 8, yy); g.stroke();
          g.beginPath(); g.moveTo(w / 8, yy); g.lineTo(w / 2, yy); g.stroke();
        }
      }
      /* 卦名 */
      g.shadowBlur = 6;
      g.fillStyle = layer.color;
      g.font = `900 ${Math.round(rr(0.070))}px ${FONT}`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(name, 0, rr(0.150));
      g.restore();
    }
    g.shadowBlur = 0;
  }

  /* 外盘方座:木釉底 · 鎏金重缘 · 红十字定向 · 四角添盘 */
  function bakeBase(c, g) {
    const half = rr(1.34);
    /* 投影 */
    g.shadowColor = 'rgba(0,0,0,0.65)'; g.shadowBlur = 30;
    /* 木釉渐变底 */
    const wd = g.createLinearGradient(-half, -half, half, half);
    wd.addColorStop(0, 'rgba(46, 32, 20, 0.95)');
    wd.addColorStop(0.5, 'rgba(28, 19, 13, 0.95)');
    wd.addColorStop(1, 'rgba(16, 11, 8, 0.95)');
    g.fillStyle = wd;
    g.beginPath();
    if (g.roundRect) g.roundRect(-half, -half, half * 2, half * 2, 16);
    else g.rect(-half, -half, half * 2, half * 2);
    g.fill();
    g.shadowBlur = 0;
    /* 内里暗晕(中心微亮) */
    const cg = g.createRadialGradient(0, 0, half * 0.1, 0, 0, half);
    cg.addColorStop(0, 'rgba(70, 50, 30, 0.30)');
    cg.addColorStop(1, 'rgba(0,0,0,0.25)');
    g.fillStyle = cg;
    g.beginPath();
    if (g.roundRect) g.roundRect(-half, -half, half * 2, half * 2, 16);
    else g.rect(-half, -half, half * 2, half * 2);
    g.fill();
    /* 錾刻纹:同心圈 + 二十四放射暗线 */
    g.strokeStyle = 'rgba(232,195,122,0.09)'; g.lineWidth = 1;
    for (const r0 of [0.42, 0.72, 1.02, 1.24]) {
      g.beginPath(); g.arc(0, 0, rr(r0), 0, 6.2832); g.stroke();
    }
    g.strokeStyle = 'rgba(232,195,122,0.055)';
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * 6.2832;
      g.beginPath();
      g.moveTo(Math.cos(a) * rr(0.2), Math.sin(a) * rr(0.2));
      g.lineTo(Math.cos(a) * rr(1.28), Math.sin(a) * rr(1.28));
      g.stroke();
    }
    /* 鎏金重缘 ×2 */
    g.strokeStyle = 'rgba(232,195,122,0.95)'; g.lineWidth = 3.5;
    g.shadowColor = 'rgba(232,195,122,0.8)'; g.shadowBlur = 14;
    g.beginPath();
    if (g.roundRect) g.roundRect(-half + 3, -half + 3, half * 2 - 6, half * 2 - 6, 14);
    else g.rect(-half + 3, -half + 3, half * 2 - 6, half * 2 - 6);
    g.stroke();
    g.shadowBlur = 0;
    g.strokeStyle = 'rgba(232,195,122,0.35)'; g.lineWidth = 1.2;
    g.beginPath();
    if (g.roundRect) g.roundRect(-half + 13, -half + 13, half * 2 - 26, half * 2 - 26, 10);
    else g.rect(-half + 13, -half + 13, half * 2 - 26, half * 2 - 26);
    g.stroke();
    /* 朱砂十字定向线 + 平行细线 */
    g.strokeStyle = RED + '0.9)'; g.lineWidth = 2.4;
    g.shadowColor = 'rgba(200,70,60,0.7)'; g.shadowBlur = 8;
    g.beginPath(); g.moveTo(-half + 15, 0); g.lineTo(half - 15, 0); g.stroke();
    g.beginPath(); g.moveTo(0, -half + 15); g.lineTo(0, half - 15); g.stroke();
    g.shadowBlur = 0;
    g.strokeStyle = RED + '0.4)'; g.lineWidth = 1;
    for (const d of [-0.60, -0.30, 0.30, 0.60]) {
      g.beginPath(); g.moveTo(-half + 15, d * K); g.lineTo(half - 15, d * K); g.stroke();
      g.beginPath(); g.moveTo(d * K, -half + 15); g.lineTo(d * K, half - 15); g.stroke();
    }
    /* 四角添盘:三重环 + 花瓣刻 */
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const x = sx * half * 0.64, y = sy * half * 0.64;
      g.beginPath(); g.arc(x, y, rr(0.105), 0, 6.2832);
      g.fillStyle = 'rgba(30, 21, 15, 0.95)'; g.fill();
      g.strokeStyle = 'rgba(232,195,122,0.75)'; g.lineWidth = 2; g.stroke();
      g.beginPath(); g.arc(x, y, rr(0.070), 0, 6.2832);
      g.strokeStyle = 'rgba(232,195,122,0.35)'; g.lineWidth = 1; g.stroke();
      /* 花瓣刻 8 */
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * 6.2832 + 0.39;
        g.beginPath();
        g.moveTo(x + Math.cos(a) * rr(0.048), y + Math.sin(a) * rr(0.048));
        g.lineTo(x + Math.cos(a) * rr(0.066), y + Math.sin(a) * rr(0.066));
        g.strokeStyle = 'rgba(232,195,122,0.5)'; g.lineWidth = 1.4; g.stroke();
      }
      g.beginPath(); g.arc(x, y, rr(0.026), 0, 6.2832);
      g.fillStyle = RED + '0.85)'; g.fill();
    }
    /* 四边中点菱形钉 */
    g.fillStyle = GOLD;
    for (const [ex, ey] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const x = ex * (half - 7.5), y = ey * (half - 7.5);
      g.save();
      g.translate(x, y);
      g.rotate(Math.atan2(ey, ex));
      g.beginPath();
      g.moveTo(-7, 0); g.lineTo(0, -4.2); g.lineTo(7, 0); g.lineTo(0, 4.2);
      g.closePath(); g.fill();
      g.restore();
    }
    return c;
  }

  /* 天池:水纹池 · 太极 · 时辰珠 */
  function bakeTianchi(c, g) {
    const R = 0.30 * K;
    /* 盘体珐琅 */
    const body = g.createRadialGradient(0, 0, R * 0.3, 0, 0, R);
    body.addColorStop(0, 'rgba(40, 30, 66, 0.95)');
    body.addColorStop(1, 'rgba(10, 8, 26, 0.96)');
    g.beginPath(); g.arc(0, 0, R, 0, 6.2832);
    g.fillStyle = body; g.fill();
    g.strokeStyle = 'rgba(232,195,122,0.95)'; g.lineWidth = 3;
    g.shadowColor = 'rgba(232,195,122,0.9)'; g.shadowBlur = 15; g.stroke();
    g.shadowBlur = 0;
    g.beginPath(); g.arc(0, 0, R - 6, 0, 6.2832);
    g.strokeStyle = 'rgba(232,195,122,0.30)'; g.lineWidth = 1; g.stroke();
    /* 时辰珠 12 */
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * 6.2832;
      g.beginPath();
      g.arc(Math.cos(a) * R * 0.82, Math.sin(a) * R * 0.82, 2.4, 0, 6.2832);
      g.fillStyle = i % 3 === 0 ? 'rgba(232,195,122,0.9)' : 'rgba(232,195,122,0.45)';
      g.fill();
    }
    /* 水纹池 */
    const pool = g.createRadialGradient(-R * 0.15, -R * 0.15, R * 0.05, 0, 0, R * 0.66);
    pool.addColorStop(0, 'rgba(70, 44, 110, 0.95)');
    pool.addColorStop(0.6, 'rgba(34, 22, 62, 0.95)');
    pool.addColorStop(1, 'rgba(12, 8, 28, 0.95)');
    g.beginPath(); g.arc(0, 0, R * 0.66, 0, 6.2832);
    g.fillStyle = pool; g.fill();
    g.strokeStyle = RED + '0.85)'; g.lineWidth = 1.8;
    g.beginPath(); g.arc(0, 0, R * 0.66, 0, 6.2832); g.stroke();
    /* 卯酉十字红线 */
    g.strokeStyle = RED + '0.8)'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(-R * 0.66, 0); g.lineTo(R * 0.66, 0); g.stroke();
    g.beginPath(); g.moveTo(0, -R * 0.66); g.lineTo(0, R * 0.66); g.stroke();
    /* 太极 */
    const r = R * 0.50;
    g.beginPath(); g.arc(0, 0, r, 0, 6.2832);
    g.fillStyle = '#0d1130'; g.fill();
    g.strokeStyle = 'rgba(232,195,122,0.65)'; g.lineWidth = 1.4; g.stroke();
    g.beginPath(); g.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false); g.closePath();
    g.fillStyle = GOLD;
    g.shadowColor = 'rgba(232,195,122,0.9)'; g.shadowBlur = 14; g.fill();
    g.beginPath(); g.arc(0, -r / 2, r / 2, 0, 6.2832); g.fill();
    g.shadowBlur = 0;
    g.beginPath(); g.arc(0, r / 2, r / 2, 0, 6.2832); g.fillStyle = '#0d1130'; g.fill();
    g.beginPath(); g.arc(0, -r / 2, r / 6.5, 0, 6.2832); g.fillStyle = '#0d1130'; g.fill();
    g.beginPath(); g.arc(0, r / 2, r / 6.5, 0, 6.2832); g.fillStyle = GOLD; g.fill();
    return c;
  }

  function bakeHalo() {
    /* 背景装饰:星轨环 + 环间星点(细实环不依赖大半径渐变,无色带之虞) */
    const s = 1024;
    haloSprite = mkCanvas(s, s);
    const g = haloSprite.getContext('2d');
    g.translate(s / 2, s / 2);
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    /* 四重星轨 */
    const rings = [
      [0.30, 'rgba(160,130,225,0.20)', 1.6],
      [0.48, 'rgba(140,110,215,0.15)', 1.3],
      [0.68, 'rgba(130,100,205,0.11)', 1.1],
      [0.90, 'rgba(232,195,122,0.13)', 1.2]
    ];
    for (const [r0, col, lw] of rings) {
      g.beginPath(); g.arc(0, 0, s * 0.5 * r0, 0, 6.2832);
      g.strokeStyle = col; g.lineWidth = lw;
      g.shadowColor = col; g.shadowBlur = 8;
      g.stroke();
    }
    g.shadowBlur = 0;
    /* 环间星点(疏密随机,金蓝相间) */
    for (let i = 0; i < 130; i++) {
      const t = 0.16 + rnd() * 0.80;
      const a = rnd() * 6.2832;
      const x = Math.cos(a) * s * 0.5 * t, y = Math.sin(a) * s * 0.5 * t;
      const r0 = rnd() < 0.75 ? 1.1 + rnd() * 1.3 : 2.2 + rnd() * 1.4;
      g.globalAlpha = 0.16 + rnd() * 0.4;
      g.fillStyle = rnd() < 0.6 ? '#cfe0ff' : '#e8c37a';
      g.beginPath(); g.arc(x, y, r0, 0, 6.2832); g.fill();
    }
    g.globalAlpha = 1;
  }

  function bakeAll() {
    for (const layer of LAYERS) sprites[layer.id] = bakeDisc(layer);
  }

  /* ─────────── 视图状态 ─────────── */
  let W = 0, H = 0, CX = 0, CY = 0, U = 0, dpr = 1, px = 1;
  let yaw = -0.55, pitch = 0.98, pitchTarget = 0.98;
  let zoom = 1, targetZoom = 1;
  let gapFactor = 1.0;
  let vyaw = 0, dragging = false, lastX = 0, lastY = 0, lastInteract = -1e9;
  let visible = true;

  /* 层世界高度(单位) */
  const Y_STEP = 0.27;
  function layerY(k, t) {
    const bob = Math.sin(t * 0.0009 + k * 0.9) * 0.011;
    return (k - MID) * Y_STEP * gapFactor + bob;
  }
  /* 仿射矩阵:盘面(unit) → 屏幕。返回 {a,b,c,d,tx,ty} */
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

    /* 背景星轨环(单次贴图) */
    const haloSize = 4.6 * U * zoom;
    ctx.drawImage(haloSprite, CX - haloSize / 2, CY - haloSize / 2, haloSize, haloSize);

    /* 由下而上贴层(全盘同轴慢旋 —— 真实罗盘各圈层铆合对齐) */
    const spin = now * 0.000022 * spinK + 0.4;
    for (let k = 0; k < LAYERS.length; k++) {
      const layer = LAYERS[k];
      const m = layerMatrix(k, spin, now);
      const spr = sprites[layer.id];
      ctx.save();
      ctx.setTransform(m.a * px, m.b * px, m.c * px, m.d * px, m.tx * px, m.ty * px);
      ctx.scale(1 / K, 1 / K);
      ctx.globalAlpha = layer.kind === 'base' ? 1 : 0.97;
      ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
      ctx.restore();
    }

    /* 磁针(画于天池层坐标系:锁定卯酉线,红针指南,微微游摆) */
    const topK = LAYERS.length - 1;
    const nm = layerMatrix(topK, spin, now);
    const na = Math.sin(now * 0.0009) * 0.05 + Math.sin(now * 0.0021) * 0.02;
    const ca = Math.cos(na), sa = Math.sin(na);
    const P = (lx, ly) => localToScreen(nm, lx * ca - ly * sa, lx * sa + ly * ca);
    const tipS = P(0, -0.20), tipN = P(0, 0.20), w1 = P(0.026, 0.014), w2 = P(-0.026, 0.014);
    ctx.save();
    ctx.setTransform(px, 0, 0, px, 0, 0);
    /* 南针(朱砂,指向盘面上方=午位) */
    ctx.beginPath();
    ctx.moveTo(tipS.x, tipS.y); ctx.lineTo(w1.x, w1.y); ctx.lineTo(w2.x, w2.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(202, 62, 54, 0.96)';
    ctx.shadowColor = 'rgba(202,66,60,0.9)'; ctx.shadowBlur = 9; ctx.fill();
    /* 北针(鎏金) */
    ctx.beginPath();
    ctx.moveTo(tipN.x, tipN.y); ctx.lineTo(w1.x, w1.y); ctx.lineTo(w2.x, w2.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(244, 224, 176, 0.96)';
    ctx.shadowColor = 'rgba(244,224,176,0.9)'; ctx.shadowBlur = 9; ctx.fill();
    ctx.shadowBlur = 0;
    /* 天心 pivot */
    ctx.beginPath();
    ctx.arc((tipN.x + tipS.x) / 2, (tipN.y + tipS.y) / 2, 2.8 * zoom, 0, 6.2832);
    ctx.fillStyle = GOLD; ctx.fill();
    ctx.strokeStyle = 'rgba(20,12,8,0.8)'; ctx.lineWidth = 1; ctx.stroke();
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
  bakeHalo();
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
