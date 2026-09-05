/* =========================================================
   core/sprite.js - 문자열 기반 도트 스프라이트 렌더러
   rows 의 각 문자가 pal 의 색을 가리킨다. '.' 은 투명.
   ========================================================= */
(function (UT) {
  'use strict';

  const cache = new Map();

  function make(def) {
    const rows = def.rows;
    return {
      rows,
      pal: def.pal,
      w: def.w || (rows[0] ? rows[0].length : 0),
      h: def.h || rows.length,
      key: def.key || ('s' + (cache.size + Math.random()))
    };
  }

  /** 스프라이트를 오프스크린 캔버스로 굽는다(스케일/틴트별 캐시) */
  function bake(spr, scale, tint) {
    const key = spr.key + '|' + scale + '|' + (tint || '');
    let c = cache.get(key);
    if (c) return c;
    c = document.createElement('canvas');
    c.width = Math.max(1, spr.w * scale);
    c.height = Math.max(1, spr.h * scale);
    const g = c.getContext('2d');
    for (let y = 0; y < spr.h; y++) {
      const row = spr.rows[y] || '';
      for (let x = 0; x < spr.w; x++) {
        const ch = row[x];
        if (!ch || ch === '.' || ch === ' ') continue;
        const col = tint || spr.pal[ch];
        if (!col) continue;
        g.fillStyle = col;
        g.fillRect(x * scale, y * scale, scale, scale);
      }
    }
    cache.set(key, c);
    return c;
  }

  /**
   * opts: {scale, flip, tint, alpha, center(기본 true = x,y 가 바닥 중앙)}
   */
  function draw(ctx, spr, x, y, opts) {
    if (!spr) return;
    opts = opts || {};
    const s = opts.scale || 1;
    const img = bake(spr, s, opts.tint);
    const w = img.width, h = img.height;
    let dx = opts.center === false ? x : Math.round(x - w / 2);
    let dy = opts.center === false ? y : Math.round(y - h);
    if (opts.alpha != null && opts.alpha < 1) {
      ctx.save(); ctx.globalAlpha = opts.alpha;
    }
    if (opts.flip) {
      ctx.save();
      ctx.translate(dx + w, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    } else {
      ctx.drawImage(img, dx, dy);
    }
    if (opts.alpha != null && opts.alpha < 1) ctx.restore();
  }

  UT.sprite = { make, draw, bake, cache };
})(window.UT);
