/* =========================================================
   scenes/battle.js - 언더테일식 전투
   FIGHT / ACT / ITEM / MERCY + SOUL 탄막 회피
   ========================================================= */
(function (UT) {
  'use strict';

  const U = UT.util;
  const B = UT.bullets;

  const BTN = ['FIGHT', 'ACT', 'ITEM', 'MERCY'];
  const BTN_KO = ['공격', '행동', '물품', '자비'];
  const BTN_COL = ['#ff8a2a', '#ff8a2a', '#ff8a2a', '#ff8a2a'];

  function battle(enemyId, opts) {
    opts = opts || {};
    const e = UT.enemies.spawn(enemyId);
    const D = UT.game.data;

    const b = {
      enemy: e,
      opts,
      state: 'intro',
      t: 0,
      turn: 0,
      sel: 0,
      subSel: 0,
      bullets: [],
      playerBuff: 0,
      lastBattleText: null,
      dialog: null,
      msgQueue: null,
      afterMsg: null,
      hurtT: 0,
      enemyHurtT: 0,
      enemyShake: 0,
      dmgPops: [],
      slash: 0,
      flee: 0,
      delayT: 0,
      delayFn: null,
      spareGlow: 0,
      pattern: null,
      patternTime: 0,
      showEnemyHp: 0,
      bubble: null,
      bubbleT: 0,
      result: null,
      soul: { x: 320, y: 320, vx: 0, vy: 0, moving: false, moveT: 0 },
      night: D.form === 'night',
      drawBelow: false,

      /* ---------- 박스 ---------- */
      box: { x: 155, y: 246, w: 330, h: 140 },
      baseBox: null,

      setBox(w, h) {
        this.box.w = w; this.box.h = h;
        this.box.x = 320 - w / 2;
        this.box.y = 316 - h / 2;
      },

      spawn(bullet) {
        if (bullet.damage == null) bullet.damage = null;
        this.bullets.push(bullet);
        return bullet;
      },

      /* ================= 진입 ================= */
      enter() {
        UT.audio.play(e.music || 'battle');
        this.setBox(this.night ? 380 : 330, this.night ? 158 : 140);
        this.soul.x = 320; this.soul.y = this.box.y + this.box.h / 2;
        this.msg([e.encounter || ('* ' + e.name + ' 나타났다!')], () => { this.state = 'menu'; });
      },
      exit() { },

      /* ================= 지연 실행 ================= */
      after(sec, fn) { this.delayT = sec; this.delayFn = fn; },

      /* ================= 메시지 헬퍼 ================= */
      msg(lines, after) {
        const pages = (Array.isArray(lines) ? lines : [lines]).map((t) => ({
          text: t, noFrame: true, size: 22, sound: 'blip2'
        }));
        this.dialog = UT.dialog.create(pages, {
          box: { x: this.box.x, y: this.box.y, w: this.box.w, h: this.box.h }
        });
        this.afterMsg = after || null;
        this.state = 'text';
      },

      /* ================= 갱신 ================= */
      update(dt) {
        this.t += dt;
        if (this.hurtT > 0) this.hurtT -= dt;
        if (this.enemyHurtT > 0) this.enemyHurtT -= dt;
        if (this.enemyShake > 0) this.enemyShake -= dt;
        if (this.slash > 0) this.slash -= dt;
        if (this.showEnemyHp > 0) this.showEnemyHp -= dt;
        if (this.bubbleT > 0) this.bubbleT -= dt;
        this.spareGlow += dt;
        this.dmgPops = this.dmgPops.filter((p) => { p.t += dt; p.y -= dt * 26; return p.t < 1.2; });

        if (this.delayT > 0) {
          this.delayT -= dt;
          if (this.delayT <= 0) { const f = this.delayFn; this.delayFn = null; if (f) f(); }
          return;
        }

        switch (this.state) {
          case 'text': this.updText(dt); break;
          case 'menu': this.updMenu(dt); break;
          case 'fight': this.updFight(dt); break;
          case 'act': this.updList(dt, this.actItems(), (i) => this.doAct(i)); break;
          case 'item': this.updList(dt, this.itemItems(), (i) => this.doItem(i)); break;
          case 'mercy': this.updList(dt, this.mercyItems(), (i) => this.doMercy(i)); break;
          case 'talk': this.updTalk(dt); break;
          case 'enemyturn': this.updEnemyTurn(dt); break;
          case 'win': this.updWin(dt); break;
        }
      },

      updText(dt) {
        this.dialog.update(dt, UT.game.ctx);
        if (this.dialog.done) {
          this.dialog = null;
          const f = this.afterMsg; this.afterMsg = null;
          if (f) f();
        }
      },

      /* ---------- 메인 메뉴 ---------- */
      updMenu(dt) {
        if (UT.input.pressed('left')) { this.sel = (this.sel + 3) % 4; UT.audio.sfx('blip2'); }
        if (UT.input.pressed('right')) { this.sel = (this.sel + 1) % 4; UT.audio.sfx('blip2'); }
        if (UT.input.pressed('confirm')) {
          UT.audio.sfx('select');
          this.subSel = 0;
          if (this.sel === 0) this.startFight();
          else if (this.sel === 1) this.state = 'act';
          else if (this.sel === 2) this.state = 'item';
          else this.state = 'mercy';
        }
      },

      /* ---------- 공격 ---------- */
      startFight() {
        this.state = 'fight';
        this.fight = {
          x: this.box.x + 12,
          speed: this.night ? 560 : 420,
          hits: this.night ? 3 : 1,
          done: 0,
          total: 0,
          miss: 0
        };
      },

      updFight(dt) {
        const f = this.fight;
        f.x += f.speed * dt;
        const end = this.box.x + this.box.w - 12;
        const fire = () => {
          const center = this.box.x + this.box.w / 2;
          const t = Math.abs(f.x - center) / (this.box.w / 2 - 12);
          let mult = U.clamp(2.15 * (1 - t), 0, 2.15);
          if (mult < 0.15) { f.miss++; mult = 0; }
          const base = UT.game.atkTotal + U.randi(0, 2);
          const raw = mult * base * (this.night ? 0.62 : 1) - e.def * 0.6;
          const dmg = mult <= 0 ? 0 : Math.max(1, Math.round(raw));
          f.total += dmg;
          f.done++;
          if (dmg > 0) UT.audio.sfx('slash');
          if (f.done >= f.hits) this.resolveFight();
          else { f.x = this.box.x + 12; f.speed *= 1.12; }
        };
        if (UT.input.pressed('confirm')) { fire(); return; }
        if (f.x >= end) {
          f.miss++; f.done++;
          if (f.done >= f.hits) this.resolveFight();
          else { f.x = this.box.x + 12; f.speed *= 1.12; }
        }
        if (UT.input.pressed('cancel')) { this.state = 'menu'; }
      },

      resolveFight() {
        const dmg = this.fight.total;
        this.slash = 0.45;
        this.showEnemyHp = 3.5;
        if (dmg <= 0) {
          this.dmgPops.push({ x: 320, y: 150, v: 'MISS', t: 0, color: '#8a8a8a' });
          this.msg(['* 빗나갔다!'], () => this.enemyPhase());
          return;
        }
        e.hp -= dmg;
        this.enemyHurtT = 0.45;
        this.enemyShake = 0.4;
        UT.audio.sfx('hit');
        UT.game.shake(4, 0.2);
        this.dmgPops.push({ x: 320, y: 150, v: String(dmg), t: 0, color: '#ff5a5a' });
        if (e.hp <= 0) {
          e.hp = 0;
          this.killEnemy();
        } else {
          this.state = 'hitpause';
          this.after(0.85, () => this.enemyPhase());
        }
      },

      killEnemy() {
        if (e.final) {
          this.finish('kill_final');
          return;
        }
        UT.audio.sfx('explode');
        UT.game.shake(8, 0.5);
        UT.game.data.kills++;
        UT.game.data.gold += e.gold;
        const before = UT.game.data.lv;
        UT.game.addExp(e.exp);
        const lines = ['* ' + e.name + U.josa(e.name, '을') + ' 쓰러뜨렸다...',
          '* 당신은 승리했다!\n* ' + e.exp + ' EXP와 ' + e.gold + ' 골드를 얻었다.'];
        if (UT.game.data.lv > before) lines.push('* LOVE가 올랐다.');
        this.msg(lines, () => this.finish('kill'));
        this.state = 'text';
        this.deadEnemy = true;
      },

      /* ---------- ACT ---------- */
      actItems() { return e.acts.map((a) => a.name); },

      doAct(i) {
        const a = e.acts[i];
        if (!a) return;
        if (a.check) {
          this.msg(['* ' + e.check], () => this.enemyPhase());
          return;
        }
        let lines = typeof a.text === 'function' ? a.text(e, this) : a.text;
        if (a.run) a.run(e, this);
        this.msg(lines || ['* ...'], () => this.enemyPhase());
      },

      /* ---------- ITEM ---------- */
      itemItems() {
        const inv = UT.game.data.items;
        if (!inv.length) return ['(비어 있음)'];
        return inv.map((id) => UT.items.name(id));
      },

      doItem(i) {
        const inv = UT.game.data.items;
        if (!inv.length) { this.msg(['* 가진 것이 없다.'], () => { this.state = 'menu'; }); return; }
        const txt = UT.items.useAt(i);
        this.msg([txt], () => this.enemyPhase());
      },

      /* ---------- MERCY ---------- */
      mercyItems() {
        const list = ['봐주기'];
        if (!e.boss) list.push('도망');
        return list;
      },

      doMercy(i) {
        if (i === 0) {
          if (e.sparable) {
            UT.audio.sfx('spare');
            UT.game.data.spared++;
            UT.game.data.gold += Math.floor(e.gold * 0.6);
            this.msg([e.spareText || ('* ' + e.name + U.josa(e.name, '을') + ' 봐주었다.'),
              '* 당신은 아무도 해치지 않았다.\n* ' + Math.floor(e.gold * 0.6) + ' 골드를 얻었다.'],
              () => this.finish('spare'));
          } else {
            this.msg(['* ' + e.name + '\n* 아직 마음을 열지 않았다.'], () => this.enemyPhase());
          }
        } else {
          const ok = U.chance(0.55 + this.turn * 0.12);
          if (ok) {
            this.msg(['* 도망쳤다!'], () => this.finish('flee'));
          } else {
            this.msg(['* 도망칠 수 없었다!'], () => this.enemyPhase());
          }
        }
      },

      /* ---------- 리스트 메뉴 공통 ---------- */
      updList(dt, items, onPick) {
        const n = items.length;
        if (UT.input.pressed('left')) { this.subSel = (this.subSel + n - 1) % n; UT.audio.sfx('blip2'); }
        if (UT.input.pressed('right')) { this.subSel = (this.subSel + 1) % n; UT.audio.sfx('blip2'); }
        if (UT.input.pressed('up')) { this.subSel = (this.subSel + n - 2) % n; UT.audio.sfx('blip2'); }
        if (UT.input.pressed('down')) { this.subSel = (this.subSel + 2) % n; UT.audio.sfx('blip2'); }
        if (UT.input.pressed('cancel')) { this.state = 'menu'; UT.audio.sfx('cancel'); }
        if (UT.input.pressed('confirm')) { UT.audio.sfx('select'); onPick(this.subSel); }
      },

      /* ---------- 적 턴 ---------- */
      enemyPhase() {
        if (this.result) return;
        if (e.hp <= 0) return;
        this.turn++;
        e.turn = this.turn;
        if (e.turnLimit && this.turn > e.turnLimit) {
          this.finish(e.endResult || 'story');
          return;
        }
        const line = e.talk && e.talk.length ? e.talk[Math.min(this.turn - 1, e.talk.length - 1)] : null;
        if (line) { this.bubble = line; this.bubbleT = 1.6; }
        this.state = 'talk';
        this.talkT = line ? 1.5 : 0.15;
      },

      updTalk(dt) {
        this.talkT -= dt;
        if (UT.input.pressed('confirm')) this.talkT = Math.min(this.talkT, 0.1);
        if (this.talkT <= 0) this.startPattern();
      },

      startPattern() {
        this.state = 'enemyturn';
        this.endT = 0;
        this.bullets.length = 0;
        this.patternTime = 0;
        this.setBox(this.night ? 380 : 330, this.night ? 158 : 140);
        this.soul.x = 320; this.soul.y = this.box.y + this.box.h / 2;
        const list = e.patterns || [];
        const gen = list.length ? list[(this.turn - 1) % list.length] : null;
        if (gen) { this.pattern = gen(this); this.pattern.next(); }
        else this.pattern = null;
      },

      updEnemyTurn(dt) {
        this.patternTime += dt;

        /* SOUL 이동 */
        const ax = UT.input.axis();
        const spd = (this.night ? 128 : 172) * (UT.input.held('cancel') ? 0.5 : 1);
        let mag = Math.hypot(ax.x, ax.y);
        if (mag > 0) {
          this.soul.x += (ax.x / mag) * spd * dt;
          this.soul.y += (ax.y / mag) * spd * dt;
          this.soul.moveT = 0.09;
        } else if (this.soul.moveT > 0) this.soul.moveT -= dt;
        this.soul.moving = this.soul.moveT > 0;
        const k = this.box, pad = 6;
        this.soul.x = U.clamp(this.soul.x, k.x + pad, k.x + k.w - pad);
        this.soul.y = U.clamp(this.soul.y, k.y + pad, k.y + k.h - pad);

        /* 패턴 진행 */
        let patternDone = false;
        if (this.pattern) {
          const r = this.pattern.next(dt);
          if (r.done) { this.pattern = null; patternDone = true; }
        } else patternDone = true;

        /* 탄환 */
        const margin = 220;
        for (const bl of this.bullets) {
          B.update(bl, dt, this);
          if (bl.x < k.x - margin || bl.x > k.x + k.w + margin ||
              bl.y < k.y - margin || bl.y > k.y + k.h + margin) bl.dead = true;
        }
        /* 충돌 */
        if (this.hurtT <= 0) {
          for (const bl of this.bullets) {
            if (bl.dead || bl.harmless) continue;
            if (!B.hits(bl, this.soul.x, this.soul.y, 4)) continue;
            if (bl.type === 'blue' && !this.soul.moving) continue;
            if (bl.type === 'orange' && this.soul.moving) continue;
            this.hitPlayer(bl.damage);
            break;
          }
        }
        this.bullets = this.bullets.filter((x) => !x.dead);

        /* 패턴이 끝나면 남은 탄이 사라지길 잠깐 기다렸다가 턴 종료 */
        if (patternDone) {
          this.endT = (this.endT || 0) + dt;
          if (this.bullets.length === 0 || this.endT > 1.1) this.endEnemyTurn();
        }
        if (this.patternTime > 18) this.endEnemyTurn();
      },

      hitPlayer(custom) {
        const base = custom != null ? custom : e.atk;
        let dmg = base * U.rand(0.92, 1.14) + this.turn * 0.35;
        dmg -= (UT.game.defTotal - 10) * 0.4;
        dmg -= (this.playerBuff || 0) * 1.6;
        if (this.night) dmg *= 0.75;
        dmg = Math.max(1, Math.round(dmg));
        this.hurtT = 1.15;
        const dead = UT.game.damage(dmg);
        this.dmgPops.push({ x: this.soul.x, y: this.soul.y - 20, v: String(dmg), t: 0, color: '#ff3a3a' });
        if (dead) this.finish('dead');
      },

      endEnemyTurn() {
        if (this.result) return;
        this.bullets.length = 0;
        this.pattern = null;
        this.playerBuff = 0;
        this.state = 'menu';
        this.sel = 0;
      },

      /* ---------- 종료 ---------- */
      finish(outcome) {
        if (this.result) return;
        this.result = outcome;
        UT.game.lastBattle = { outcome, enemy: enemyId, turns: this.turn };
        if (outcome === 'dead') {
          this.state = 'dying';
          UT.audio.stop();
          UT.audio.sfx('hurt');
          this.after(1.3, () => {
            UT.game.pop();
            UT.game.push(UT.scenes.gameover());
          });
          return;
        }
        this.state = 'win';
        this.winT = 0.35;
      },

      updWin(dt) {
        this.winT -= dt;
        if (this.winT <= 0) {
          UT.audio.stop();
          UT.game.pop();
        }
      },

      /* ================= 그리기 ================= */
      draw(ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 640, 480);

        /* 적 */
        if (!this.deadEnemy) this.drawEnemy(ctx);

        /* 박스 */
        const k = this.box;
        U.frame(ctx, k.x, k.y, k.w, k.h, '#ffffff', '#000000', 5);

        if (this.state === 'text' && this.dialog) {
          this.dialog.box = { x: k.x, y: k.y, w: k.w, h: k.h };
          this.dialog.draw(ctx);
        } else if (this.state === 'menu' || this.state === 'fight') {
          this.drawFlavor(ctx);
        } else if (this.state === 'act') {
          this.drawList(ctx, this.actItems(), '* ' + e.name);
        } else if (this.state === 'item') {
          this.drawItems(ctx);
        } else if (this.state === 'mercy') {
          this.drawList(ctx, this.mercyItems(), null, e.sparable);
        }

        /* 공격 바 */
        if (this.state === 'fight') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(this.fight.x - 3, k.y + 8, 6, k.h - 16);
          ctx.fillStyle = '#ff8a2a';
          ctx.fillRect(k.x + k.w / 2 - 1, k.y + 8, 2, k.h - 16);
        }

        /* SOUL */
        if (this.state === 'enemyturn') {
          const blink = this.hurtT > 0 && Math.floor(this.t * 20) % 2 === 0;
          if (!blink) {
            const spr = this.night ? UT.sprites.heart_purple : UT.sprites.heart;
            UT.sprite.draw(ctx, spr, this.soul.x - 8, this.soul.y - 7, { center: false });
          }
          ctx.save();
          ctx.beginPath();
          ctx.rect(k.x + 4, k.y + 4, k.w - 8, k.h - 8);
          ctx.clip();
          for (const bl of this.bullets) B.draw(bl, ctx);
          ctx.restore();
        }

        /* 슬래시 이펙트 */
        if (this.slash > 0) {
          ctx.save();
          ctx.globalAlpha = this.slash / 0.45;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 5;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(280 + i * 22, 90);
            ctx.lineTo(340 + i * 22, 210);
            ctx.stroke();
          }
          ctx.restore();
        }

        this.drawHud(ctx);
        this.drawButtons(ctx);

        /* 데미지 숫자 */
        ctx.save();
        ctx.font = U.font(26, 'bold');
        ctx.textAlign = 'center';
        for (const p of this.dmgPops) {
          ctx.globalAlpha = U.clamp(1.2 - p.t, 0, 1);
          ctx.fillStyle = p.color;
          ctx.fillText(p.v, p.x, p.y);
        }
        ctx.restore();

        /* 죽는 연출 */
        if (this.state === 'dying') {
          ctx.save();
          ctx.globalAlpha = 0.75;
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, 640, 480);
          ctx.restore();
          UT.sprite.draw(ctx, UT.sprites.heart_broken, 320 - 16, 240 - 14, { center: false, scale: 2 });
        }
      },

      drawEnemy(ctx) {
        const spr = UT.sprites[e.sprite];
        if (!spr) return;
        const bob = Math.sin(this.t * 2.2) * 4;
        let x = 320, y = 200 + bob;
        if (this.enemyShake > 0) x += U.rand(-6, 6);
        const flash = this.enemyHurtT > 0 && Math.floor(this.t * 24) % 2 === 0;
        UT.sprite.draw(ctx, spr, x, y, { scale: e.scale || 3, tint: flash ? '#ffffff' : null });

        /* 적 HP 바 */
        if (this.showEnemyHp > 0 || e.boss) {
          const w = 120, hx = x - w / 2, hy = y + 10;
          ctx.fillStyle = '#7a1010';
          ctx.fillRect(hx, hy, w, 8);
          ctx.fillStyle = '#3ad64a';
          ctx.fillRect(hx, hy, w * U.clamp(e.hp / e.maxhp, 0, 1), 8);
        }

        /* 말풍선 */
        if (this.bubbleT > 0 && this.bubble) {
          const bx = 380, by = 60;
          ctx.font = U.font(18);
          const lines = U.wrap(ctx, this.bubble, 200);
          const w = 224, h = lines.length * 24 + 20;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bx, by, w, h);
          ctx.beginPath();
          ctx.moveTo(bx, by + h * 0.5);
          ctx.lineTo(bx - 16, by + h * 0.5 + 12);
          ctx.lineTo(bx, by + h * 0.5 + 22);
          ctx.fill();
          ctx.fillStyle = '#000000';
          lines.forEach((l, i) => ctx.fillText(l, bx + 12, by + 12 + i * 24));
        }
      },

      drawFlavor(ctx) {
        const k = this.box;
        ctx.save();
        ctx.font = U.font(22);
        ctx.fillStyle = '#ffffff';
        let txt;
        if (typeof e.flavor === 'function') txt = e.flavor(e, this);
        else if (e.flavor && e.flavor.length) txt = e.flavor[Math.min(this.turn, e.flavor.length - 1)];
        else txt = '* ' + e.name + '이(가) 앞을 막고 있다.';
        U.wrap(ctx, txt, k.w - 44).forEach((l, i) => ctx.fillText(l, k.x + 22, k.y + 22 + i * 28));
        ctx.restore();
      },

      drawList(ctx, items, header, highlight) {
        const k = this.box;
        ctx.save();
        ctx.font = U.font(22);
        const cols = 2;
        items.forEach((it, i) => {
          const cxp = k.x + 46 + (i % cols) * (k.w / cols);
          const cyp = k.y + 24 + Math.floor(i / cols) * 40;
          const yellow = highlight && i === 0;
          ctx.fillStyle = yellow ? '#ffd44d' : '#ffffff';
          ctx.fillText('* ' + it, cxp, cyp);
          if (i === this.subSel) {
            UT.sprite.draw(ctx, UT.sprites.heart, cxp - 30, cyp + 4, { center: false });
          }
        });
        ctx.restore();
      },

      drawItems(ctx) {
        const inv = UT.game.data.items;
        const k = this.box;
        ctx.save();
        ctx.font = U.font(22);
        const items = this.itemItems();
        items.forEach((it, i) => {
          const cxp = k.x + 46 + (i % 2) * (k.w / 2);
          const cyp = k.y + 20 + Math.floor(i / 2) * 34;
          ctx.fillStyle = '#ffffff';
          ctx.fillText('* ' + it, cxp, cyp);
          if (i === this.subSel) UT.sprite.draw(ctx, UT.sprites.heart, cxp - 30, cyp + 4, { center: false });
        });
        if (inv.length) {
          const id = inv[U.clamp(this.subSel, 0, inv.length - 1)];
          const it = UT.items.get(id);
          if (it) {
            ctx.font = U.font(16);
            ctx.fillStyle = '#a0a0a0';
            ctx.fillText(it.desc || '', k.x + 22, k.y + k.h - 26);
          }
        }
        ctx.restore();
      },

      drawHud(ctx) {
        const d = UT.game.data;
        ctx.save();
        ctx.font = U.font(19);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(d.name, 26, 400);
        ctx.fillText('LV ' + d.lv, 132, 400);
        const bx = 250, bw = Math.max(50, Math.min(150, d.maxhp * 2.4));
        ctx.fillText('HP', bx - 34, 400);
        ctx.fillStyle = '#7a1010';
        ctx.fillRect(bx, 398, bw, 19);
        ctx.fillStyle = this.night ? '#b46bff' : '#ffe14d';
        ctx.fillRect(bx, 398, bw * U.clamp(d.hp / d.maxhp, 0, 1), 19);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(d.hp + ' / ' + d.maxhp, bx + bw + 12, 400);
        if (this.night) {
          ctx.font = U.font(15);
          ctx.fillStyle = '#b46bff';
          ctx.fillText('밤의 형상', 540, 401);
        }
        ctx.restore();
      },

      drawButtons(ctx) {
        ctx.save();
        const w = 140, h = 42, gap = 12, y = 432;
        for (let i = 0; i < 4; i++) {
          const x = 22 + i * (w + gap);
          const active = this.sel === i && (this.state === 'menu' || this.state === 'fight' ||
            this.state === 'act' || this.state === 'item' || this.state === 'mercy');
          const isMercy = i === 3 && e.sparable;
          const col = active ? '#ffe14d' : (isMercy ? '#ffd44d' : BTN_COL[i]);
          U.strokeBox(ctx, x, y, w, h, col, 3);
          ctx.font = U.font(20, 'bold');
          ctx.fillStyle = col;
          ctx.textAlign = 'center';
          ctx.fillText(BTN[i] + '  ' + BTN_KO[i], x + w / 2, y + 12);
          ctx.textAlign = 'left';
          if (active && this.state === 'menu') {
            UT.sprite.draw(ctx, UT.sprites.heart, x + 8, y + h / 2 - 7, { center: false });
          }
        }
        ctx.restore();
      }
    };

    b.baseBox = Object.assign({}, b.box);
    return b;
  }

  UT.scenes = UT.scenes || {};
  UT.scenes.battle = battle;
})(window.UT);
