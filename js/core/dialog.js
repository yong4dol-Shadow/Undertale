/* =========================================================
   core/dialog.js - 언더테일식 타자기 대화 상자
   ========================================================= */
(function (UT) {
  'use strict';

  const U = UT.util;

  const DEFAULT_BOX = { x: 32, y: 318, w: 576, h: 142 };

  function create(pages, opts) {
    opts = opts || {};
    if (typeof pages === 'string') pages = [{ text: pages }];
    pages = pages.map((p) => (typeof p === 'string' ? { text: p } : p));

    const d = {
      pages,
      idx: 0,
      chars: 0,
      timer: 0,
      done: false,
      result: null,
      choiceIdx: 0,
      box: opts.box || DEFAULT_BOX,
      lines: [],
      opts,

      get page() { return this.pages[this.idx] || { text: '' }; },
      get typing() { return this.chars < this.plainLength; },

      layout(ctx) {
        const p = this.page;
        ctx.font = U.font(p.size || 24);
        const inset = 22;
        const faceW = p.face ? 96 : 0;
        this.lines = U.wrap(ctx, p.text || '', this.box.w - inset * 2 - faceW);
        this.plainLength = this.lines.join('').length;
      },

      finishTyping() { this.chars = this.plainLength; },

      update(dt, ctx) {
        if (this.done) return;
        if (!this.lines.length || this._laidOut !== this.idx) {
          if (ctx) { this.layout(ctx); this._laidOut = this.idx; }
        }
        const p = this.page;
        const speed = p.speed || this.opts.speed || 34; // 초당 글자 수
        if (this.chars < this.plainLength) {
          this.timer += dt;
          const per = 1 / speed;
          while (this.timer >= per && this.chars < this.plainLength) {
            this.timer -= per;
            this.chars++;
            const ch = this.charAt(this.chars - 1);
            if (ch && ch !== ' ' && this.chars % 2 === 0) {
              UT.audio.sfx(p.sound === null ? null : (p.sound || 'blip'));
            }
          }
          if (UT.input.pressed('confirm') || UT.input.pressed('cancel')) this.finishTyping();
          return;
        }
        // 타이핑 완료
        if (p.choices) {
          const n = p.choices.length;
          if (UT.input.pressed('left') || UT.input.pressed('up')) {
            this.choiceIdx = (this.choiceIdx + n - 1) % n; UT.audio.sfx('blip2');
          }
          if (UT.input.pressed('right') || UT.input.pressed('down')) {
            this.choiceIdx = (this.choiceIdx + 1) % n; UT.audio.sfx('blip2');
          }
          if (UT.input.pressed('confirm')) {
            this.result = this.choiceIdx;
            UT.audio.sfx('confirm');
            this.advance();
          }
          return;
        }
        if (p.auto != null) {
          this.timer += dt;
          if (this.timer > p.auto) this.advance();
          return;
        }
        if (UT.input.pressed('confirm')) {
          UT.audio.sfx('blip2');
          this.advance();
        }
      },

      advance() {
        this.idx++;
        this.chars = 0;
        this.timer = 0;
        this.lines = [];
        this.choiceIdx = 0;
        if (this.idx >= this.pages.length) {
          this.done = true;
          if (this.opts.onDone) this.opts.onDone(this);
        }
      },

      charAt(i) {
        let n = 0;
        for (const line of this.lines) {
          if (i < n + line.length) return line[i - n];
          n += line.length;
        }
        return '';
      },

      draw(ctx) {
        if (this.done) return;
        const p = this.page;
        const b = this.box;
        if (p.noFrame !== true) U.frame(ctx, b.x, b.y, b.w, b.h, p.border || '#ffffff', '#000000', 5);
        ctx.save();
        ctx.font = U.font(p.size || 24);
        ctx.textBaseline = 'top';
        ctx.fillStyle = p.color || '#ffffff';
        const inset = 22;
        let tx = b.x + inset;
        const ty = b.y + inset;
        if (p.face) {
          const spr = UT.sprites[p.face];
          if (spr) UT.sprite.draw(ctx, spr, b.x + 18, b.y + b.h / 2 - spr.h * 3 / 2, { scale: 3, center: false });
          tx += 96;
        }
        const lh = (p.size || 24) + 8;
        let left = this.chars;
        for (let i = 0; i < this.lines.length; i++) {
          const full = this.lines[i];
          if (left <= 0) break;
          const shown = full.slice(0, left);
          left -= full.length;
          ctx.fillText(shown, tx, ty + i * lh);
        }
        // 선택지
        if (p.choices && !this.typing) {
          const cy = ty + this.lines.length * lh + 14;
          const gap = p.choiceGap || 220;
          p.choices.forEach((c, i) => {
            const cx = tx + 40 + i * gap;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(c, cx, cy);
            if (i === this.choiceIdx) {
              UT.sprite.draw(ctx, UT.sprites.heart, cx - 30, cy + 4, { scale: 2, center: false });
            }
          });
        }
        // 다음 페이지 화살표
        if (!this.typing && !p.choices && p.auto == null) {
          const t = UT.game.time * 6;
          if (Math.sin(t) > 0) {
            ctx.fillStyle = '#ffffff';
            const ax = b.x + b.w - 34, ay = b.y + b.h - 30;
            ctx.beginPath();
            ctx.moveTo(ax, ay); ctx.lineTo(ax + 14, ay); ctx.lineTo(ax + 7, ay + 10);
            ctx.fill();
          }
        }
        ctx.restore();
      }
    };
    return d;
  }

  UT.dialog = { create, DEFAULT_BOX };
})(window.UT);
