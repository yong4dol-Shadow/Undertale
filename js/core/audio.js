/* =========================================================
   core/audio.js - WebAudio 기반 효과음 & 칩튠 BGM
   외부 파일 없이 전부 합성한다.
   ========================================================= */
(function (UT) {
  'use strict';

  const NOTES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  function freq(note) {
    if (!note || note === '-' || note === '=') return 0;
    const m = /^([A-G])([#b]?)(\d)$/.exec(note);
    if (!m) return 0;
    let n = NOTES[m[1]];
    if (m[2] === '#') n += 1;
    if (m[2] === 'b') n -= 1;
    const oct = parseInt(m[3], 10);
    return 440 * Math.pow(2, (n - 9 + (oct - 4) * 12) / 12);
  }

  const A = {
    ctx: null,
    master: null,
    musicGain: null,
    sfxGain: null,
    muted: false,
    song: null,
    _step: 0,
    _next: 0,
    _timer: null,

    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.32;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.5;
      this.sfxGain.connect(this.master);
    },

    resume() {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },

    toggleMute() {
      this.muted = !this.muted;
      if (this.master) this.master.gain.value = this.muted ? 0 : 0.55;
      return this.muted;
    },

    /* ---------------- 효과음 ---------------- */
    tone(f, dur, type, vol, slideTo, delay) {
      if (!this.ctx || this.muted) return;
      const t0 = this.ctx.currentTime + (delay || 0);
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(f, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.25, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(this.sfxGain);
      o.start(t0); o.stop(t0 + dur + 0.02);
    },

    noise(dur, vol, filterFreq) {
      if (!this.ctx || this.muted) return;
      const t0 = this.ctx.currentTime;
      const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const g = this.ctx.createGain();
      g.gain.value = vol || 0.3;
      if (filterFreq) {
        const f = this.ctx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = filterFreq;
        src.connect(f); f.connect(g);
      } else src.connect(g);
      g.connect(this.sfxGain);
      src.start(t0);
    },

    sfx(name) {
      if (!this.ctx) this.init();
      if (!this.ctx || this.muted) return;
      switch (name) {
        case 'blip':    this.tone(720, 0.045, 'square', 0.10); break;
        case 'blip2':   this.tone(520, 0.045, 'square', 0.09); break;
        case 'select':  this.tone(880, 0.06, 'square', 0.18); break;
        case 'confirm': this.tone(660, 0.07, 'square', 0.2); this.tone(990, 0.09, 'square', 0.16, null, 0.06); break;
        case 'cancel':  this.tone(330, 0.09, 'square', 0.18, 220); break;
        case 'hurt':    this.tone(200, 0.28, 'sawtooth', 0.3, 70); this.noise(0.18, 0.2, 900); break;
        case 'heal':    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.13, 'triangle', 0.18, null, i * 0.06)); break;
        case 'slash':   this.noise(0.16, 0.35, 4000); this.tone(1200, 0.1, 'sawtooth', 0.15, 300); break;
        case 'hit':     this.tone(140, 0.22, 'square', 0.28, 60); this.noise(0.12, 0.22, 700); break;
        case 'explode': this.noise(0.7, 0.45, 500); this.tone(90, 0.6, 'sawtooth', 0.25, 40); break;
        case 'spare':   [659, 784, 988, 1319].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.16, null, i * 0.08)); break;
        case 'save':    [784, 1046, 1318].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.16, null, i * 0.1)); break;
        case 'encounter': this.tone(880, 0.08, 'square', 0.25); this.tone(880, 0.08, 'square', 0.25, null, 0.14); this.tone(1200, 0.3, 'square', 0.25, null, 0.28); break;
        case 'shatter': this.noise(1.2, 0.5, 3000); this.tone(300, 1.2, 'sawtooth', 0.3, 40); break;
        case 'levelup': [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.4, 'square', 0.16, null, i * 0.1)); break;
        case 'transform': this.tone(120, 1.0, 'sawtooth', 0.3, 480); this.noise(1.0, 0.2, 1500); break;
        case 'shine':   [1046, 1318, 1568, 2093].forEach((f, i) => this.tone(f, 0.5, 'sine', 0.12, null, i * 0.07)); break;
        case 'roar':    this.tone(70, 1.4, 'sawtooth', 0.35, 45); this.noise(1.4, 0.3, 400); break;
        case 'step':    this.tone(180, 0.03, 'square', 0.05); break;
      }
    },

    /* ---------------- BGM ---------------- */
    play(name) {
      this.init();
      if (!this.ctx) return;
      if (this.song && this.song.name === name) return;
      this.stop();
      const s = SONGS[name];
      if (!s) return;
      this.song = Object.assign({ name }, s);
      this._step = 0;
      this._next = this.ctx.currentTime + 0.06;
      this._timer = setInterval(() => this._schedule(), 25);
    },

    stop() {
      if (this._timer) clearInterval(this._timer);
      this._timer = null;
      this.song = null;
    },

    _schedule() {
      if (!this.song || !this.ctx) return;
      const spb = 60 / this.song.bpm / 4; // 16분음표 길이
      while (this._next < this.ctx.currentTime + 0.25) {
        this._playStep(this._step, this._next, spb);
        this._step++;
        this._next += spb;
      }
    },

    _playStep(step, time, spb) {
      const s = this.song;
      if (this.muted) return;
      const put = (track, type, vol, octShift) => {
        if (!track) return;
        const n = track[step % track.length];
        if (!n || n === '-' || n === '=') return;
        let f = freq(n);
        if (!f) return;
        if (octShift) f *= Math.pow(2, octShift);
        // 다음 스텝이 '=' 이면 길이 연장
        let len = 1, i = step + 1;
        while (track[i % track.length] === '=' && len < 8) { len++; i++; }
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(f, time);
        const dur = spb * len * 0.92;
        g.gain.setValueAtTime(0.0001, time);
        g.gain.exponentialRampToValueAtTime(vol, time + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
        o.connect(g); g.connect(this.musicGain);
        o.start(time); o.stop(time + dur + 0.02);
      };
      put(s.lead, s.leadWave || 'square', 0.22);
      put(s.harm, s.harmWave || 'triangle', 0.14);
      put(s.bass, s.bassWave || 'triangle', 0.26, -1);
      if (s.drum) {
        const d = s.drum[step % s.drum.length];
        if (d === 'x' || d === 'X') {
          const len = Math.floor(this.ctx.sampleRate * 0.06);
          const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
          const arr = buf.getChannelData(0);
          for (let i = 0; i < len; i++) arr[i] = (Math.random() * 2 - 1) * (1 - i / len);
          const src = this.ctx.createBufferSource(); src.buffer = buf;
          const g = this.ctx.createGain(); g.gain.value = d === 'X' ? 0.22 : 0.1;
          src.connect(g); g.connect(this.musicGain);
          src.start(time);
        }
      }
    }
  };

  /* 곡 정의: 16분음표 격자. '-' 쉼표, '=' 이음줄 */
  const SONGS = {
    title: {
      bpm: 86, leadWave: 'triangle',
      lead: ['A4','=','=','=','C5','=','B4','=','A4','=','=','=','-','-','-','-',
             'G4','=','=','=','A4','=','=','=','E4','=','=','=','-','-','-','-'],
      bass: ['A2','=','-','-','E2','=','-','-','F2','=','-','-','C2','=','-','-']
    },
    town: {
      bpm: 118, leadWave: 'square',
      lead: ['E5','-','G5','-','A5','-','G5','-','E5','-','D5','-','E5','=','=','-',
             'C5','-','E5','-','G5','-','E5','-','D5','-','B4','-','C5','=','=','-'],
      harm: ['C4','-','E4','-','G4','-','E4','-','A3','-','C4','-','E4','-','C4','-'],
      bass: ['C3','-','C3','-','G2','-','G2','-','A2','-','A2','-','F2','-','G2','-'],
      drum: 'x--x--x-x--x-x--'
    },
    night: {
      bpm: 74, leadWave: 'triangle', harmWave: 'sine',
      lead: ['D4','=','=','=','F4','=','=','=','A4','=','=','=','G4','=','=','=',
             'F4','=','=','=','D4','=','=','=','C4','=','=','=','-','-','-','-'],
      bass: ['D2','=','-','-','-','-','-','-','Bb2','=','-','-','-','-','-','-']
    },
    battle: {
      bpm: 148, leadWave: 'square',
      lead: ['C5','-','C5','-','D#5','-','C5','-','G5','-','-','-','F5','-','D#5','-',
             'C5','-','C5','-','D#5','-','F5','-','G5','-','F5','-','D#5','-','C5','-'],
      bass: ['C2','C2','-','C2','C2','-','C2','-','G#1','G#1','-','G#1','A#1','-','A#1','-'],
      drum: 'X-x-X-x-X-x-X-xx'
    },
    boss: {
      bpm: 168, leadWave: 'sawtooth', harmWave: 'square',
      lead: ['A4','-','C5','-','E5','-','A5','-','G5','-','E5','-','C5','-','E5','-',
             'F4','-','A4','-','C5','-','F5','-','E5','-','C5','-','A4','-','C5','-'],
      harm: ['A3','-','-','-','E4','-','-','-','F3','-','-','-','C4','-','-','-'],
      bass: ['A1','A1','A1','-','A1','A1','-','A1','F1','F1','F1','-','F1','F1','-','F1'],
      drum: 'X-xxX-x-X-xxX-xx'
    },
    temple: {
      bpm: 96, leadWave: 'sine', harmWave: 'triangle',
      lead: ['G4','=','=','-','B4','=','=','-','D5','=','=','=','=','-','-','-',
             'C5','=','=','-','B4','=','=','-','G4','=','=','=','=','-','-','-'],
      bass: ['G2','=','=','-','-','-','-','-','C3','=','=','-','-','-','-','-']
    },
    tension: {
      bpm: 132, leadWave: 'sawtooth',
      lead: ['D4','D4','-','D4','-','D4','-','-','D#4','D#4','-','D#4','-','D#4','-','-'],
      bass: ['D1','-','-','-','D1','-','-','-','D#1','-','-','-','D#1','-','-','-'],
      drum: 'x-------x-------'
    },
    hope: {
      bpm: 104, leadWave: 'triangle', harmWave: 'sine',
      lead: ['C5','=','E5','=','G5','=','=','=','F5','=','E5','=','D5','=','=','=',
             'E5','=','G5','=','C6','=','=','=','B5','=','G5','=','E5','=','=','='],
      harm: ['E4','-','G4','-','C5','-','G4','-','D4','-','F4','-','A4','-','F4','-'],
      bass: ['C3','-','-','-','G2','-','-','-','A2','-','-','-','F2','-','-','-']
    },
    sad: {
      bpm: 66, leadWave: 'sine', harmWave: 'triangle',
      lead: ['A4','=','=','=','G4','=','=','=','E4','=','=','=','=','=','-','-',
             'F4','=','=','=','E4','=','=','=','D4','=','=','=','=','=','-','-'],
      bass: ['A2','=','=','-','-','-','-','-','F2','=','=','-','-','-','-','-']
    },
    final: {
      bpm: 176, leadWave: 'sawtooth', harmWave: 'square',
      lead: ['E5','-','E5','-','G5','-','E5','-','B5','-','A5','-','G5','-','E5','-',
             'D5','-','D5','-','F5','-','D5','-','A5','-','G5','-','F5','-','D5','-'],
      harm: ['E4','-','-','-','B4','-','-','-','D4','-','-','-','A4','-','-','-'],
      bass: ['E1','E1','-','E1','E1','-','E1','-','D1','D1','-','D1','D1','-','D1','-'],
      drum: 'X-xxX-xxX-xxX-xx'
    }
  };

  A.SONGS = SONGS;
  UT.audio = A;
})(window.UT);
