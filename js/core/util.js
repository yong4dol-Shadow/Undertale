/* =========================================================
   UNDERTALE : 갈라진 대지
   core/util.js - 공용 수학 / 그리기 유틸리티
   ========================================================= */
window.UT = window.UT || {};

(function (UT) {
  'use strict';

  const U = {};
  UT.util = U;

  /* ---------- 수학 ---------- */
  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.rand = (a, b) => a + Math.random() * (b - a);
  U.randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.chance = (p) => Math.random() < p;
  U.sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
  U.dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  U.angle = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);
  U.wave = (t, speed, amp) => Math.sin(t * speed) * amp;

  /** a 를 b 쪽으로 최대 d 만큼 이동 */
  U.approach = function (a, b, d) {
    if (a < b) return Math.min(a + d, b);
    if (a > b) return Math.max(a - d, b);
    return b;
  };

  U.overlap = function (a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };

  /* ---------- 그리기 ---------- */
  U.FONT_STACK = '"DungGeunMo","Galmuri11","Neo둥근모","Apple SD Gothic Neo","맑은 고딕",monospace';
  U.font = (size, weight) => (weight ? weight + ' ' : '') + size + 'px ' + U.FONT_STACK;

  /** 사각 테두리(언더테일식 흰 테두리 검은 상자) */
  U.frame = function (ctx, x, y, w, h, border, fill, thick) {
    thick = thick || 5;
    ctx.fillStyle = border || '#ffffff';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = fill || '#000000';
    ctx.fillRect(x + thick, y + thick, w - thick * 2, h - thick * 2);
  };

  /** 테두리만 */
  U.strokeBox = function (ctx, x, y, w, h, color, thick) {
    thick = thick || 2;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, thick);
    ctx.fillRect(x, y + h - thick, w, thick);
    ctx.fillRect(x, y, thick, h);
    ctx.fillRect(x + w - thick, y, thick, h);
  };

  /** 문자열을 maxW 픽셀에 맞춰 줄바꿈. \n 은 강제 개행 */
  U.wrap = function (ctx, text, maxW) {
    const out = [];
    String(text).split('\n').forEach((para) => {
      let line = '';
      for (const ch of para) {
        const test = line + ch;
        if (ctx.measureText(test).width > maxW && line.length) {
          out.push(line);
          line = ch;
        } else {
          line = test;
        }
      }
      out.push(line);
    });
    return out;
  };

  /** 가운데 정렬 텍스트 */
  U.centerText = function (ctx, text, cx, y, color) {
    ctx.save();
    ctx.textAlign = 'center';
    if (color) ctx.fillStyle = color;
    ctx.fillText(text, cx, y);
    ctx.restore();
  };

  /** 무지개/그라디언트 유틸 */
  U.hsl = (h, s, l) => 'hsl(' + ((h % 360) + 360) % 360 + ',' + s + '%,' + l + '%)';

  /** 값 보간 이징 */
  U.easeOut = (t) => 1 - Math.pow(1 - t, 3);
  U.easeIn = (t) => t * t * t;
  U.easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* ---------- 제너레이터 기반 스크립트 유틸 ---------- */
  /** dt 를 next() 로 받는 제너레이터에서 sec 초 대기 */
  U.wait = function* (sec) {
    let t = 0;
    while (t < sec) t += yield;
  };

  /** 조건이 참이 될 때까지 대기 */
  U.until = function* (fn) {
    while (!fn()) yield;
  };

  /* ---------- 배열 ---------- */
  U.remove = function (arr, item) {
    const i = arr.indexOf(item);
    if (i >= 0) arr.splice(i, 1);
    return arr;
  };

  /** 한글 조사 자동 선택 ( 을/를, 이/가, 은/는, 와/과 ) */
  U.josa = function (word, pair) {
    const table = { '을': ['을', '를'], '이': ['이', '가'], '은': ['은', '는'], '와': ['과', '와'], '으로': ['으로', '로'] };
    const opts = table[pair] || ['', ''];
    if (!word || !word.length) return opts[1];
    const code = word.charCodeAt(word.length - 1);
    if (code < 0xac00 || code > 0xd7a3) return opts[1];
    const jong = (code - 0xac00) % 28;
    if (pair === '으로') return jong === 0 || jong === 8 ? opts[1] : opts[0];
    return jong === 0 ? opts[1] : opts[0];
  };

})(window.UT);
