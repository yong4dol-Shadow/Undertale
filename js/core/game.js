/* =========================================================
   core/game.js - 게임 루프 / 씬 스택 / 세이브 / 연출 감독
   ========================================================= */
(function (UT) {
  'use strict';

  const U = UT.util;
  const SAVE_KEY = 'undertale_gaia_save_v1';

  /* ---------- 레벨 테이블 ---------- */
  const EXP_TABLE = [0, 10, 30, 70, 120, 200, 300, 500, 800, 1200, 1700, 2500, 3500];
  const HP_TABLE  = [0, 20, 24, 28, 32, 36, 40, 46, 52, 58, 64, 72, 80, 92];

  const game = {
    W: 640, H: 480,
    canvas: null, ctx: null,
    scenes: [],
    time: 0,
    frame: 0,
    running: false,

    /* 화면 연출 */
    fadeAlpha: 0, fadeTarget: 0, fadeSpeed: 2, fadeColor: '#000000',
    shakeAmp: 0, shakeTime: 0,
    flashAlpha: 0, flashColor: '#ffffff',

    data: null,

    /* ---------------- 초기화 ---------------- */
    init(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.textBaseline = 'top';
      this.data = this.freshData();
      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.running = true;
      let last = performance.now();
      const loop = (ts) => {
        const dt = Math.min(0.05, (ts - last) / 1000);
        last = ts;
        this.step(dt);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    },

    resize() {
      const pad = 24;
      const sw = window.innerWidth - pad, sh = window.innerHeight - pad;
      let scale = Math.min(sw / this.W, sh / this.H);
      if (scale > 1) scale = Math.max(1, Math.floor(scale * 2) / 2);
      this.canvas.style.width = Math.floor(this.W * scale) + 'px';
      this.canvas.style.height = Math.floor(this.H * scale) + 'px';
    },

    freshData() {
      return {
        name: '프리스크',
        lv: 1, hp: 20, maxhp: 20, exp: 0, gold: 0,
        atk: 10, def: 10,
        weapon: 'sneakers', armor: 'scarf',
        items: ['choco', 'choco', 'choco'],
        flags: {},
        chapter: 0,
        room: 'station_hall', x: 320, y: 300, dir: 'down',
        form: 'day',
        kills: 0, spared: 0, steps: 0, playtime: 0, saveRoom: null, savePos: null
      };
    },

    /* ---------------- 씬 스택 ---------------- */
    push(scene) {
      const cur = this.top();
      if (cur && cur.pause) cur.pause();
      this.scenes.push(scene);
      if (scene.enter) scene.enter();
      return scene;
    },
    pop() {
      const s = this.scenes.pop();
      if (s && s.exit) s.exit();
      const cur = this.top();
      if (cur && cur.resume) cur.resume();
      return s;
    },
    replace(scene) {
      while (this.scenes.length) { const s = this.scenes.pop(); if (s && s.exit) s.exit(); }
      return this.push(scene);
    },
    top() { return this.scenes[this.scenes.length - 1]; },

    /* ---------------- 프레임 ---------------- */
    step(dt) {
      this.time += dt;
      this.frame++;
      if (this.data) this.data.playtime += dt;

      /* 전역 키 */
      if (UT.input.pressed('mute')) {
        const m = UT.audio.toggleMute();
        this.toast(m ? '음소거' : '소리 켜짐');
      }
      if (UT.input.pressed('full')) this.toggleFullscreen();

      /* 페이드 / 흔들림 */
      this.fadeAlpha = U.approach(this.fadeAlpha, this.fadeTarget, this.fadeSpeed * dt);
      if (this.shakeTime > 0) this.shakeTime -= dt; else this.shakeAmp = 0;
      if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.2);
      if (this._toastT > 0) this._toastT -= dt;

      const scene = this.top();
      if (scene && scene.update) scene.update(dt);

      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, this.W, this.H);
      if (this.shakeAmp > 0) {
        ctx.translate(U.rand(-this.shakeAmp, this.shakeAmp), U.rand(-this.shakeAmp, this.shakeAmp));
      }
      /* 아래 씬도 그려야 하는 경우 */
      const start = Math.max(0, this.scenes.length - 1 - (scene && scene.drawBelow ? 1 : 0));
      for (let i = start; i < this.scenes.length; i++) {
        const s = this.scenes[i];
        if (s.draw) s.draw(ctx);
      }
      ctx.restore();

      if (this.flashAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = this.flashAlpha;
        ctx.fillStyle = this.flashColor;
        ctx.fillRect(0, 0, this.W, this.H);
        ctx.restore();
      }
      if (this.fadeAlpha > 0.001) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, this.fadeAlpha);
        ctx.fillStyle = this.fadeColor;
        ctx.fillRect(0, 0, this.W, this.H);
        ctx.restore();
      }
      if (this._toastT > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, this._toastT);
        ctx.font = U.font(18);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'right';
        ctx.fillText(this._toast, this.W - 12, 10);
        ctx.restore();
      }

      UT.input.postUpdate();
    },

    toast(msg) { this._toast = msg; this._toastT = 1.6; },

    toggleFullscreen() {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) document.exitFullscreen();
    },

    /* ---------------- 연출 ---------------- */
    fadeTo(target, dur, color) {
      this.fadeTarget = target;
      this.fadeSpeed = dur ? Math.abs(target - this.fadeAlpha) / dur : 999;
      if (color) this.fadeColor = color;
    },
    setFade(a, color) { this.fadeAlpha = this.fadeTarget = a; if (color) this.fadeColor = color; },
    shake(amp, dur) { this.shakeAmp = amp; this.shakeTime = dur; },
    flash(color, a) { this.flashColor = color || '#ffffff'; this.flashAlpha = a == null ? 1 : a; },

    /* ---------------- 플레이어 스탯 ---------------- */
    get flags() { return this.data.flags; },
    flag(k, v) {
      if (v === undefined) return this.data.flags[k];
      this.data.flags[k] = v;
      return v;
    },

    heal(n) {
      const d = this.data;
      d.hp = Math.min(d.maxhp, d.hp + n);
      UT.audio.sfx('heal');
    },

    damage(n) {
      const d = this.data;
      d.hp = Math.max(0, d.hp - n);
      UT.audio.sfx('hurt');
      this.shake(6, 0.25);
      return d.hp <= 0;
    },

    addExp(n) {
      const d = this.data;
      d.exp += n;
      let leveled = false;
      while (d.lv < EXP_TABLE.length - 1 && d.exp >= EXP_TABLE[d.lv]) {
        d.lv++;
        leveled = true;
      }
      if (leveled) {
        const nm = HP_TABLE[Math.min(d.lv, HP_TABLE.length - 1)];
        const gain = nm - d.maxhp;
        d.maxhp = nm;
        d.hp = Math.min(d.maxhp, d.hp + Math.max(0, gain));
        d.atk = 10 + (d.lv - 1) * 2;
        d.def = 10 + Math.floor((d.lv - 1) / 2);
        UT.audio.sfx('levelup');
      }
      return leveled;
    },

    expToNext() {
      const d = this.data;
      if (d.lv >= EXP_TABLE.length - 1) return 0;
      return Math.max(0, EXP_TABLE[d.lv] - d.exp);
    },

    get atkTotal() {
      const w = UT.items.get(this.data.weapon);
      let a = this.data.atk + (w ? w.atk : 0);
      if (this.data.form === 'night') a += 4;
      return a;
    },
    get defTotal() {
      const a = UT.items.get(this.data.armor);
      let d = this.data.def + (a ? a.def : 0);
      if (this.data.form === 'night') d += 3;
      return d;
    },

    /* ---------------- 세이브 ---------------- */
    save() {
      try {
        const d = JSON.parse(JSON.stringify(this.data));
        localStorage.setItem(SAVE_KEY, JSON.stringify(d));
        return true;
      } catch (e) { return false; }
    },
    hasSave() {
      try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
    },
    load() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        const d = JSON.parse(raw);
        this.data = Object.assign(this.freshData(), d);
        return true;
      } catch (e) { return false; }
    },
    eraseSave() {
      try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    }
  };

  /* =========================================================
     연출 감독 : 제너레이터 컷신 실행기
     ========================================================= */
  const director = {
    gen: null,
    dialog: null,
    lastResult: null,
    ctx: null,
    get busy() { return !!this.gen || !!this.dialog; },

    run(genFn, sceneCtx) {
      this.ctx = sceneCtx || null;
      this.gen = genFn(sceneCtx);
      this.gen.next();   // 첫 yield 까지 진행
    },

    cancel() { this.gen = null; this.dialog = null; },

    update(dt) {
      if (this.dialog) {
        this.dialog.update(dt, UT.game.ctx);
        if (this.dialog.done) {
          this.lastResult = this.dialog.result;
          this.dialog = null;
        }
        return true;
      }
      if (!this.gen) return false;
      const r = this.gen.next(dt);
      if (r.done) this.gen = null;
      return true;
    },

    draw(ctx) {
      if (this.dialog) this.dialog.draw(ctx);
    }
  };

  /* =========================================================
     스크립트 헬퍼 ( yield* 로 사용 )
     ========================================================= */
  const S = {
    /** 대사 출력. 문자열 여러 개 또는 페이지 객체 */
    *say() {
      const pages = Array.prototype.slice.call(arguments);
      director.dialog = UT.dialog.create(pages);
      director.lastResult = null;
      while (director.dialog) yield;
      return director.lastResult;
    },
    /** 얼굴 붙은 대사 */
    *talk(face, ...lines) {
      return yield* S.say.apply(null, lines.map((t) => ({ text: t, face })));
    },
    *choice(text, options, face) {
      director.dialog = UT.dialog.create([{ text, choices: options, face }]);
      director.lastResult = null;
      while (director.dialog) yield;
      return director.lastResult;
    },
    *wait(sec) { yield* U.wait(sec); },
    *until(fn) { yield* U.until(fn); },
    *fadeOut(sec, color) {
      UT.game.fadeTo(1, sec || 0.6, color);
      yield* U.until(() => UT.game.fadeAlpha >= 0.999);
    },
    *fadeIn(sec, color) {
      UT.game.fadeTo(0, sec || 0.6, color);
      yield* U.until(() => UT.game.fadeAlpha <= 0.001);
    },
    *shake(amp, sec) { UT.game.shake(amp, sec); yield* U.wait(sec); },
    *sfx(n) { UT.audio.sfx(n); yield; },
    *music(n) { if (n) UT.audio.play(n); else UT.audio.stop(); yield; },
    *battle(id, opts) {
      UT.game.push(UT.scenes.battle(id, opts));
      yield;                                   // 전투 씬으로 제어가 넘어감
      return UT.game.lastBattle;
    }
  };

  UT.game = game;
  UT.director = director;
  UT.S = S;
  UT.EXP_TABLE = EXP_TABLE;
  UT.HP_TABLE = HP_TABLE;
})(window.UT);
