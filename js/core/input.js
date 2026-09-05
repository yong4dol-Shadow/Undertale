/* =========================================================
   core/input.js - 키보드 / 터치 입력
   ========================================================= */
(function (UT) {
  'use strict';

  const MAP = {
    left:    ['ArrowLeft', 'KeyA'],
    right:   ['ArrowRight', 'KeyD'],
    up:      ['ArrowUp', 'KeyW'],
    down:    ['ArrowDown', 'KeyS'],
    confirm: ['KeyZ', 'Enter', 'Space'],
    cancel:  ['KeyX', 'ShiftLeft', 'ShiftRight', 'Backspace'],
    menu:    ['KeyC', 'ControlLeft', 'ControlRight'],
    mute:    ['KeyM'],
    full:    ['KeyF'],
    debug:   ['Backquote']
  };

  const I = {
    _down: Object.create(null),
    _pressed: Object.create(null),
    _released: Object.create(null),
    anyPressed: false,
    lastChar: '',

    init() {
      window.addEventListener('keydown', (e) => {
        // 게임이 쓰는 키의 기본 동작(스크롤 등)만 차단
        if (this._used(e.code)) e.preventDefault();
        if (e.repeat) return;
        this._down[e.code] = true;
        this._pressed[e.code] = true;
        this.anyPressed = true;
        if (e.key && e.key.length === 1) this.lastChar = e.key;
      });
      window.addEventListener('keyup', (e) => {
        this._down[e.code] = false;
        this._released[e.code] = true;
      });
      window.addEventListener('blur', () => { this._down = Object.create(null); });
      this._initTouch();
    },

    _used(code) {
      for (const k in MAP) if (MAP[k].indexOf(code) >= 0) return true;
      return false;
    },

    held(name) {
      const codes = MAP[name];
      if (!codes) return false;
      for (const c of codes) if (this._down[c]) return true;
      return false;
    },

    pressed(name) {
      const codes = MAP[name];
      if (!codes) return false;
      for (const c of codes) if (this._pressed[c]) return true;
      return false;
    },

    released(name) {
      const codes = MAP[name];
      if (!codes) return false;
      for (const c of codes) if (this._released[c]) return true;
      return false;
    },

    /** 방향 입력 벡터 (-1..1) */
    axis() {
      let x = 0, y = 0;
      if (this.held('left')) x -= 1;
      if (this.held('right')) x += 1;
      if (this.held('up')) y -= 1;
      if (this.held('down')) y += 1;
      return { x, y };
    },

    /** 프레임 종료 시 호출 */
    postUpdate() {
      this._pressed = Object.create(null);
      this._released = Object.create(null);
      this.anyPressed = false;
      this.lastChar = '';
    },

    /** 가상 입력(터치 패드) */
    press(name) {
      const c = MAP[name] && MAP[name][0];
      if (c) { this._down[c] = true; this._pressed[c] = true; this.anyPressed = true; }
    },
    release(name) {
      const c = MAP[name] && MAP[name][0];
      if (c) { this._down[c] = false; this._released[c] = true; }
    },

    /* 모바일: 화면 절반 스와이프 + 탭 */
    _initTouch() {
      const el = document.body;
      let touchId = null, sx = 0, sy = 0, cur = null;
      const dirOf = (dx, dy) => {
        if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return null;
        return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      };
      el.addEventListener('touchstart', (e) => {
        const t = e.changedTouches[0];
        if (t.clientX > window.innerWidth * 0.62) {
          // 오른쪽 영역 = 확인 / 취소
          if (t.clientY > window.innerHeight * 0.6) this.press('cancel');
          else this.press('confirm');
          setTimeout(() => { this.release('confirm'); this.release('cancel'); }, 90);
          return;
        }
        touchId = t.identifier; sx = t.clientX; sy = t.clientY;
      }, { passive: true });
      el.addEventListener('touchmove', (e) => {
        for (const t of e.changedTouches) {
          if (t.identifier !== touchId) continue;
          const d = dirOf(t.clientX - sx, t.clientY - sy);
          if (d !== cur) { if (cur) this.release(cur); cur = d; if (cur) this.press(cur); }
        }
      }, { passive: true });
      const end = (e) => {
        for (const t of e.changedTouches) {
          if (t.identifier !== touchId) continue;
          if (cur) this.release(cur);
          cur = null; touchId = null;
        }
      };
      el.addEventListener('touchend', end, { passive: true });
      el.addEventListener('touchcancel', end, { passive: true });
    }
  };

  UT.input = I;
})(window.UT);
