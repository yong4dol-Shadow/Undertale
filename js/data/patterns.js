/* =========================================================
   data/patterns.js - 탄환 객체 + 공격 패턴 라이브러리
   패턴은 제너레이터. yield 로 dt 를 받는다.
   ========================================================= */
(function (UT) {
  'use strict';

  const U = UT.util;
  const W = U.wait;

  /* ================= 탄환 ================= */
  function make(o) {
    const b = Object.assign({
      kind: 'circle',
      x: 0, y: 0, vx: 0, vy: 0, ax: 0, ay: 0,
      r: 6, w: 16, h: 16,
      angle: 0, spin: 0,
      color: '#ffffff',
      type: 'normal',        // normal | blue | orange
      damage: null,
      life: 12, age: 0,
      dead: false,
      harmless: false,
      alpha: 1,
      onUpdate: null
    }, o);
    if (b.type === 'blue') b.color = o.color || '#3fa9f5';
    if (b.type === 'orange') b.color = o.color || '#ff9c2a';
    return b;
  }

  function update(b, dt, battle) {
    b.age += dt;
    b.vx += b.ax * dt;
    b.vy += b.ay * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.angle += b.spin * dt;
    if (b.onUpdate) b.onUpdate(b, dt, battle);
    if (b.age > b.life) b.dead = true;
  }

  /** 탄환과 SOUL(중심 sx,sy / 반너비 hw) 충돌 */
  function hits(b, sx, sy, hw) {
    if (b.harmless || b.dead) return false;
    if (b.kind === 'circle' || b.kind === 'star') {
      const cx = U.clamp(b.x, sx - hw, sx + hw);
      const cy = U.clamp(b.y, sy - hw, sy + hw);
      return U.dist(b.x, b.y, cx, cy) < b.r;
    }
    // 회전 사각형
    const c = Math.cos(-b.angle), s = Math.sin(-b.angle);
    const dx = sx - b.x, dy = sy - b.y;
    const lx = dx * c - dy * s, ly = dx * s + dy * c;
    return Math.abs(lx) < b.w / 2 + hw && Math.abs(ly) < b.h / 2 + hw;
  }

  function draw(b, ctx) {
    ctx.save();
    ctx.globalAlpha = b.alpha;
    ctx.fillStyle = b.color;
    if (b.kind === 'circle') {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      if (b.type !== 'normal') {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 2, 0, Math.PI * 2); ctx.stroke();
      }
    } else if (b.kind === 'star') {
      ctx.translate(b.x, b.y); ctx.rotate(b.angle);
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const rr = i % 2 ? b.r * 0.42 : b.r;
        const a = (Math.PI / 4) * i;
        ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath(); ctx.fill();
    } else if (b.kind === 'bone') {
      ctx.translate(b.x, b.y); ctx.rotate(b.angle);
      const w = b.w, h = b.h;
      ctx.fillRect(-w / 2, -h / 2 + 4, w, h - 8);
      ctx.fillRect(-w / 2 - 3, -h / 2, w + 6, 5);
      ctx.fillRect(-w / 2 - 3, h / 2 - 5, w + 6, 5);
    } else if (b.kind === 'spike') {
      ctx.translate(b.x, b.y); ctx.rotate(b.angle);
      ctx.beginPath();
      ctx.moveTo(0, -b.h / 2); ctx.lineTo(b.w / 2, b.h / 2); ctx.lineTo(-b.w / 2, b.h / 2);
      ctx.closePath(); ctx.fill();
    } else { // rect / laser
      ctx.translate(b.x, b.y); ctx.rotate(b.angle);
      if (b.glow) {
        ctx.globalAlpha = b.alpha * 0.35;
        ctx.fillRect(-b.w / 2 - 4, -b.h / 2 - 4, b.w + 8, b.h + 8);
        ctx.globalAlpha = b.alpha;
      }
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    }
    ctx.restore();
  }

  UT.bullets = { make, update, hits, draw };

  /* ================= 패턴 라이브러리 =================
     각 패턴: function* (b) { ... }   b = 전투 씬
     ================================================= */
  const P = {};
  UT.patterns = P;

  const box = (b) => b.box;
  const cx = (b) => b.box.x + b.box.w / 2;
  const cy = (b) => b.box.y + b.box.h / 2;

  /* --- 위에서 떨어지는 비 --- */
  P.rain = (count, speed, gap) => function* (b) {
    for (let i = 0; i < count; i++) {
      const bx = U.rand(box(b).x + 10, box(b).x + box(b).w - 10);
      b.spawn(make({ x: bx, y: box(b).y - 14, vy: speed, r: 7 }));
      yield* W(gap || 0.22);
    }
    yield* W(0.9);
  };

  /* --- 좌우에서 밀려오는 탄 --- */
  P.side = (count, speed, gap) => function* (b) {
    for (let i = 0; i < count; i++) {
      const fromLeft = i % 2 === 0;
      const by = U.rand(box(b).y + 12, box(b).y + box(b).h - 12);
      b.spawn(make({
        x: fromLeft ? box(b).x - 14 : box(b).x + box(b).w + 14,
        y: by, vx: fromLeft ? speed : -speed, r: 7
      }));
      yield* W(gap || 0.26);
    }
    yield* W(0.8);
  };

  /* --- 조준 사격 --- */
  P.aimed = (count, speed, gap) => function* (b) {
    for (let i = 0; i < count; i++) {
      const ox = cx(b) + U.rand(-120, 120), oy = box(b).y - 60;
      const a = U.angle(ox, oy, b.soul.x, b.soul.y);
      b.spawn(make({ x: ox, y: oy, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 6, color: '#ffffff' }));
      yield* W(gap || 0.45);
    }
    yield* W(0.8);
  };

  /* --- 회전 나선 --- */
  P.spiral = (dur, arms, speed) => function* (b) {
    let t = 0, a = 0;
    while (t < dur) {
      const dt = yield;
      t += dt; a += dt * 2.4;
      if (Math.floor(t * 8) !== Math.floor((t - dt) * 8)) {
        for (let i = 0; i < arms; i++) {
          const ang = a + (Math.PI * 2 / arms) * i;
          b.spawn(make({ x: cx(b), y: cy(b), vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, r: 5 }));
        }
      }
    }
    yield* W(0.9);
  };

  /* --- 틈이 있는 벽 --- */
  P.walls = (count, speed, gapSize) => function* (b) {
    for (let i = 0; i < count; i++) {
      const bx = box(b);
      const gapY = U.rand(bx.y + 30, bx.y + bx.h - 30);
      const g = gapSize || 46;
      const fromLeft = i % 2 === 0;
      const x = fromLeft ? bx.x - 12 : bx.x + bx.w + 12;
      const vx = fromLeft ? speed : -speed;
      const topH = gapY - g / 2 - bx.y;
      const botH = bx.y + bx.h - (gapY + g / 2);
      if (topH > 4) b.spawn(make({ kind: 'rect', x, y: bx.y + topH / 2, w: 16, h: topH, vx, color: '#ffffff' }));
      if (botH > 4) b.spawn(make({ kind: 'rect', x, y: bx.y + bx.h - botH / 2, w: 16, h: botH, vx, color: '#ffffff' }));
      yield* W(1.05);
    }
    yield* W(0.6);
  };

  /* --- 파랑/주황 교육 패턴 --- */
  P.blueOrange = (count) => function* (b) {
    for (let i = 0; i < count; i++) {
      const bx = box(b);
      const type = i % 2 ? 'blue' : 'orange';
      const fromLeft = U.chance(0.5);
      b.spawn(make({
        kind: 'bone', type,
        x: fromLeft ? bx.x - 20 : bx.x + bx.w + 20,
        y: bx.y + bx.h / 2, w: 14, h: bx.h - 8,
        vx: fromLeft ? 150 : -150
      }));
      yield* W(1.15);
    }
    yield* W(0.6);
  };

  /* --- 바닥에서 솟는 가시 --- */
  P.spikes = (count, gap) => function* (b) {
    for (let i = 0; i < count; i++) {
      const bx = box(b);
      const x = U.rand(bx.x + 16, bx.x + bx.w - 16);
      // 경고
      const warn = b.spawn(make({
        kind: 'rect', x, y: bx.y + bx.h - 2, w: 22, h: 3,
        color: '#ff5a5a', harmless: true, life: 0.45
      }));
      yield* W(0.4);
      b.spawn(make({
        kind: 'spike', x, y: bx.y + bx.h + 12, w: 24, h: 34,
        vy: -260, ay: 320, life: 2.2, angle: 0
      }));
      warn.dead = true;
      yield* W(gap || 0.35);
    }
    yield* W(0.7);
  };

  /* --- 레이저 스윕 --- */
  P.laser = (count, horizontal) => function* (b) {
    for (let i = 0; i < count; i++) {
      const bx = box(b);
      const pos = horizontal
        ? U.rand(bx.y + 16, bx.y + bx.h - 16)
        : U.rand(bx.x + 16, bx.x + bx.w - 16);
      const warn = b.spawn(make({
        kind: 'rect',
        x: horizontal ? bx.x + bx.w / 2 : pos,
        y: horizontal ? pos : bx.y + bx.h / 2,
        w: horizontal ? bx.w : 3, h: horizontal ? 3 : bx.h,
        color: '#ff5a5a', harmless: true, life: 0.7, alpha: 0.9
      }));
      yield* W(0.6);
      warn.dead = true;
      const laser = b.spawn(make({
        kind: 'rect', glow: true,
        x: horizontal ? bx.x + bx.w / 2 : pos,
        y: horizontal ? pos : bx.y + bx.h / 2,
        w: horizontal ? bx.w : 16, h: horizontal ? 16 : bx.h,
        color: '#ffffff', life: 0.34
      }));
      UT.audio.sfx('slash');
      yield* W(0.42);
      laser.dead = true;
    }
    yield* W(0.5);
  };

  /* --- 벽에 튕기는 공 --- */
  P.bounce = (count, dur, speed) => function* (b) {
    const bx = box(b);
    for (let i = 0; i < count; i++) {
      const a = U.rand(0, Math.PI * 2);
      b.spawn(make({
        x: cx(b) + U.rand(-40, 40), y: cy(b) + U.rand(-20, 20),
        vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 8, life: dur + 0.5,
        onUpdate(s) {
          const k = box(b);
          if (s.x < k.x + s.r) { s.x = k.x + s.r; s.vx *= -1; }
          if (s.x > k.x + k.w - s.r) { s.x = k.x + k.w - s.r; s.vx *= -1; }
          if (s.y < k.y + s.r) { s.y = k.y + s.r; s.vy *= -1; }
          if (s.y > k.y + k.h - s.r) { s.y = k.y + k.h - s.r; s.vy *= -1; }
        }
      }));
    }
    yield* W(dur);
  };

  /* --- 중앙에서 퍼지는 고리(빈틈 하나) --- */
  P.ring = (count, speed, dur) => function* (b) {
    for (let n = 0; n < count; n++) {
      const hole = U.rand(0, Math.PI * 2);
      for (let i = 0; i < 16; i++) {
        const a = (Math.PI * 2 / 16) * i;
        let diff = Math.abs(((a - hole + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if (diff > Math.PI - 0.45) continue;
        b.spawn(make({ x: cx(b), y: cy(b), vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 5 }));
      }
      yield* W(dur || 0.85);
    }
    yield* W(0.5);
  };

  /* --- 눈보라(사선 눈) --- */
  P.blizzard = (dur, speed) => function* (b) {
    let t = 0;
    while (t < dur) {
      const dt = yield; t += dt;
      if (U.chance(dt * 14)) {
        const bx = box(b);
        b.spawn(make({
          kind: 'star', x: U.rand(bx.x - 40, bx.x + bx.w), y: bx.y - 12,
          vx: speed * 0.5, vy: speed, r: 7, spin: 3, color: '#dff2ff'
        }));
      }
    }
    yield* W(0.7);
  };

  /* --- 넝쿨(위아래에서 자라는 기둥) --- */
  P.vines = (count) => function* (b) {
    for (let i = 0; i < count; i++) {
      const bx = box(b);
      const x = U.rand(bx.x + 20, bx.x + bx.w - 20);
      const fromTop = U.chance(0.5);
      const v = b.spawn(make({
        kind: 'rect', x, y: fromTop ? bx.y : bx.y + bx.h, w: 18, h: 0,
        color: '#5ad07a', life: 1.8,
        onUpdate(s, dt) {
          if (s.age < 0.55) {
            s.h = Math.min(bx.h * 0.72, s.h + 260 * dt);
            s.y = fromTop ? bx.y + s.h / 2 : bx.y + bx.h - s.h / 2;
          }
        }
      }));
      yield* W(0.62);
      v.life = Math.min(v.life, v.age + 0.35);
    }
    yield* W(0.6);
  };

  /* --- 톱니바퀴(좌우 왕복) --- */
  P.gears = (count, dur) => function* (b) {
    const bx = box(b);
    for (let i = 0; i < count; i++) {
      const y = bx.y + (bx.h / (count + 1)) * (i + 1);
      const dir = i % 2 ? -1 : 1;
      b.spawn(make({
        kind: 'star', x: dir > 0 ? bx.x + 10 : bx.x + bx.w - 10, y,
        r: 14, spin: 7, color: '#ffd24d', life: dur + 0.4,
        vx: dir * 130,
        onUpdate(s) {
          if (s.x < bx.x + 12) { s.x = bx.x + 12; s.vx = Math.abs(s.vx); }
          if (s.x > bx.x + bx.w - 12) { s.x = bx.x + bx.w - 12; s.vx = -Math.abs(s.vx); }
        }
      }));
    }
    yield* W(dur);
  };

  /* --- 미사일(느리게 유도 후 가속) --- */
  P.missiles = (count, gap) => function* (b) {
    for (let i = 0; i < count; i++) {
      const bx = box(b);
      const sx = U.chance(0.5) ? bx.x - 20 : bx.x + bx.w + 20;
      const sy = U.rand(bx.y + 10, bx.y + bx.h - 10);
      b.spawn(make({
        kind: 'bone', x: sx, y: sy, w: 22, h: 10, r: 8, color: '#ff8a4a', life: 3.2,
        onUpdate(s, dt) {
          if (s.age < 1.0) {
            const a = U.angle(s.x, s.y, b.soul.x, b.soul.y);
            const cur = Math.atan2(s.vy, s.vx);
            const na = cur + U.clamp(((a - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI, -2.6 * dt, 2.6 * dt);
            const sp = 150;
            s.vx = Math.cos(na) * sp; s.vy = Math.sin(na) * sp;
          } else {
            s.vx *= 1 + dt * 1.6; s.vy *= 1 + dt * 1.6;
          }
          s.angle = Math.atan2(s.vy, s.vx);
        }
      }));
      yield* W(gap || 0.6);
    }
    yield* W(0.9);
  };

  /* --- 어둠의 손(위에서 내려찍기) --- */
  P.grasp = (count) => function* (b) {
    for (let i = 0; i < count; i++) {
      const bx = box(b);
      const x = b.soul.x;
      const warn = b.spawn(make({
        kind: 'rect', x, y: bx.y + bx.h / 2, w: 40, h: bx.h,
        color: '#ff3a3a', harmless: true, alpha: 0.28, life: 0.75
      }));
      yield* W(0.65);
      warn.dead = true;
      b.spawn(make({
        kind: 'rect', x, y: bx.y - 30, w: 40, h: 60, color: '#3a2050', vy: 620, life: 1.6
      }));
      UT.audio.sfx('hit');
      yield* W(0.45);
    }
    yield* W(0.6);
  };

  /* --- 최종전: 화면 전체 눈동자 광선 --- */
  P.noxEyes = (count) => function* (b) {
    for (let i = 0; i < count; i++) {
      const bx = box(b);
      const ox = cx(b) + U.rand(-160, 160), oy = bx.y - 90;
      const a = U.angle(ox, oy, b.soul.x, b.soul.y);
      const warn = b.spawn(make({
        kind: 'rect', x: ox + Math.cos(a) * 300, y: oy + Math.sin(a) * 300,
        w: 700, h: 3, angle: a, color: '#ff3a3a', harmless: true, life: 0.6, alpha: 0.8
      }));
      yield* W(0.5);
      warn.dead = true;
      const l = b.spawn(make({
        kind: 'rect', glow: true, x: ox + Math.cos(a) * 300, y: oy + Math.sin(a) * 300,
        w: 700, h: 18, angle: a, color: '#c060ff', life: 0.3
      }));
      UT.audio.sfx('slash');
      yield* W(0.36);
      l.dead = true;
    }
    yield* W(0.5);
  };

  /* --- 여러 패턴을 순서대로 --- */
  P.seq = function () {
    const list = Array.prototype.slice.call(arguments);
    return function* (b) {
      for (const p of list) yield* p(b);
    };
  };

  /* --- 두 패턴을 동시에 --- */
  P.par = function (a, c) {
    return function* (b) {
      const g1 = a(b), g2 = c(b);
      g1.next(); g2.next();
      let d1 = false, d2 = false;
      while (!d1 || !d2) {
        const dt = yield;
        if (!d1) d1 = !!g1.next(dt).done;
        if (!d2) d2 = !!g2.next(dt).done;
      }
    };
  };

})(window.UT);
