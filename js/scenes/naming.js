/* =========================================================
   scenes/naming.js - 이름 입력 (한글 IME 지원용 오버레이 입력)
   ========================================================= */
(function (UT) {
  'use strict';
  const U = UT.util;

  const SPECIAL = {
    '코코': ['* 그 이름은 안 돼.'],
    '초코': ['* 그 이름도 안 돼.'],
    '오보이드': ['* ...진심이야?', '* 그럼 마음대로 해.'],
    '녹스': ['* 그건 이미 임자가 있다.'],
    '룩스': ['* 그건 이미 임자가 있다.'],
    '프리스크': ['* ...아는 이름이네.'],
    '샌즈': ['* 그 사람은 다른 게임에 있어.'],
    '소닉': ['* 그 사람도 다른 게임에 있어.', '* 이야기만 빌렸을 뿐이야.']
  };

  function naming() {
    let input = null;
    let stage = 'type';   // type | confirm
    let msg = null;
    let t = 0;

    function value() {
      let v = (input && input.value ? input.value : '').trim().slice(0, 6);
      return v;
    }

    return {
      enter() {
        UT.audio.play('sad');
        input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 6;
        input.autocomplete = 'off';
        input.style.cssText =
          'position:fixed;left:50%;top:52%;transform:translate(-50%,-50%);' +
          'width:220px;height:36px;opacity:0.01;font-size:16px;z-index:5;border:0;';
        document.body.appendChild(input);
        setTimeout(() => input && input.focus(), 30);
        input.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') { ev.preventDefault(); this._submit(); }
        });
      },
      exit() {
        if (input && input.parentNode) input.parentNode.removeChild(input);
        input = null;
      },
      _submit() {
        const v = value();
        if (!v.length) return;
        UT.audio.sfx('confirm');
        if (stage === 'type') {
          msg = SPECIAL[v] || null;
          stage = 'confirm';
        }
      },
      update(dt) {
        t += dt;
        if (stage === 'type') {
          if (input && document.activeElement !== input) input.focus();
          if (UT.input.pressed('confirm') && !input) this._submit();
        } else {
          if (UT.input.pressed('confirm')) {
            UT.audio.sfx('confirm');
            const d = UT.game.data;
            d.name = value() || '프리스크';
            UT.audio.stop();
            UT.game.replace(UT.scenes.overworld());
            UT.world.goto('station_hall', 'default');
          }
          if (UT.input.pressed('cancel')) {
            UT.audio.sfx('cancel');
            stage = 'type';
            msg = null;
            if (input) input.focus();
          }
        }
      },
      draw(ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 640, 480);
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = U.font(24);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('이 아이의 이름을 정해 주세요.', 320, 110);

        const v = value();
        ctx.font = U.font(40, 'bold');
        ctx.fillStyle = '#ffffff';
        const shown = v.length ? v : '';
        ctx.fillText(shown, 320, 200);
        /* 커서 */
        if (stage === 'type' && Math.floor(t * 2) % 2 === 0) {
          const w = ctx.measureText(shown).width;
          ctx.fillRect(320 + w / 2 + 6, 200, 18, 40);
        }
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 2;
        ctx.strokeRect(200, 190, 240, 60);

        ctx.font = U.font(18);
        ctx.fillStyle = '#a0a0a0';
        if (stage === 'type') {
          ctx.fillText('키보드로 입력하고 Enter (최대 6글자)', 320, 300);
        } else {
          ctx.fillStyle = '#ffffff';
          if (msg) msg.forEach((m, i) => ctx.fillText(m, 320, 292 + i * 28));
          else ctx.fillText('* “' + v + '“ 이(가) 맞나요?', 320, 300);
          ctx.fillStyle = '#ffe14d';
          ctx.fillText('Z 확인      X 다시 쓰기', 320, 372);
        }
        ctx.restore();
      }
    };
  }

  UT.scenes = UT.scenes || {};
  UT.scenes.naming = naming;
})(window.UT);
