/* =========================================================
   scenes/overworld.js - 필드 탐험 (이동 / 대화 / 세이브 / 조우)
   ========================================================= */
(function (UT) {
  'use strict';

  const U = UT.util;
  const TS = 20; // 타일 크기

  /* 통과 불가 타일 */
  const SOLID = '#T~^HW|+_BRD';

  const world = {
    room: null,
    player: { x: 320, y: 240, dir: 'down', anim: 0, moving: false, speed: 118 },
    cam: { x: 0, y: 0 },
    objects: [],
    encounterMeter: 0,
    transition: 0,
    pendingScript: null,
    scene: null,

    /* ---------- 방 이동 ---------- */
    goto(roomId, spawn, opts) {
      opts = opts || {};
      const r = UT.maps.get(roomId);
      if (!r) { console.warn('no room', roomId); return; }
      this.room = r;
      this.objects = r.objects.map((o) => Object.assign({}, o));
      const sp = (r.spawns && (r.spawns[spawn] || r.spawns.default)) || { x: 320, y: 240, dir: 'down' };
      if (opts.keepPos) { /* 위치 유지 */ }
      else {
        this.player.x = sp.x; this.player.y = sp.y; this.player.dir = sp.dir || 'down';
      }
      UT.game.data.room = roomId;
      UT.game.data.x = this.player.x;
      UT.game.data.y = this.player.y;
      this.encounterMeter = 0;
      this.updateCam(true);
      if (r.music !== undefined) { if (r.music) UT.audio.play(r.music); else UT.audio.stop(); }
      /* 방 진입 스크립트는 바로 실행하지 않고 예약한다.
         (컷신 도중 goto 가 불려도 진행 중인 스크립트를 끊지 않기 위해) */
      this.pendingScript = null;
      if (r.onEnter) {
        const key = 'scene_' + r.onEnter + '_done';
        if (!UT.game.flag(key)) {
          UT.game.flag(key, true);
          this.pendingScript = r.onEnter;
        }
      }
    },

    updateCam(snap) {
      const r = this.room;
      if (!r) return;
      const maxX = Math.max(0, r.wpx - 640), maxY = Math.max(0, r.hpx - 480);
      const tx = U.clamp(this.player.x - 320, 0, maxX);
      const ty = U.clamp(this.player.y - 260, 0, maxY);
      if (snap) { this.cam.x = tx; this.cam.y = ty; }
      else {
        this.cam.x = U.lerp(this.cam.x, tx, 0.16);
        this.cam.y = U.lerp(this.cam.y, ty, 0.16);
      }
    },

    /* ---------- 충돌 ---------- */
    solidAt(px, py) {
      const r = this.room;
      const tx = Math.floor(px / TS), ty = Math.floor(py / TS);
      if (tx < 0 || ty < 0 || ty >= r.tiles.length) return true;
      const row = r.tiles[ty];
      if (tx >= row.length) return true;
      return SOLID.indexOf(row[tx]) >= 0;
    },

    blocked(px, py) {
      // 발밑 히트박스
      const hw = 7, top = py - 11, bot = py - 1;
      if (this.solidAt(px - hw, top) || this.solidAt(px + hw, top) ||
          this.solidAt(px - hw, bot) || this.solidAt(px + hw, bot)) return true;
      for (const o of this.objects) {
        if (!o.solid && o.type !== 'npc' && o.type !== 'deco') continue;
        if (o.pass) continue;
        const ow = o.w || 20, oh = o.h || 14;
        const ox = o.x - ow / 2, oy = o.y - oh;
        if (px + hw > ox && px - hw < ox + ow && py > oy && py - 12 < oy + oh) return true;
      }
      return false;
    },

    /* ---------- 상호작용 ---------- */
    facingPoint() {
      const p = this.player;
      const d = { down: [0, 16], up: [0, -14], left: [-18, 2], right: [18, 2] }[p.dir];
      return { x: p.x + d[0], y: p.y + d[1] };
    },

    interact() {
      const f = this.facingPoint();
      let best = null, bd = 1e9;
      for (const o of this.objects) {
        if (!o.script && !o.text && o.type !== 'save' && o.type !== 'item') continue;
        if (o.taken) continue;
        const d = U.dist(f.x, f.y, o.x, o.y - 8);
        if (d < 26 && d < bd) { bd = d; best = o; }
      }
      if (!best) return false;
      if (best.face) {
        const p = this.player;
        best.dir = Math.abs(best.x - p.x) > Math.abs(best.y - p.y)
          ? (best.x > p.x ? 'left' : 'right')
          : (best.y > p.y ? 'up' : 'down');
      }
      if (best.type === 'save') { this.doSave(best); return true; }
      if (best.type === 'item') { this.pickItem(best); return true; }
      if (best.script) {
        const s = UT.story[best.script];
        if (s) { UT.director.run(s, best); return true; }
      }
      if (best.text) {
        const lines = Array.isArray(best.text) ? best.text : [best.text];
        UT.director.run(function* () { yield* UT.S.say.apply(null, lines); });
        return true;
      }
      return false;
    },

    pickItem(o) {
      const it = UT.items.get(o.item);
      const self = this;
      UT.director.run(function* () {
        if (UT.game.data.items.length >= 8) {
          yield* UT.S.say('* ' + it.name + '을(를) 발견했다.', '* ...하지만 손이 모자란다.');
          return;
        }
        UT.items.add(o.item);
        o.taken = true;
        if (o.flag) UT.game.flag(o.flag, true);
        UT.audio.sfx('confirm');
        yield* UT.S.say('* ' + it.name + U.josa(it.name, '을') + ' 손에 넣었다.');
      });
    },

    doSave(o) {
      const d = UT.game.data;
      const self = this;
      UT.director.run(function* () {
        UT.audio.sfx('save');
        d.hp = d.maxhp;
        const flavor = o.flavor || (self.room.name + '의 빛');
        const pick = yield* UT.S.choice(
          '* ' + flavor + '\n* 결의가 가득 찼다. (HP 전부 회복)',
          ['저장', '돌아가기']
        );
        if (pick === 0) {
          d.saveRoom = self.room.id;
          d.savePos = { x: self.player.x, y: self.player.y, dir: self.player.dir };
          UT.game.save();
          UT.audio.sfx('save');
          yield* UT.S.say('* 파일이 저장되었다.');
        }
      });
    },

    /* ---------- 조우 ---------- */
    tickEncounter(dist) {
      const r = this.room;
      if (!r.encounter) return;
      if (r.encounter.flag && !UT.game.flag(r.encounter.flag)) return;
      if (UT.game.flag('no_encounter')) return;
      this.encounterMeter += dist;
      if (this.encounterMeter > r.encounter.step) {
        this.encounterMeter = -U.rand(0, 120);
        const id = U.pick(r.encounter.enemies);
        const self = this;
        UT.audio.sfx('encounter');
        UT.director.run(function* () {
          UT.game.flash('#ffffff', 0.9);
          yield* UT.S.wait(0.45);
          yield* UT.S.battle(id);
          UT.audio.play(self.room.music);
        });
      }
    },

    /* ================= 씬 ================= */
    makeScene() {
      const self = this;
      return {
        update(dt) {
          let busy = UT.director.update(dt);
          if (!busy && self.pendingScript) {
            const name = self.pendingScript;
            self.pendingScript = null;
            const sc = UT.story[name];
            if (sc) { UT.director.run(sc); busy = true; }
          }
          const p = self.player;
          if (!busy) {
            const ax = UT.input.axis();
            let mag = Math.hypot(ax.x, ax.y);
            p.moving = mag > 0;
            if (mag > 0) {
              const nx = (ax.x / mag) * p.speed * dt;
              const ny = (ax.y / mag) * p.speed * dt;
              if (Math.abs(ax.x) > 0) p.dir = ax.x > 0 ? 'right' : 'left';
              if (Math.abs(ax.y) > Math.abs(ax.x)) p.dir = ax.y > 0 ? 'down' : 'up';
              if (!self.blocked(p.x + nx, p.y)) p.x += nx;
              if (!self.blocked(p.x, p.y + ny)) p.y += ny;
              p.anim += dt * 7;
              self.tickEncounter(Math.hypot(nx, ny));
              UT.game.data.steps += Math.hypot(nx, ny) * 0.05;
            } else p.anim = 0;

            if (UT.input.pressed('confirm')) self.interact();
            if (UT.input.pressed('menu')) UT.game.push(UT.scenes.menu());

            /* 출구 / 트리거 */
            for (const o of self.objects) {
              if (o.type !== 'exit' && o.type !== 'trigger') continue;
              const ow = o.w || 24, oh = o.h || 24;
              if (Math.abs(p.x - o.x) > ow / 2 || Math.abs(p.y - o.y) > oh / 2) { o._msg = false; continue; }
              if (o.type === 'exit') {
                if (o.locked && !UT.game.flag(o.locked)) {
                  if (!o._msg) {
                    o._msg = true;
                    UT.director.run(function* () { yield* UT.S.say(o.lockedText || '* 아직 갈 수 없다.'); });
                  }
                  continue;
                }
                self.travel(o.to, o.spawn);
                break;
              } else {
                if (o.once && UT.game.flag('trig_' + o.flag)) continue;
                if (o.flag) UT.game.flag('trig_' + o.flag, true);
                const s = UT.story[o.script];
                if (s) { UT.director.run(s, o); break; }
              }
            }
          } else p.moving = false;

          self.updateCam(false);
          UT.game.data.x = p.x; UT.game.data.y = p.y;
        },

        draw(ctx) { self.draw(ctx); }
      };
    },

    travel(to, spawn) {
      const self = this;
      UT.director.run(function* () {
        yield* UT.S.fadeOut(0.35);
        self.goto(to, spawn);
        yield* UT.S.fadeIn(0.35);
      });
    },

    /* ================= 그리기 ================= */
    draw(ctx) {
      const r = this.room;
      if (!r) return;
      ctx.save();
      ctx.translate(-Math.round(this.cam.x), -Math.round(this.cam.y));

      UT.maps.drawTiles(ctx, r, this.cam);

      /* 오브젝트 + 플레이어 y 정렬 */
      const drawables = [];
      for (const o of this.objects) {
        if (o.taken) continue;
        if (o.type === 'exit' || o.type === 'trigger' || o.type === 'solid') continue;
        drawables.push(o);
      }
      drawables.push({ _player: true, x: this.player.x, y: this.player.y });
      drawables.sort((a, b) => a.y - b.y);

      for (const o of drawables) {
        if (o._player) this.drawPlayer(ctx);
        else this.drawObject(ctx, o);
      }

      /* 어둠(밤) */
      if (r.dark) {
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.42;
        ctx.fillStyle = '#0a0a2a';
        ctx.fillRect(0, 0, 640, 480);
        ctx.restore();
        ctx.save();
        ctx.translate(-Math.round(this.cam.x), -Math.round(this.cam.y));
      }
      ctx.restore();

      /* 방 이름 */
      if (this.nameT > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, this.nameT);
        ctx.font = U.font(20);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(r.name, 16, 14);
        ctx.restore();
      }

      UT.director.draw(ctx);
    },

    drawPlayer(ctx) {
      const p = this.player;
      const night = UT.game.data.form === 'night';
      const base = night ? 'night_' : 'hero_';
      const side = p.dir === 'left' || p.dir === 'right';
      const key = side ? 'side' : (p.dir === 'up' ? 'up' : 'down');
      let name = base + key;
      if (p.moving) {
        const f = Math.floor(p.anim) % 4;
        if (f === 1) name = base + key + '_a';
        else if (f === 3) name = base + key + '_b';
      }
      const spr = UT.sprites[name] || UT.sprites[base + key];
      UT.sprite.draw(ctx, spr, p.x, p.y + 2, { flip: p.dir === 'left' });
      /* 코코 따라다니기 */
      if (UT.game.flag('coco_follow')) {
        const t = UT.game.time;
        const cx = p.x - 22 + Math.sin(t * 1.6) * 4;
        const cy = p.y - 26 + Math.sin(t * 2.4) * 5;
        const spr2 = Math.floor(t * 6) % 2 ? UT.sprites.coco : UT.sprites.coco_b;
        UT.sprite.draw(ctx, spr2, cx, cy);
      }
    },

    drawObject(ctx, o) {
      if (o.type === 'save') {
        const spr = UT.sprites.save_star;
        const s = 1 + Math.sin(UT.game.time * 3) * 0.06;
        UT.sprite.draw(ctx, spr, o.x, o.y + 6);
        return;
      }
      if (o.type === 'item') {
        const it = UT.items.get(o.item);
        const spr = UT.sprites[(it && it.sprite) || 'choco'];
        UT.sprite.draw(ctx, spr, o.x, o.y + 4 + Math.sin(UT.game.time * 2.6) * 2);
        return;
      }
      const key = o.sprite || 'npc_a';
      const spr = UT.sprites[key];
      if (!spr) return;
      const opt = { scale: o.scale || 1, flip: o.type === 'npc' && o.dir === 'left' };
      if (o.glow) {
        ctx.save();
        ctx.globalAlpha = 0.25 + Math.sin(UT.game.time * 2 + o.x) * 0.12;
        ctx.fillStyle = '#ffe9a8';
        ctx.beginPath(); ctx.arc(o.x, o.y - 10, 22, 0, 6.3); ctx.fill();
        ctx.restore();
      }
      UT.sprite.draw(ctx, spr, o.x, o.y, opt);
    }
  };

  UT.world = world;
  UT.scenes = UT.scenes || {};
  UT.scenes.overworld = function () {
    if (!world.scene) world.scene = world.makeScene();
    return world.scene;
  };
})(window.UT);
