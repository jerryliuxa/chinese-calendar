/* ═══════════════════════════════════════════════
 * 玄玑界面 main.js
 * 当日命盘 · 月历 · 节气 · 八卦轮 · 玄机一占
 * ═══════════════════════════════════════════════ */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const pad2 = (n) => (n < 10 ? '0' + n : '' + n);
  const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

  const now0 = new Date();
  const state = {
    sel: new Date(now0.getFullYear(), now0.getMonth(), now0.getDate()),
    viewY: now0.getFullYear(),
    viewM: now0.getMonth() + 1,
    hidden: new Set()
  };

  /* ─────────── 日信息(缓存) ─────────── */
  const infoCache = new Map();
  function dayInfo(Y, M, D) {
    const key = (Y * 100 + M) * 100 + D;
    if (infoCache.has(key)) return infoCache.get(key);
    const lunar = LC.solar2lunar(Y, M, D);
    const n = new Date();
    const isToday = n.getFullYear() === Y && n.getMonth() + 1 === M && n.getDate() === D;
    const pillars = LC.pillars(Y, M, D, isToday ? n.getHours() : null);
    const term = LC.termOfDay(Y, M, D);
    const hijri = LC.hijriOf(Y, M, D);
    const moon = LC.moonPhase(Y, M, D);
    const fests = DATA.matchFests({ Y, M, D, lunar, term, hijri });
    const info = { lunar, pillars, term, hijri, moon, fests, cons: DATA.constellation(M, D) };
    infoCache.set(key, info);
    return info;
  }

  /* ─────────── 通用小组件 ─────────── */
  function gzColored(gzObj) {
    if (!gzObj) return '<span class="p-gz">—</span>';
    const gWx = LC.GAN_WX[LC.GAN.indexOf(gzObj.gz[0])];
    const zWx = LC.ZHI_WX[LC.ZHI.indexOf(gzObj.gz[1])];
    return `<span class="p-gz"><span class="${LC.WX_COLOR[gWx]}">${gzObj.gz[0]}</span><span class="${LC.WX_COLOR[zWx]}">${gzObj.gz[1]}</span></span>`;
  }
  function festColor(f) { return DATA.CATS[f.cat].color; }

  function moonIcon(moon, size) {
    const cv = document.createElement('canvas');
    const d = size || 20, dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = d * dpr; cv.height = d * dpr;
    cv.style.width = d + 'px'; cv.style.height = d + 'px';
    const c = cv.getContext('2d');
    c.scale(dpr, dpr);
    const r = d / 2 - 1.5, cx = d / 2, cy = d / 2;
    const f = moon.lit, k = 2 * f - 1;
    const waxing = moon.age < 14.765;
    const s = waxing ? 1 : -1;
    c.beginPath(); c.arc(cx, cy, r, 0, 6.2832);
    c.fillStyle = '#232a4e'; c.fill();
    c.save();
    c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.clip();
    c.translate(cx, cy);
    c.beginPath();
    c.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, s < 0);
    c.ellipse(0, 0, Math.max(0.01, Math.abs(k) * r), r, 0, Math.PI / 2, -Math.PI / 2, (k > 0) === (s > 0));
    c.fillStyle = '#f2dfa8';
    c.shadowColor = 'rgba(242,223,168,.8)'; c.shadowBlur = 5;
    c.fill();
    c.restore();
    c.strokeStyle = 'rgba(232,195,122,.4)'; c.lineWidth = 1;
    c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.stroke();
    return cv;
  }

  /* ─────────── 当日命盘 ─────────── */
  function renderDayPanel() {
    const { Y, M, D } = curSel();
    const info = dayInfo(Y, M, D);
    const { lunar, pillars: pp, term, hijri, moon, fests } = info;

    $('#gregDay').textContent = D;
    $('#gregYear').textContent = Y + '年';
    $('#gregDate').textContent = `${M}月${D}日`;
    $('#weekDay').textContent = '星期' + WEEK[new Date(Y, M - 1, D).getDay()];
    $('#lunarLine').textContent = `农历 ${lunar.monthCn}${lunar.dayCn}`;
    $('#zodiacLine').textContent =
      `${lunar.yearGZ}年 · 生肖属${lunar.animal} · ${info.cons}座 · 伊斯兰历${hijri.y}年${LC.HIJRI_MONTH[hijri.m - 1]}${hijri.d}日`;

    /* 四柱 */
    $('#pillars').innerHTML = [
      ['年柱', pp.y], ['月柱', pp.m], ['日柱', pp.d], ['时柱', pp.h]
    ].map(([nm, o]) =>
      `<div class="pillar"><div class="p-name">${nm}</div>${gzColored(o)}<div class="p-wx">${o ? o.wxG + ' · ' + o.wxZ : '今日实时'}</div></div>`
    ).join('');

    /* 元信息签 */
    const chips = [
      `<span class="chip">生肖 <b>${lunar.animal}</b></span>`,
      `<span class="chip">星座 <b>${info.cons}</b></span>`,
      `<span class="chip">年纳音 <b>${pp.nayin}</b></span>`,
      pp.zhishen ? `<span class="chip">值神 <b>${pp.zhishen}</b></span>` : '',
      `<span class="chip" id="moonChip"></span>`
    ].join('');
    $('#metaChips').innerHTML = chips;
    const mc = $('#moonChip');
    mc.appendChild(moonIcon(moon, 20));
    mc.appendChild(document.createTextNode(moon.name));

    /* 宜忌 */
    const zy = pp.zhishen ? DATA.ZHISHEN_YIJI[pp.zhishen] : null;
    $('#yiji').innerHTML = zy
      ? `值神<b>「${pp.zhishen}」</b> · 宜:<b>${zy.yi}</b> · 忌:<b>${zy.ji}</b><br><span style="opacity:.55">建除十二神 · 民俗简则,仅供品读</span>`
      : '';

    /* 节气横幅 */
    const tb = $('#termBanner');
    if (term) {
      tb.classList.remove('hidden');
      tb.innerHTML = `<span class="t-name">◂ ${term.name} ▸</span><span class="t-time">${term.month}月${term.day}日 ${pad2(term.hh)}:${pad2(term.mm)}</span>
        <div class="t-desc">${DATA.TERM_DESC[term.name] || ''}</div>`;
    } else tb.classList.add('hidden');

    /* 节日列表 */
    const list = $('#festList');
    if (!fests.length) {
      list.innerHTML = '<li class="fest-none">今日无节庆,诸事平顺,宜静心观星。</li>';
    } else {
      list.innerHTML = fests.map(({ fest, label }) => {
        const col = festColor(fest);
        return `<li>
          <span class="fest-dot" style="color:${col};background:${col}"></span>
          <span class="fest-name" style="color:${col}">${label}${fest.legal ? '<small style="opacity:.75"> ·休</small>' : ''}</span>
          <span class="fest-cat" style="color:${col};border-color:${col}55;background:${col}14">${DATA.CATS[fest.cat].label}${fest.approx ? ' · 约' : ''}</span>
          <span class="fest-desc">${fest.desc}</span>
        </li>`;
      }).join('');
    }

    /* 下一节气 */
    const nt = LC.nextTerm(Y, M, D);
    const ndays = Math.round((Date.UTC(nt.month === 1 && M === 12 ? Y + 1 : Y, nt.month - 1, nt.day) - Date.UTC(Y, M - 1, D)) / 86400000);
    $('#nextTerm').innerHTML = `下一节气 <b>${nt.name}</b> · ${nt.month}月${nt.day}日 ${pad2(nt.hh)}:${pad2(nt.mm)} · 还有 <b>${ndays}</b> 天`;
  }
  function curSel() {
    return { Y: state.sel.getFullYear(), M: state.sel.getMonth() + 1, D: state.sel.getDate() };
  }

  /* ─────────── 月历 ─────────── */
  function renderLegend() {
    $('#legend').innerHTML = Object.entries(DATA.CATS).map(([k, c]) => {
      const off = state.hidden.has(k);
      return `<span class="lg-chip ${off ? 'off' : ''}" data-cat="${k}" style="color:${c.color};border-color:${c.color}44;background:${c.color}10">
        <span class="lg-dot"></span>${c.label}</span>`;
    }).join('');
  }
  function renderCalendar() {
    $('#calTitle').textContent = `${state.viewY}年${state.viewM}月`;
    const first = new Date(state.viewY, state.viewM - 1, 1);
    const lead = (first.getDay() + 6) % 7; // 周一为首
    const dim = new Date(state.viewY, state.viewM, 0).getDate();
    const dimPrev = new Date(state.viewY, state.viewM - 1, 0).getDate();
    const grid = $('#calGrid');
    grid.innerHTML = '';
    const nowD = new Date();
    const todayKey = [nowD.getFullYear(), nowD.getMonth() + 1, nowD.getDate()].join('-');
    const selKey = [state.sel.getFullYear(), state.sel.getMonth() + 1, state.sel.getDate()].join('-');

    for (let i = 0; i < 42; i++) {
      let Y, M, D, inMonth = true;
      if (i < lead) { Y = state.viewY; M = state.viewM - 1; D = dimPrev - lead + 1 + i; if (M < 1) { M = 12; Y--; } inMonth = false; }
      else if (i >= lead + dim) { const k = i - (lead + dim) + 1; Y = state.viewY; M = state.viewM + 1; D = k; if (M > 12) { M = 1; Y++; } inMonth = false; }
      else { Y = state.viewY; M = state.viewM; D = i - lead + 1; }

      const info = dayInfo(Y, M, D);
      const key = [Y, M, D].join('-');
      const cls = ['cell'];
      if (!inMonth) cls.push('dim');
      if (key === todayKey) cls.push('today');
      if (key === selKey) cls.push('sel');

      /* 农历行 */
      let lunarTxt = '', lunarCls = 'd-lunar';
      if (info.term) { lunarTxt = info.term.name; lunarCls += ' is-term'; }
      else if (info.lunar.lDay === 1) { lunarTxt = info.lunar.monthCn; lunarCls += ' is-month'; }
      else lunarTxt = info.lunar.dayCn;

      /* 节日标签(按图例过滤) */
      const vis = info.fests.filter(x => !state.hidden.has(x.fest.cat));
      const tags = vis.slice(0, 2).map(({ fest, label }) => {
        const col = festColor(fest);
        return `<span class="d-tag" style="color:${col};border-color:${col}55;background:${col}12" title="${label} · ${DATA.CATS[fest.cat].label}">${label}</span>`;
      }).join('');
      const more = vis.length > 2 ? `<span class="d-more">+${vis.length - 2}</span>` : '';

      const cell = document.createElement('div');
      cell.className = cls.join(' ');
      cell.dataset.y = Y; cell.dataset.m = M; cell.dataset.d = D;
      cell.title = `${Y}年${M}月${D}日 · 农历${info.lunar.monthCn}${info.lunar.dayCn}` +
        (vis.length ? ' · ' + vis.map(x => x.label).join(' · ') : '') +
        (info.term ? ` · ${info.term.name}` : '');
      cell.innerHTML = `<div class="d-num">${D}</div><div class="${lunarCls}">${lunarTxt}</div>
        <div class="d-tags">${tags}${more}</div>`;
      cell.addEventListener('click', () => {
        state.sel = new Date(Y, M - 1, D);
        state.viewY = Y; state.viewM = M;
        renderDayPanel(); renderCalendar();
      });
      grid.appendChild(cell);
    }
  }

  /* ─────────── 节气面板 ─────────── */
  function renderTerms() {
    const n = new Date();
    const Y = n.getFullYear();
    const terms = LC.yearTerms(Y);
    const nowMs = n.getTime();
    let cur = null;
    for (const t of terms) {
      const ms = Date.UTC(Y, t.month - 1, t.day, t.hh, t.mm);
      if (ms <= nowMs) cur = t; else break;
    }
    if (!cur) { cur = LC.yearTerms(Y - 1)[23]; }
    $('#curTerm').innerHTML = `
      <span class="ct-name">${cur.name}</span><span class="ct-time">${cur.month}月${cur.day}日 ${pad2(cur.hh)}:${pad2(cur.mm)}</span>
      <div class="ct-desc">${DATA.TERM_DESC[cur.name] || ''}</div>`;

    $('#termList').innerHTML = terms.map(t => {
      const ms = Date.UTC(Y, t.month - 1, t.day);
      const cls = ms < nowMs ? 'passed' : (t === cur ? 'now' : '');
      return `<li class="${cls}"><span class="t-n">${t.name}</span><span class="t-d">${t.month}月${t.day}日 ${pad2(t.hh)}:${pad2(t.mm)}</span></li>`;
    }).join('');
  }

  /* ─────────── 八卦轮 ─────────── */
  function triRowsHTML(rows, w) {
    return rows.map(r => r === 1
      ? `<span class="yao-row"><span class="yao-bar" style="width:${w}px"></span></span>`
      : `<span class="yao-row"><span class="yao-bar yin1" style="width:${w * 0.45}px"></span><span class="yao-bar yin2" style="width:${w * 0.45}px"></span></span>`
    ).join('');
  }
  function renderBagua() {
    const wheel = $('#baguaWheel');
    /* 移除旧 tile */
    wheel.querySelectorAll('.tri-tile').forEach(e => e.remove());
    const W0 = wheel.clientWidth || 340;
    const R = W0 / 2 - 46;
    DATA.BAGUA_WHEEL.forEach((name, i) => {
      const g = DATA.BAGUA.find(b => b.name === name);
      const th = i * 45 * Math.PI / 180;
      const x = W0 / 2 + R * Math.sin(th), y = W0 / 2 - R * Math.cos(th);
      const tile = document.createElement('div');
      tile.className = 'tri-tile' + (i === 0 ? ' active' : '');
      tile.dataset.name = name;
      tile.style.left = x + 'px'; tile.style.top = y + 'px';
      tile.innerHTML = `<span class="t-sym">${triRowsHTML(g.rows, 20)}</span>
        <div class="t-name">${g.name}</div><div class="t-xiang">其象为${g.xiang}</div>`;
      tile.addEventListener('click', () => {
        wheel.querySelectorAll('.tri-tile').forEach(e => e.classList.remove('active'));
        tile.classList.add('active');
        renderBaguaDetail(name);
      });
      wheel.appendChild(tile);
    });
    renderBaguaDetail('乾');
  }
  function renderBaguaDetail(name) {
    const g = DATA.BAGUA.find(b => b.name === name);
    $('#baguaDetail').innerHTML = `
      <div class="bd-head"><span class="bd-name">${g.name}卦</span><span class="bd-alias">其象为${g.xiang} · 其性为${g.xing}</span></div>
      <div class="bd-grid">
        <div><span>五行 </span><b>${g.wx}</b></div>
        <div><span>后天方位 </span><b>${g.pos}</b></div>
        <div><span>先天方位 </span><b>${g.posOld}</b></div>
        <div><span>先天之数 </span><b>${g.num}</b></div>
        <div><span>于人伦 </span><b>${g.person}</b></div>
        <div><span>于身体 </span><b>${g.body}</b></div>
        <div><span>于动物 </span><b>${g.animal}</b></div>
        <div><span>卦德 </span><b>${g.xing}</b></div>
        <div><span>洛书 </span><b>乾坤六子</b></div>
      </div>
      <div class="bd-quote">《象》曰:${g.quote}</div>`;
  }

  /* ─────────── 玄机一占 ─────────── */
  const TRI_FROM_BITS = { 7: 0, 3: 1, 5: 2, 1: 3, 6: 4, 2: 5, 4: 6, 0: 7 };
  function findHex(lines) { // lines: 自下而上 0/1
    const up = TRI_FROM_BITS[lines[5] * 4 + lines[4] * 2 + lines[3]];
    const low = TRI_FROM_BITS[lines[2] * 4 + lines[1] * 2 + lines[0]];
    const idx = DATA.HEX64.findIndex(h => h[1] === up && h[2] === low);
    return { idx: idx + 1, name: DATA.HEX64[idx][0], line: DATA.HEX64[idx][3] };
  }
  function hexBarsHTML(lines, small) {
    const w = small ? 16 : 30;
    let html = '';
    for (let i = 5; i >= 0; i--) {
      html += lines[i] === 1
        ? `<span class="yao-row"><span class="yao-bar" style="width:${w}px"></span></span>`
        : `<span class="yao-row"><span class="yao-bar yin1" style="width:${w * 0.45}px"></span><span class="yao-bar yin2" style="width:${w * 0.45}px"></span></span>`;
    }
    return html;
  }

  function cast() {
    const btn = $('#btnCast');
    if (btn.disabled) return;
    btn.disabled = true;
    const show = $('#hexShow');
    /* 摇卦动画 */
    let ticks = 0;
    const timer = setInterval(() => {
      const rnd = Array.from({ length: 6 }, () => Math.random() < 0.5 ? 1 : 0);
      show.innerHTML = `<div class="hex-result cast-flash"><div class="hex-col"><div class="hx-label">铜钱摇动</div>${hexBarsHTML(rnd, true)}</div></div>`;
      if (++ticks > 10) {
        clearInterval(timer);
        settle();
      }
    }, 90);

    function settle() {
      /* 三枚铜钱 ×6:2为字 3为背 */
      const lines = [], old = [];
      for (let i = 0; i < 6; i++) {
        let v = 0;
        for (let c = 0; c < 3; c++) v += Math.random() < 0.5 ? 2 : 3;
        lines.push(v === 7 || v === 9 ? 1 : 0);
        old.push(v === 6 || v === 9);
      }
      const ben = findHex(lines);
      const changed = lines.map((l, i) => old[i] ? 1 - l : l);
      const bian = old.some(Boolean) ? findHex(changed) : null;
      show.innerHTML = `<div class="hex-result cast-flash">
        <div class="hex-col">
          <div class="hx-label">本卦 · 第${ben.idx}卦</div>
          ${hexBarsHTML(lines, true)}
          <div class="hx-name">${ben.name}</div>
        </div>
        <div class="hex-poem">
          <div class="hp-name">${ben.name} · 卦语</div>
          ${ben.line}
          ${bian ? `<div style="margin-top:8px;opacity:.8">变卦 → ${bian.name}:${bian.line}</div>` : ''}
        </div>
      </div>`;
      btn.disabled = false;
      btn.textContent = '再占一卦';
    }
  }

  /* ─────────── 顶栏 & 导航 ─────────── */
  function renderTodayBrief() {
    const n = new Date();
    const lu = LC.solar2lunar(n.getFullYear(), n.getMonth() + 1, n.getDate());
    $('#todayBrief').textContent = `今日 · ${lu.yearGZ}年 ${lu.monthCn}${lu.dayCn}`;
  }
  function bindNav() {
    const shift = (dm, dy) => {
      let y = state.viewY, m = state.viewM + dm + dy * 12;
      if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
      if (y < LC.MIN_YEAR || y > LC.MAX_YEAR) return;
      state.viewY = y; state.viewM = m;
      renderCalendar();
    };
    $('#prevMonth').addEventListener('click', () => shift(-1, 0));
    $('#nextMonth').addEventListener('click', () => shift(1, 0));
    $('#prevYear').addEventListener('click', () => shift(0, -1));
    $('#nextYear').addEventListener('click', () => shift(0, 1));
    $('#btnToday').addEventListener('click', () => {
      const n = new Date();
      state.sel = new Date(n.getFullYear(), n.getMonth(), n.getDate());
      state.viewY = n.getFullYear(); state.viewM = n.getMonth() + 1;
      renderDayPanel(); renderCalendar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    $('#legend').addEventListener('click', (e) => {
      const chip = e.target.closest('.lg-chip');
      if (!chip) return;
      const c = chip.dataset.cat;
      if (state.hidden.has(c)) state.hidden.delete(c); else state.hidden.add(c);
      renderLegend(); renderCalendar(); renderDayPanel();
    });
    $('#btnCast').addEventListener('click', cast);
    window.addEventListener('resize', () => renderBagua());
  }

  /* ─────────── 启动 ─────────── */
  renderTodayBrief();
  renderDayPanel();
  renderLegend();
  renderCalendar();
  renderTerms();
  renderBagua();
  bindNav();
})();
