/* ═══════════════════════════════════════════════════════
 * 玄玑历法引擎 lunar.js
 *  - 农历(1900-3000,权威历表,见 table.js)
 *  - 节气:历表定"日",VSOP87 天文算法定时分
 *  - 四柱干支:以立春分界、节气定月、甲子日锚
 *  - 伊斯兰历(表格历法,以新月观测为准)
 *  - 月相
 * 全局暴露:window.LC
 * ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const INFO = LUNAR_TABLE.lunarInfo;      // 农历编码表 1900-3000
  const TERM_INFO = LUNAR_TABLE.sTermInfo; // 节气日编码表
  const TERM_NAMES = LUNAR_TABLE.solarTerm;// 小寒..冬至

  const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
  const GAN_WX = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];
  const ZHI_WX = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水'];
  const WX_COLOR = { '金': 'wx-jin', '木': 'wx-mu', '水': 'wx-shui', '火': 'wx-huo', '土': 'wx-tu' };
  const YUE_CN = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
  const NAYIN = [
    '海中金', '炉中火', '大林木', '路旁土', '剑锋金', '山头火', '涧下水', '城头土', '白蜡金', '杨柳木',
    '泉中水', '屋上土', '霹雳火', '松柏木', '长流水', '砂石金', '山下火', '平地木', '壁上土', '金箔金',
    '覆灯火', '天河水', '大驿土', '钗钏金', '桑柘木', '大溪水', '沙中土', '天上火', '石榴木', '大海水'
  ];
  const ZHISHEN = ['建', '除', '满', '平', '定', '执', '破', '危', '成', '收', '开', '闭'];
  // 十二节(定月之节):立春起,各对应月支(寅起)与"距立春节气数"
  const JIE_ORDER = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪'];
  const XINGXIU = ['角', '亢', '氐', '房', '心', '尾', '箕', '斗', '牛', '女', '虚', '危', '室', '壁',
    '奎', '娄', '胃', '昴', '毕', '觜', '参', '井', '鬼', '柳', '星', '张', '翼', '轸'];

  const DAY_CN = (d) => {
    const cn = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    if (d <= 10) return '初' + cn[d - 1];
    if (d < 20) return '十' + cn[d - 11];
    if (d === 20) return '二十';
    if (d < 30) return '廿' + cn[d - 21];
    return '三十';
  };
  const pad2 = (n) => (n < 10 ? '0' + n : '' + n);

  /* ─────────── 农历基础 ─────────── */
  const leapMonth = (y) => INFO[y - 1900] & 0xf;
  const leapDays = (y) => leapMonth(y) ? ((INFO[y - 1900] & 0x10000) ? 30 : 29) : 0;
  const monthDays = (y, m) => (INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29;
  function yearDays(y) {
    let s = 348;
    for (let f = 0x8000; f > 0x8; f >>= 1) s += (INFO[y - 1900] & f) ? 1 : 0;
    return s + leapDays(y);
  }
  const monthCn = (y, m, isLeap) => (isLeap ? '闰' : '') + YUE_CN[m - 1] + '月';

  /* 阳历 → 农历(经典算法) */
  function solar2lunar(Y, M, D) {
    let offset = Math.floor((Date.UTC(Y, M - 1, D) - Date.UTC(1900, 0, 31)) / 86400000);
    let i, temp = 0;
    for (i = 1900; i < 3001 && offset > 0; i++) { temp = yearDays(i); offset -= temp; }
    if (offset < 0) { offset += temp; i--; }
    const lYear = i;
    const leap = leapMonth(lYear);
    let isLeap = false;
    for (i = 1; i < 13 && offset > 0; i++) {
      if (leap > 0 && i === leap + 1 && isLeap === false) { --i; isLeap = true; temp = leapDays(lYear); }
      else { temp = monthDays(lYear, i); }
      if (isLeap === true && i === leap + 1) { isLeap = false; }
      offset -= temp;
    }
    if (offset === 0 && leap > 0 && i === leap + 1) {
      if (isLeap) { isLeap = false; } else { isLeap = true; --i; }
    }
    if (offset < 0) { offset += temp; --i; }
    const lMonth = i, lDay = offset + 1;
    return {
      lYear, lMonth, lDay, isLeap,
      monthCn: monthCn(lYear, lMonth, isLeap),
      dayCn: DAY_CN(lDay),
      lMonthDays: isLeap ? leapDays(lYear) : monthDays(lYear, lMonth),
      yearGZ: gzName((lYear - 4) % 60 < 0 ? ((lYear - 4) % 60 + 60) % 60 : (lYear - 4) % 60),
      animal: ZODIAC[(((lYear - 4) % 12) + 12) % 12]
    };
  }

  /* 农历 → 阳历 */
  function lunar2solar(lY, lM, lD, isLeap) {
    if (lM < 1 || lM > 12 || lD < 1 || lD > 30) return null;
    const leap = leapMonth(lY);
    if (isLeap && leap !== lM) return null;
    if (!isLeap && lD > monthDays(lY, lM)) return null;
    let offset = 0;
    for (let y = 1900; y < lY; y++) offset += yearDays(y);
    let m = 1;
    while (m < lM) {
      offset += monthDays(lY, m);
      if (leap === m) offset += leapDays(lY); // 平月之后接闰月
      m++;
    }
    if (isLeap) offset += monthDays(lY, lM); // 闰月之前还有平月
    const ms = Date.UTC(1900, 0, 31) + (offset + lD - 1) * 86400000;
    const d = new Date(ms);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
  }

  /* ─────────── 节气 ─────────── */
  /* 历表法定"日"(权威)。n: 1..24(小寒..冬至) */
  function termDay(Y, n) {
    const e = TERM_INFO[Y - 1900];
    const c = [];
    for (let k = 0; k < 6; k++) c.push(String(parseInt('0x' + e.substr(k * 5, 5), 16)));
    const t = [];
    for (const ck of c) t.push(ck.substr(0, 1), ck.substr(1, 2), ck.substr(3, 1), ck.substr(4, 2));
    return parseInt(t[n - 1], 10);
  }
  /* 节气所在公历月:小寒、大寒→1月,立春、雨水→2月…… */
  const termMonth = (n) => Math.floor((n - 1) / 2) + 1;
  /* 节气对应太阳视黄经(度) */
  const termLon = (n) => (270 + n * 15) % 360;

  /* VSOP87(截断)太阳视黄经,精度优于 1″ */
  const VSOP = {
    L0: [[175347046,0,0],[3341656,4.6692568,6283.07585],[34894,4.6261,12566.1517],[3497,2.7441,5753.3849],
      [3418,2.8289,3.5231],[3136,3.6277,77713.7715],[2676,4.4181,7860.4194],[2343,6.1352,3930.2097],
      [1324,0.7425,11506.7698],[1273,2.0371,529.691],[1199,1.1096,1577.3435],[990,5.233,5884.927],
      [902,2.045,26.298],[857,3.508,398.149],[780,1.179,5223.694],[753,2.533,5507.553],
      [505,4.583,18849.228],[492,4.205,775.523],[357,2.92,0.067],[317,5.849,11790.629],
      [284,1.899,796.298],[271,0.315,10977.079],[243,0.345,5486.778],[206,4.806,2544.314],
      [205,1.869,5573.143],[202,2.458,6069.777],[156,0.833,213.299],[132,3.411,2942.463],
      [126,1.083,20.775],[115,0.645,0.98],[103,0.636,4694.003],[102,0.976,15720.839],
      [102,4.267,7.114],[99,6.21,2146.17],[98,0.68,155.42],[86,5.98,161000.69],
      [85,1.3,6275.96],[85,3.67,71430.7],[80,1.81,17260.15],[79,3.04,12036.46],
      [75,1.76,5088.63],[74,3.5,3154.69],[74,4.68,801.82],[70,0.83,9437.76],
      [62,3.98,8827.39],[61,1.82,7084.9],[57,2.78,6286.6],[56,4.39,14143.5],
      [56,3.47,6279.55],[52,0.19,12139.55],[52,1.33,1748.02],[51,0.28,5856.48],
      [49,0.49,1194.45],[41,5.37,8429.24],[41,2.4,19651.05],[39,6.17,10447.39],
      [37,6.04,10213.29],[37,2.57,1059.38],[36,1.71,2352.87],[36,1.78,6812.77],
      [33,0.59,17789.85],[30,0.44,83996.85],[30,2.74,1349.87],[25,3.16,4690.48]],
    L1: [[628331966748,0,0],[206059,2.678235,6283.07585],[4303,2.635127,12566.1517],[425,1.59,3.523],
      [119,5.796,26.293],[109,2.966,1577.344],[93,2.59,18849.23],[72,1.14,529.69],
      [68,1.87,398.15],[67,4.41,5507.55],[59,2.89,5223.69],[56,2.17,155.42],
      [45,0.4,796.3],[36,0.47,775.52],[29,2.65,7.11],[21,5.34,0.98],
      [19,1.85,5486.78],[19,4.97,213.3],[17,2.99,6275.96],[16,0.03,2544.31],
      [16,1.43,2146.17],[15,1.21,10977.08],[12,2.83,1748.02],[12,3.26,5088.63],
      [12,5.27,1194.45],[12,2.08,4694],[11,0.77,553.57],[10,1.3,6286.6],
      [10,4.24,1349.87],[9,2.7,242.73],[9,5.64,951.72],[8,5.3,2352.87],
      [6,2.65,9437.76],[6,4.67,4690.48]],
    L2: [[52919,0,0],[8720,1.0721,6283.0758],[309,0.867,12566.152],[27,0.05,3.52],
      [16,5.19,26.3],[16,3.68,155.42],[10,0.76,18849.23],[9,2.06,77713.77],
      [7,0.83,775.52],[5,4.66,1577.34]],
    L3: [[160,0,0],[10,3,6283.08],[3,1.55,12566.15]],
    L4: [[386,0,0]]
  };
  const RAD = Math.PI / 180;

  function deltaTdays(jd) { // 简化 ΔT 模型(秒级误差对节气时分影响可忽略)
    const y = 2000 + (jd - 2451545.0) / 365.2425;
    const t = y - 2000;
    const dt = 62.92 + 0.32217 * t + 0.005589 * t * t;
    return dt / 86400;
  }
  /* jd(UT) → 太阳视黄经(度) */
  function sunLon(jd) {
    const tau = (jd + deltaTdays(jd) - 2451545.0) / 365250;
    const orders = [VSOP.L0, VSOP.L1, VSOP.L2, VSOP.L3, VSOP.L4];
    let L = 0;
    for (let n = 0; n < orders.length; n++) {
      let sum = 0;
      for (const [A, B, C] of orders[n]) sum += A * Math.cos(B + C * tau);
      L += sum * Math.pow(tau, n);
    }
    let lon = L / 1e8 + Math.PI; // 地球日心 → 太阳地心
    const T = tau * 10;
    const om = (125.04452 - 1934.136261 * T) * RAD;
    const Ls = (280.4665 + 36000.7698 * T) * RAD;
    const Lm = (218.3165 + 481267.8813 * T) * RAD;
    const dpsi = (-17.20 * Math.sin(om) - 1.32 * Math.sin(2 * Ls) - 0.23 * Math.sin(2 * Lm) + 0.21 * Math.sin(2 * om)) / 3600;
    const d = jd - 2451545.0;
    const g = (357.528 + 0.9856003 * d) * RAD;
    const R = 1.00014 - 0.01671 * Math.cos(g) - 0.00014 * Math.cos(2 * g);
    const ab = -20.4898 / R / 3600;
    lon = lon / RAD + dpsi + ab;
    return ((lon % 360) + 360) % 360;
  }
  /* 节气时刻(JD,UT) */
  function termJD(Y, n) {
    const month = termMonth(n), day = termDay(Y, n);
    let jd = Date.UTC(Y, month - 1, day, 4, 0, 0) / 86400000 + 2440587.5;
    const target = termLon(n);
    for (let k = 0; k < 3; k++) {
      let diff = target - sunLon(jd);
      diff = ((diff + 180) % 360 + 360) % 360 - 180;
      jd += diff / 0.9856473;
    }
    for (let k = 0; k < 4; k++) {
      const slope = (sunLon(jd + 0.4) - sunLon(jd - 0.4)) / 0.8;
      let diff = target - sunLon(jd);
      diff = ((diff + 180) % 360 + 360) % 360 - 180;
      jd += diff / slope;
    }
    return jd;
  }
  /* JD(UT) → 北京时间 Date(内部用 getUTC* 读取东八区墙钟) */
  const jdToCn = (jd) => new Date(Math.round((jd - 2440587.5) * 86400000) + 8 * 3600 * 1000);

  const termCache = new Map();
  /* 某公历年全年 24 节气:[{name, n, month, day, jd, hh, mm}] */
  function yearTerms(Y) {
    if (termCache.has(Y)) return termCache.get(Y);
    const arr = [];
    for (let n = 1; n <= 24; n++) {
      const jd = termJD(Y, n);
      const d = jdToCn(jd);
      const tableDay = termDay(Y, n);
      const vsopDay = d.getUTCDate();
      let hh = d.getUTCHours(), mm = d.getUTCMinutes();
      if (vsopDay !== tableDay) { hh = vsopDay < tableDay ? 23 : 0; mm = vsopDay < tableDay ? 59 : 0; }
      arr.push({
        name: TERM_NAMES[n - 1], n, month: termMonth(n), day: tableDay,
        jd, hh, mm, isJie: (n % 2 === 1)
      });
    }
    arr.sort((a, b) => a.jd - b.jd);
    termCache.set(Y, arr);
    return arr;
  }
  /* 某日是否节气日 */
  function termOfDay(Y, M, D) {
    const arr = yearTerms(Y).concat(yearTerms(Y + 1));
    for (const t of arr) if (t.month === M && t.day === D) return t;
    return null;
  }
  /* 某日之后的下一个节气 */
  function nextTerm(Y, M, D) {
    const cur = Date.UTC(Y, M - 1, D);
    const arr = yearTerms(Y).concat(yearTerms(Y + 1));
    for (const t of arr) {
      const tms = Date.UTC(Y, t.month - 1, t.day);
      if (tms > cur) return t;
    }
    return yearTerms(Y + 1)[0];
  }
  /* 节气时刻的"北京墙钟"毫秒(用于四柱分界) */
  const termCnMs = (Y, n) => {
    const t = yearTerms(Y).find(x => x.n === n);
    return Date.UTC(Y, t.month - 1, t.day, t.hh, t.mm, 0);
  };

  /* ─────────── 四柱干支 ─────────── */
  const gzName = (idx) => { idx = ((idx % 60) + 60) % 60; return GAN[idx % 10] + ZHI[idx % 12]; };
  const gzIdx = (name) => GAN.indexOf(name[0]);

  /* 返回 {y:{gz,wxG,wxZ,zodiac}, m:{...}, d:{...}, h:{...}|null, nayin, zhishen} */
  function pillars(Y, M, D, hour) {
    const cnMid = Date.UTC(Y, M - 1, D);
    const now = new Date();
    const isToday = now.getFullYear() === Y && now.getMonth() + 1 === M && now.getDate() === D;
    const cmpMs = isToday ? now.getTime() : cnMid;

    /* 年柱:立春分界 */
    const lichun = termCnMs(Y, 3); // 立春 n=3
    const gy = cmpMs >= lichun ? Y : Y - 1;
    const yIdx = (((gy - 4) % 60) + 60) % 60;
    const yearGZ = gzName(yIdx);

    /* 月柱:十二节定月 */
    let best = null, bestMs = -Infinity;
    for (const yy of [Y - 1, Y, Y + 1]) {
      const terms = yearTerms(yy);
      for (const t of terms) {
        if (!t.isJie) continue;
        const ms = Date.UTC(yy, t.month - 1, t.day, t.hh, t.mm, 0);
        if (ms <= cmpMs && ms > bestMs) { bestMs = ms; best = { t, yy }; }
      }
    }
    let mGZ;
    if (best) {
      let j, py;
      if (best.t.name === '小寒') { j = 11; py = best.yy - 1; }
      else { j = JIE_ORDER.indexOf(best.t.name); py = best.yy; }
      const mZhi = (j + 2) % 12;
      const yGanIdx = ((py - 4) % 10 + 10) % 10;
      const mGan = ((yGanIdx % 5) * 2 + 2 + j) % 10;
      mGZ = GAN[mGan] + ZHI[mZhi];
    }

    /* 日柱:1949-10-01 甲子日 */
    const dIdx = (((Math.floor((Date.UTC(Y, M - 1, D) - Date.UTC(1949, 9, 1)) / 86400000)) % 60) + 60) % 60;
    const dayGZ = gzName(dIdx);

    /* 时柱 */
    let hGZ = null;
    if (hour !== null && hour !== undefined) {
      const hZhi = Math.floor((hour + 1) / 2) % 12;
      const hGan = ((dIdx % 10 % 5) * 2 + hZhi) % 10;
      hGZ = GAN[hGan] + ZHI[hZhi];
    }

    const mk = (gz) => gz ? { gz, wxG: GAN_WX[GAN.indexOf(gz[0])], wxZ: ZHI_WX[ZHI.indexOf(gz[1])] } : null;
    const yP = mk(yearGZ);
    /* 值神(建除十二神,简排) */
    let zs = null;
    if (best) {
      const mZhiIdx = ZHI.indexOf(mGZ[1]);
      zs = ZHISHEN[(((dIdx % 12) - mZhiIdx) + 12) % 12];
    }
    return {
      y: yP, m: mk(mGZ), d: mk(dayGZ), h: mk(hGZ),
      nayin: NAYIN[Math.floor(yIdx / 2)],
      zhishen: zs,
      pillarYear: gy
    };
  }

  /* ─────────── 伊斯兰历(表格历法) ─────────── */
  function hijriOf(Y, M, D) {
    const jdn = Math.floor(Date.UTC(Y, M - 1, D) / 86400000) + 2440588;
    let l = jdn - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
    l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    const m = Math.floor((24 * l) / 709);
    const d = l - Math.floor((709 * m) / 24);
    const y = 30 * n + j - 30;
    return { y, m, d };
  }
  const HIJRI_MONTH = ['穆哈兰姆', '色法尔', '赖比尼一世', '赖比尼二世', '主马达一世', '主马达二世',
    '赖哲卜', '舍尔邦', '莱麦丹(斋月)', '闪瓦鲁', '祖勒哲达', '祖勒希哲'];

  /* ─────────── 月相 ─────────── */
  const SYNODIC = 29.530588853;
  function moonPhase(Y, M, D) {
    const jd = Date.UTC(Y, M - 1, D) / 86400000 + 2440587.5 + 0.5;
    const age = ((jd - 2451550.1) % SYNODIC + SYNODIC) % SYNODIC;
    let name, icon;
    if (age < 1.0 || age > 29.0) { name = '朔 · 新月'; icon = 'new'; }
    else if (age < 6.4) { name = '娥眉月'; icon = 'wax-c'; }
    else if (age < 8.4) { name = '上弦月'; icon = 'first'; }
    else if (age < 13.4) { name = '盈凸月'; icon = 'wax-g'; }
    else if (age < 16.4) { name = '望 · 满月'; icon = 'full'; }
    else if (age < 21.4) { name = '亏凸月'; icon = 'wan-g'; }
    else if (age < 23.4) { name = '下弦月'; icon = 'last'; }
    else { name = '残月'; icon = 'wan-c'; }
    const lit = (1 - Math.cos(2 * Math.PI * age / SYNODIC)) / 2;
    return { age, name, icon, lit };
  }

  /* ─────────── 导出 ─────────── */
  window.LC = {
    GAN, ZHI, ZODIAC, GAN_WX, ZHI_WX, WX_COLOR, YUE_CN, ZHISHEN, XINGXIU, HIJRI_MONTH,
    solar2lunar, lunar2solar, yearTerms, termOfDay, nextTerm, pillars,
    hijriOf, moonPhase, gzName, termDay, termCnMs,
    __dbg: { sunLon, termJD, VSOP, deltaTdays, jdToCn },
    MIN_YEAR: 1900, MAX_YEAR: 2999
  };
})();
