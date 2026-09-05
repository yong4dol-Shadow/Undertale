/* =========================================================
   data/maps.js - 방(맵) 정의와 타일 렌더링
   ========================================================= */
(function (UT) {
  'use strict';

  const U = UT.util;
  const TS = 20;

  /* ---------- 타일 그리드 빌더 ---------- */
  function grid(w, h, ch) {
    const g = [];
    for (let y = 0; y < h; y++) g.push(new Array(w).fill(ch));
    return g;
  }
  function rect(g, x, y, w, h, ch) {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++)
        if (g[j] && i >= 0 && i < g[j].length) g[j][i] = ch;
  }
  function border(g, ch, t) {
    t = t || 1;
    const h = g.length, w = g[0].length;
    rect(g, 0, 0, w, t, ch); rect(g, 0, h - t, w, t, ch);
    rect(g, 0, 0, t, h, ch); rect(g, w - t, 0, t, h, ch);
  }
  function scatter(g, ch, n, area, from) {
    const h = g.length, w = g[0].length;
    from = from || '.';
    for (let i = 0; i < n; i++) {
      const x = U.randi(area ? area[0] : 1, area ? area[0] + area[2] - 1 : w - 2);
      const y = U.randi(area ? area[1] : 1, area ? area[1] + area[3] - 1 : h - 2);
      if (g[y] && g[y][x] === from) g[y][x] = ch;
    }
  }
  const rows = (g) => g.map((r) => r.join(''));

  /** 집 한 채: 지붕 2줄 + 벽 3줄 + 창문/문 */
  function house(g, x, y, w) {
    w = w || 8;
    rect(g, x, y, w, 2, 'R');
    rect(g, x, y + 2, w, 3, 'H');
    const cx = x + Math.floor(w / 2) - 1;
    rect(g, cx, y + 3, 2, 2, 'D');
    rect(g, x + 1, y + 3, 2, 2, 'W');
    rect(g, x + w - 3, y + 3, 2, 2, 'W');
  }
  const px = (t) => t * TS + TS / 2;

  /* ---------- 테마 색 ---------- */
  const THEMES = {
    metal:   { '.': '#232838', '#': '#4a5168', '=': '#2e3550', '|': '#5a6280', 'x': '#2a3145', '_': '#0a0c14' },
    beach:   { '.': '#e6d3a3', '#': '#b09a6a', '~': '#3f9fd6', ',': '#d8c890', '=': '#d5bd85', 'T': '#2f7a45' },
    town:    { '.': '#c8bfa8', '#': '#8a7a5e', 'H': '#d8b48a', 'W': '#f4e3a0', '=': '#b3a78d', ',': '#5f9440', 'T': '#2f7a45', '+': '#8a6a3a', 'R': '#c0553a', 'D': '#6a4126' },
    cliff:   { '.': '#9db06a', '#': '#6e6250', ',': '#7f9a52', '=': '#c0b088', 'T': '#2b6d3c', '^': '#5a5244' },
    temple:  { '.': '#43455a', '#': '#2c2e3e', '|': '#8b8ea8', '=': '#585a72', '_': '#14161f', '*': '#a8c8e8' },
    city:    { '.': '#3a3550', '#': '#5a5470', 'H': '#4a4460', 'W': '#f0d878', '=': '#443e5c', '+': '#6a6480', 'R': '#6b3a4e', 'D': '#2a2438' },
    lab:     { '.': '#4a4a58', '#': '#6a6a7c', 'x': '#5a5a6c', '|': '#8a8aa0', 'W': '#a8d8f0' },
    snow:    { '.': '#e8f2fb', '#': '#a8bccc', 'o': '#dfeaf6', '*': '#bfe0f5', 'T': '#3a6a5a', '^': '#8fa8bb', 'H': '#b8c8d8', 'W': '#ffd980', 'R': '#7f95a8', 'D': '#5a6a7a' },
    jungle:  { '.': '#3f7a45', '#': '#2a5230', '~': '#3f8fb6', 'T': '#1f5c2c', ',': '#7ac05a', '=': '#8a7a4a', 'H': '#b08a4a', 'W': '#ffd980', 'R': '#7a5a2a', 'D': '#4a3418' },
    desert:  { '.': '#e2c88a', '#': '#b09858', 's': '#d8bc7c', '^': '#8a7440', '=': '#cbb073' },
    factory: { '.': '#3a2a2a', '#': '#6a3a2a', 'x': '#4a3a3a', '|': '#8a4a2a', 'W': '#ffb04a', '=': '#4a3630' },
    abyss:   { '.': '#140f24', '#': '#241a3a', '_': '#05040a', '|': '#3a2a5a', '*': '#6a4aa0' }
  };

  /* ---------- 타일 그리기 ---------- */
  function hash(x, y) {
    let n = x * 374761393 + y * 668265263;
    n = (n ^ (n >> 13)) * 1274126177;
    return ((n ^ (n >> 16)) >>> 0) / 4294967296;
  }

  function drawTiles(ctx, room, cam) {
    const pal = THEMES[room.theme] || THEMES.metal;
    const t = UT.game.time;
    const x0 = Math.max(0, Math.floor(cam.x / TS) - 1);
    const y0 = Math.max(0, Math.floor(cam.y / TS) - 1);
    const x1 = Math.min(room.tiles[0].length, x0 + 35);
    const y1 = Math.min(room.tiles.length, y0 + 27);
    for (let y = y0; y < y1; y++) {
      const row = room.tiles[y];
      for (let x = x0; x < x1; x++) {
        const ch = row[x] || '#';
        const X = x * TS, Y = y * TS;
        /* 풀·나무는 바닥 위에 얹는다 */
        const overFloor = (ch === ',' || ch === 'T');
        const c = (overFloor ? (pal['.'] || '#202020') : (pal[ch] || pal['.'] || '#202020'));
        ctx.fillStyle = c;
        ctx.fillRect(X, Y, TS, TS);
        const h = hash(x, y);
        /* 실내 바닥 격자 */
        if (!overFloor && (ch === '.' || ch === 'x') && room.indoor) {
          if ((x + y) % 2 === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.045)';
            ctx.fillRect(X, Y, TS, TS);
          }
          ctx.fillStyle = 'rgba(0,0,0,0.16)';
          ctx.fillRect(X, Y + TS - 1, TS, 1);
          ctx.fillRect(X + TS - 1, Y, 1, TS);
        }

        if (ch === '#') {
          ctx.fillStyle = 'rgba(255,255,255,0.10)';
          ctx.fillRect(X, Y, TS, 4);
          ctx.fillStyle = 'rgba(0,0,0,0.22)';
          ctx.fillRect(X, Y + TS - 4, TS, 4);
        } else if (ch === '~') {
          ctx.fillStyle = 'rgba(255,255,255,0.22)';
          const off = Math.sin(t * 1.6 + x * 0.7 + y * 0.4) * 4;
          ctx.fillRect(X + 3 + off, Y + 7, 9, 2);
          ctx.fillRect(X + 8 + off, Y + 13, 6, 2);
        } else if (ch === ',') {
          ctx.fillStyle = pal[','] || '#6a9a4a';
          const gx = X + 2 + Math.floor(h * 5);
          ctx.fillRect(gx, Y + 11, 3, 7);
          ctx.fillRect(gx + 5, Y + 8, 3, 10);
          ctx.fillRect(gx + 10, Y + 12, 3, 6);
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          ctx.fillRect(gx, Y + 17, 13, 2);
        } else if (ch === '=') {
          ctx.fillStyle = 'rgba(0,0,0,0.10)';
          if (h > 0.6) ctx.fillRect(X + 4, Y + 6, 8, 3);
        } else if (ch === 'T') {
          ctx.fillStyle = 'rgba(0,0,0,0.22)';
          ctx.beginPath(); ctx.ellipse(X + 10, Y + 17, 8, 3, 0, 0, 6.3); ctx.fill();
          ctx.fillStyle = '#5a3a20';
          ctx.fillRect(X + 8, Y + 11, 4, 7);
          ctx.fillStyle = pal.T || '#2f7a45';
          ctx.beginPath(); ctx.arc(X + 10, Y + 9, 9, 0, 6.3); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.beginPath(); ctx.arc(X + 7, Y + 6, 4, 0, 6.3); ctx.fill();
        } else if (ch === 'R') {
          ctx.fillStyle = 'rgba(0,0,0,0.20)';
          for (let i = 0; i < 3; i++) ctx.fillRect(X, Y + 3 + i * 7, TS, 2);
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.fillRect(X, Y, TS, 2);
        } else if (ch === 'D') {
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.fillRect(X + 1, Y, TS - 2, TS);
          ctx.fillStyle = 'rgba(255,255,255,0.14)';
          ctx.fillRect(X + 2, Y + 1, TS - 4, 2);
          ctx.fillStyle = '#ffe14d';
          ctx.fillRect(X + TS - 6, Y + 10, 3, 3);
        } else if (ch === 'H') {
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          ctx.fillRect(X, Y + TS - 3, TS, 3);
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.fillRect(X, Y, TS, 2);
        } else if (ch === 'W') {
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.fillRect(X + 2, Y + 2, TS - 4, TS - 4);
          ctx.fillStyle = pal.W;
          ctx.fillRect(X + 4, Y + 4, TS - 8, TS - 8);
        } else if (ch === '|') {
          ctx.fillStyle = 'rgba(255,255,255,0.16)';
          ctx.fillRect(X + 3, Y, 4, TS);
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(X + TS - 6, Y, 4, TS);
        } else if (ch === '*') {
          ctx.fillStyle = 'rgba(255,255,255,' + (0.15 + Math.sin(t * 2 + x + y) * 0.1) + ')';
          ctx.fillRect(X + 4, Y + 4, TS - 8, TS - 8);
        } else if (ch === 'x') {
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(X + 1, Y + 1, TS - 2, TS - 2);
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.fillRect(X + 8, Y + 8, 4, 4);
        } else if (ch === '^') {
          ctx.fillStyle = 'rgba(255,255,255,0.14)';
          ctx.beginPath();
          ctx.moveTo(X + 10, Y + 2); ctx.lineTo(X + 18, Y + 18); ctx.lineTo(X + 2, Y + 18);
          ctx.fill();
        } else if (ch === '+') {
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(X + 2, Y + 4, 3, TS - 8);
          ctx.fillRect(X + TS - 5, Y + 4, 3, TS - 8);
          ctx.fillRect(X, Y + 8, TS, 3);
        } else if (ch === 'o' || ch === 's') {
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          if (h > 0.5) ctx.fillRect(X + 5 + h * 6, Y + 8, 3, 3);
        } else if (ch === '_') {
          if (h > 0.93) {
            ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + Math.sin(t * 2 + x) * 0.2) + ')';
            ctx.fillRect(X + 8, Y + 8, 2, 2);
          }
        } else {
          if (h > 0.90) {
            ctx.fillStyle = h > 0.965 ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.06)';
            ctx.fillRect(X + 3 + h * 6, Y + 5 + h * 7, 9, 5);
          }
        }
      }
    }
  }

  /* ============================================================
     방 정의
     ============================================================ */
  const ROOMS = {};

  function def(id, cfg) {
    cfg.id = id;
    cfg.wpx = cfg.tiles[0].length * TS;
    cfg.hpx = cfg.tiles.length * TS;
    cfg.objects = cfg.objects || [];
    cfg.spawns = cfg.spawns || { default: { x: cfg.wpx / 2, y: cfg.hpx / 2, dir: 'down' } };
    ROOMS[id] = cfg;
    return cfg;
  }

  /* ---------- 프롤로그: 궤도 요새 ---------- */
  (function () {
    const g = grid(32, 24, '.');
    border(g, '#', 2);
    rect(g, 2, 2, 28, 4, 'x');
    rect(g, 2, 18, 28, 4, 'x');
    rect(g, 6, 8, 2, 8, '|'); rect(g, 24, 8, 2, 8, '|');
    rect(g, 13, 0, 6, 3, '=');
    def('station_hall', {
      name: '오보이드 궤도 요새 · 통로', theme: 'metal', music: 'tension', indoor: true,
      tiles: rows(g),
      onEnter: 'prologue_hall',
      spawns: { default: { x: px(16), y: px(20), dir: 'up' } },
      objects: [
        { type: 'exit', x: px(16), y: px(1), w: 120, h: 30, to: 'station_core', spawn: 'default' },
        { type: 'sign', x: px(9), y: px(12), sprite: 'sign', solid: true,
          text: ['* “제7 격납고 — 관계자 외 출입 금지“', '* 그 아래에 누군가 낙서를 해 뒀다.\n* “빠른 놈은 예외“'] }
      ]
    });
  })();

  (function () {
    const g = grid(32, 24, 'x');
    border(g, '#', 2);
    rect(g, 4, 3, 24, 3, '|');
    rect(g, 2, 20, 28, 2, '=');
    def('station_core', {
      name: '오보이드 궤도 요새 · 중추', theme: 'metal', music: 'tension', indoor: true,
      tiles: rows(g),
      onEnter: 'prologue_core',
      spawns: { default: { x: px(16), y: px(19), dir: 'up' } },
      objects: []
    });
  })();

  /* ---------- 1장: 미르카 해안 ---------- */
  (function () {
    const g = grid(32, 24, '.');
    rect(g, 0, 0, 32, 6, '~');
    rect(g, 0, 6, 32, 2, ',');
    border(g, '#', 1);
    rect(g, 0, 0, 32, 1, '#');
    scatter(g, ',', 26);
    rect(g, 29, 10, 3, 6, '=');
    def('mirka_beach', {
      name: '미르카 해변', theme: 'beach', music: 'town',
      tiles: rows(g),
      onEnter: 'ch1_wake',
      spawns: { default: { x: px(14), y: px(14), dir: 'down' }, from_east: { x: px(29), y: px(13), dir: 'left' } },
      objects: [
        { type: 'exit', x: px(31), y: px(13), w: 24, h: 110, to: 'mirka_town', spawn: 'from_west',
          locked: 'ch1_met_coco', lockedText: '* ...머리가 아직 어지럽다.' },
        { type: 'save', x: px(8), y: px(16), flavor: '파도 소리와 젖은 모래' },
        { type: 'item', x: px(20), y: px(17), item: 'icecream', flag: 'beach_ice' }
      ]
    });
  })();

  (function () {
    const g = grid(48, 24, '.');
    border(g, '#', 1);
    rect(g, 0, 0, 48, 3, 'T');
    /* 집 3채 */
    house(g, 5, 4); house(g, 18, 4); house(g, 32, 4);
    rect(g, 0, 13, 48, 3, '=');
    scatter(g, ',', 40);
    rect(g, 42, 5, 4, 6, 'T');
    def('mirka_town', {
      name: '미르카 해안마을', theme: 'town', music: 'town',
      tiles: rows(g),
      spawns: {
        default: { x: px(24), y: px(18), dir: 'down' },
        from_west: { x: px(2), y: px(14), dir: 'right' },
        from_east: { x: px(45), y: px(14), dir: 'left' }
      },
      objects: [
        { type: 'exit', x: px(0), y: px(14), w: 24, h: 90, to: 'mirka_beach', spawn: 'from_east' },
        { type: 'exit', x: px(47), y: px(14), w: 24, h: 90, to: 'mirka_cliff', spawn: 'from_west' },
        { type: 'npc', x: px(8), y: px(12), sprite: 'npc_a', script: 'mirka_villager1', solid: true, face: true },
        { type: 'npc', x: px(21), y: px(12), sprite: 'npc_b', script: 'mirka_villager2', solid: true, face: true },
        { type: 'npc', x: px(35), y: px(17), sprite: 'npc_d', script: 'mirka_shop', solid: true, face: true },
        { type: 'save', x: px(24), y: px(20), flavor: '빵 굽는 냄새와 오후의 햇빛' },
        { type: 'sign', x: px(13), y: px(17), sprite: 'sign', solid: true,
          text: '* “미르카 해안마을 — 세상에서 해가 가장 늦게 지는 곳“\n* ...누가 마지막 줄을 지워 놨다.' }
      ]
    });
  })();

  (function () {
    const g = grid(32, 24, '.');
    border(g, '#', 1);
    rect(g, 0, 0, 32, 4, '^');
    rect(g, 2, 4, 6, 6, '^'); rect(g, 24, 5, 6, 5, '^');
    rect(g, 14, 0, 4, 20, '=');
    rect(g, 0, 13, 2, 3, '=');
    scatter(g, ',', 30);
    scatter(g, 'T', 8, [1, 10, 10, 10]);
    def('mirka_cliff', {
      name: '미르카 언덕길', theme: 'cliff', music: 'town',
      tiles: rows(g),
      spawns: {
        default: { x: px(16), y: px(20), dir: 'up' },
        from_west: { x: px(2), y: px(14), dir: 'right' },
        from_north: { x: px(16), y: px(6), dir: 'down' }
      },
      objects: [
        { type: 'exit', x: px(0), y: px(14), w: 24, h: 110, to: 'mirka_town', spawn: 'from_east' },
        { type: 'exit', x: px(16), y: px(3), w: 90, h: 24, to: 'temple1', spawn: 'default' },
        { type: 'trigger', x: px(16), y: px(14), w: 90, h: 40, script: 'ch1_night', once: true, flag: 'ch1_night' }
      ],
      encounter: { step: 900, enemies: ['shard'], flag: 'ch1_can_encounter' }
    });
  })();

  /* ---------- 신전 공용 빌더 ---------- */
  function temple(id, name, theme, script, extra) {
    const g = grid(32, 24, '.');
    border(g, '#', 2);
    rect(g, 4, 2, 2, 20, '|'); rect(g, 26, 2, 2, 20, '|');
    rect(g, 10, 2, 2, 20, '|'); rect(g, 20, 2, 2, 20, '|');
    rect(g, 12, 3, 8, 3, '=');
    rect(g, 14, 21, 4, 3, '=');
    const cfg = Object.assign({
      name, theme, music: 'temple', indoor: true,
      tiles: rows(g),
      onEnter: script,
      spawns: { default: { x: px(16), y: px(21), dir: 'up' } },
      objects: [
        { type: 'deco', x: px(16), y: px(8), sprite: 'pedestal', scale: 2, solid: true, w: 40, h: 24 },
        { type: 'deco', x: px(7), y: px(12), sprite: 'save_star', scale: 1, glow: true },
        { type: 'deco', x: px(25), y: px(12), sprite: 'save_star', scale: 1, glow: true }
      ]
    }, extra || {});
    return def(id, cfg);
  }

  temple('temple1', '대지의 신전 · 첫째', 'temple', 'ch1_temple');
  temple('temple2', '대지의 신전 · 둘째', 'temple', 'ch2_temple');
  temple('temple3', '대지의 신전 · 셋째', 'snow', 'ch3_temple');
  temple('temple4', '대지의 신전 · 넷째', 'jungle', 'ch4_temple');
  temple('temple5', '대지의 신전 · 다섯째', 'desert', 'ch5_temple');

  /* ---------- 2장: 스파고니아 ---------- */
  (function () {
    const g = grid(48, 24, '.');
    border(g, '#', 1);
    rect(g, 0, 0, 48, 2, 'R');
    rect(g, 0, 2, 48, 3, 'H');
    rect(g, 4, 3, 2, 2, 'W'); rect(g, 12, 3, 2, 2, 'W'); rect(g, 26, 3, 2, 2, 'W'); rect(g, 38, 3, 2, 2, 'W');
    rect(g, 8, 3, 2, 2, 'D'); rect(g, 32, 3, 2, 2, 'D');
    rect(g, 0, 19, 48, 2, 'R');
    rect(g, 0, 21, 48, 3, 'H');
    rect(g, 8, 21, 2, 2, 'W'); rect(g, 22, 21, 2, 2, 'W'); rect(g, 34, 21, 2, 2, 'W');
    rect(g, 0, 11, 48, 2, '=');
    rect(g, 20, 5, 2, 6, '+');
    def('spag_street', {
      name: '스파고니아 · 밤거리', theme: 'city', music: 'night', dark: true,
      tiles: rows(g),
      onEnter: 'ch2_arrive',
      spawns: {
        default: { x: px(3), y: px(12), dir: 'right' },
        from_west: { x: px(3), y: px(12), dir: 'right' },
        from_lab: { x: px(30), y: px(16), dir: 'down' }
      },
      objects: [
        { type: 'exit', x: px(47), y: px(12), w: 24, h: 90, to: 'spag_roof', spawn: 'default',
          locked: 'ch2_lab_done', lockedText: '* 대학 쪽에서 폭발음이 났다. 먼저 연구실이다.' },
        { type: 'exit', x: px(30), y: px(19), w: 60, h: 24, to: 'spag_lab', spawn: 'default' },
        { type: 'save', x: px(10), y: px(16), flavor: '가로등 아래, 아무도 없는 골목' },
        { type: 'npc', x: px(15), y: px(9), sprite: 'npc_c', script: 'spag_student', solid: true, face: true },
        { type: 'sign', x: px(24), y: px(16), sprite: 'sign', solid: true,
          text: '* “스파고니아 대학 — 가이아 문헌 연구소“\n* 화살표가 아래를 가리킨다.' }
      ],
      encounter: { step: 850, enemies: ['crawler', 'lantern'], flag: 'ch2_can_encounter' }
    });
  })();

  (function () {
    const g = grid(32, 20, '.');
    border(g, '#', 2);
    rect(g, 3, 3, 26, 2, 'x');
    rect(g, 3, 8, 8, 2, 'x'); rect(g, 21, 8, 8, 2, 'x');
    rect(g, 14, 17, 4, 3, '=');
    def('spag_lab', {
      name: '가이아 문헌 연구소', theme: 'lab', music: 'temple', indoor: true,
      tiles: rows(g),
      onEnter: 'ch2_lab',
      spawns: { default: { x: px(16), y: px(16), dir: 'up' } },
      objects: [
        { type: 'exit', x: px(16), y: px(19), w: 90, h: 20, to: 'spag_street', spawn: 'from_lab' },
        { type: 'npc', x: px(16), y: px(7), sprite: 'basil', script: 'ch2_basil_talk', solid: true, face: true },
        { type: 'sign', x: px(6), y: px(12), sprite: 'sign', solid: true,
          text: '* 벽에 붙은 지도.\n* 대륙 일곱 조각과, 그 사이의 균열이 붉게 표시되어 있다.' },
        { type: 'item', x: px(26), y: px(13), item: 'pie', flag: 'lab_pie' }
      ]
    });
  })();

  (function () {
    const g = grid(32, 22, 'x');
    border(g, '#', 2);
    rect(g, 4, 4, 24, 2, '|');
    rect(g, 14, 19, 4, 3, '=');
    def('spag_roof', {
      name: '연구소 옥상', theme: 'city', music: 'tension', dark: true,
      tiles: rows(g),
      onEnter: 'ch2_boss',
      spawns: { default: { x: px(16), y: px(18), dir: 'up' } },
      objects: []
    });
  })();

  /* ---------- 3장: 홀로스카 ---------- */
  (function () {
    const g = grid(48, 24, 'o');
    border(g, '^', 2);
    rect(g, 0, 0, 48, 4, '^');
    scatter(g, '*', 40, null, 'o');
    scatter(g, 'T', 10, null, 'o');
    rect(g, 0, 12, 48, 2, '.');
    def('holo_field', {
      name: '홀로스카 설원', theme: 'snow', music: 'night',
      tiles: rows(g),
      onEnter: 'ch3_arrive',
      spawns: { default: { x: px(3), y: px(13), dir: 'right' }, from_west: { x: px(3), y: px(13), dir: 'right' } },
      objects: [
        { type: 'exit', x: px(47), y: px(13), w: 24, h: 90, to: 'holo_village', spawn: 'from_west' },
        { type: 'save', x: px(12), y: px(17), flavor: '눈 위에 찍힌 네 발자국' },
        { type: 'item', x: px(30), y: px(8), item: 'stew', flag: 'holo_stew' }
      ],
      encounter: { step: 800, enemies: ['frost', 'crawler'], flag: 'ch3_can_encounter' }
    });
  })();

  (function () {
    const g = grid(32, 24, 'o');
    border(g, '^', 1);
    house(g, 3, 6, 7); house(g, 13, 6, 7); house(g, 23, 6, 7);
    rect(g, 0, 14, 32, 2, '.');
    rect(g, 14, 16, 4, 8, '.');
    def('holo_village', {
      name: '홀로스카 얼음 마을', theme: 'snow', music: 'town',
      tiles: rows(g),
      onEnter: 'ch3_village',
      spawns: { default: { x: px(2), y: px(15), dir: 'right' }, from_west: { x: px(2), y: px(15), dir: 'right' } },
      objects: [
        { type: 'exit', x: px(16), y: px(23), w: 90, h: 24, to: 'temple3', spawn: 'default' },
        { type: 'npc', x: px(9), y: px(13), sprite: 'npc_c', script: 'holo_villager', solid: true, face: true },
        { type: 'save', x: px(26), y: px(18), flavor: '굴뚝 연기와 언 손을 녹이는 온기' }
      ]
    });
  })();

  /* ---------- 4장: 아다바트 ---------- */
  (function () {
    const g = grid(48, 24, '.');
    rect(g, 0, 0, 48, 5, '~');
    rect(g, 0, 19, 48, 5, '~');
    border(g, 'T', 1);
    rect(g, 0, 11, 48, 3, '=');
    house(g, 10, 5, 7); house(g, 30, 14, 7);
    scatter(g, ',', 40, [1, 5, 46, 14]);
    scatter(g, 'T', 14, [1, 5, 46, 14]);
    rect(g, 0, 11, 3, 3, '=');
    def('ada_village', {
      name: '아다바트 수상마을', theme: 'jungle', music: 'town',
      tiles: rows(g),
      onEnter: 'ch4_arrive',
      spawns: { default: { x: px(3), y: px(12), dir: 'right' }, from_west: { x: px(3), y: px(12), dir: 'right' } },
      objects: [
        { type: 'exit', x: px(47), y: px(12), w: 24, h: 80, to: 'temple4', spawn: 'default' },
        { type: 'npc', x: px(14), y: px(10), sprite: 'npc_b', script: 'ada_villager', solid: true, face: true },
        { type: 'save', x: px(22), y: px(15), flavor: '물 위를 걷는 마을, 흔들리는 판자' },
        { type: 'item', x: px(38), y: px(8), item: 'sundae', flag: 'ada_sundae' }
      ],
      encounter: { step: 900, enemies: ['crawler', 'dune'], flag: 'ch4_can_encounter' }
    });
  })();

  /* ---------- 5장: 샤말 ---------- */
  (function () {
    const g = grid(48, 24, 's');
    border(g, '^', 2);
    scatter(g, '.', 60, null, 's');
    scatter(g, '^', 16, null, 's');
    rect(g, 0, 12, 48, 2, '=');
    def('shamar_dune', {
      name: '샤말 모래언덕', theme: 'desert', music: 'night',
      tiles: rows(g),
      onEnter: 'ch5_arrive',
      spawns: { default: { x: px(3), y: px(13), dir: 'right' }, from_west: { x: px(3), y: px(13), dir: 'right' } },
      objects: [
        { type: 'exit', x: px(47), y: px(13), w: 24, h: 80, to: 'temple5', spawn: 'default' },
        { type: 'save', x: px(20), y: px(17), flavor: '식어 가는 모래와 쏟아지는 별' },
        { type: 'item', x: px(33), y: px(8), item: 'kebab', flag: 'shamar_kebab' }
      ],
      encounter: { step: 780, enemies: ['dune', 'crawler'], flag: 'ch5_can_encounter' }
    });
  })();

  /* ---------- 6장: 오보이드랜드 ---------- */
  (function () {
    const g = grid(32, 24, 'x');
    border(g, '#', 2);
    rect(g, 4, 4, 10, 2, '|'); rect(g, 18, 4, 10, 2, '|');
    rect(g, 4, 10, 6, 6, '#'); rect(g, 22, 10, 6, 6, '#');
    rect(g, 14, 20, 4, 4, '=');
    rect(g, 6, 12, 2, 2, 'W'); rect(g, 24, 12, 2, 2, 'W');
    def('ovoid_gate', {
      name: '오보이드랜드 · 정문', theme: 'factory', music: 'tension', dark: true,
      tiles: rows(g),
      onEnter: 'ch6_arrive',
      spawns: { default: { x: px(16), y: px(21), dir: 'up' } },
      objects: [
        { type: 'exit', x: px(16), y: px(3), w: 90, h: 24, to: 'ovoid_core', spawn: 'default' },
        { type: 'save', x: px(9), y: px(19), flavor: '고장 난 회전목마와 끝없는 안내방송' },
        { type: 'sign', x: px(24), y: px(19), sprite: 'sign', solid: true,
          text: '* “오보이드랜드 — 세상에서 가장 즐거운 곳!“\n* 밑에 작게: “즐겁지 않을 경우 환불 불가“' }
      ],
      encounter: { step: 950, enemies: ['crawler', 'lantern'], flag: 'ch6_can_encounter' }
    });
  })();

  (function () {
    const g = grid(32, 24, 'x');
    border(g, '#', 2);
    rect(g, 2, 2, 28, 3, '|');
    rect(g, 12, 8, 8, 8, '_');
    rect(g, 14, 20, 4, 4, '=');
    def('ovoid_core', {
      name: '오보이드랜드 · 균열 위', theme: 'factory', music: 'tension', dark: true, indoor: true,
      tiles: rows(g),
      onEnter: 'ch6_boss',
      spawns: { default: { x: px(16), y: px(21), dir: 'up' } },
      objects: []
    });
  })();

  /* ---------- 7장: 심연 ---------- */
  (function () {
    const g = grid(32, 24, '.');
    border(g, '_', 2);
    rect(g, 6, 6, 20, 12, '_');
    rect(g, 14, 19, 4, 5, '.');
    scatter(g, '*', 24);
    def('abyss', {
      name: '균열 아래', theme: 'abyss', music: null, dark: true,
      tiles: rows(g),
      onEnter: 'ch7_abyss',
      spawns: { default: { x: px(16), y: px(21), dir: 'up' } },
      objects: []
    });
  })();

  UT.maps = {
    rooms: ROOMS,
    get: (id) => ROOMS[id],
    drawTiles,
    TS, px, grid, rect, border, rows
  };
})(window.UT);
