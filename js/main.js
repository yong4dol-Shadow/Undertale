/* =========================================================
   main.js - 부트스트랩
   ========================================================= */
(function (UT) {
  'use strict';

  function boot() {
    const canvas = document.getElementById('screen');
    UT.input.init();
    UT.game.init(canvas);
    UT.game.push(UT.scenes.title());

    /* 첫 입력에 오디오 컨텍스트 해제 */
    const unlock = () => {
      UT.audio.resume();
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('pointerdown', unlock);
    };
    window.addEventListener('keydown', unlock);
    window.addEventListener('pointerdown', unlock);

    /* 조작 안내는 잠시 뒤 흐려진다 */
    const hint = document.getElementById('hint');
    if (hint) setTimeout(() => hint.classList.add('away'), 9000);

    window.UT_DEBUG = {
      goto: (r, s) => { UT.game.replace(UT.scenes.overworld()); UT.world.goto(r, s || 'default'); },
      battle: (id) => UT.game.push(UT.scenes.battle(id)),
      flag: (k, v) => UT.game.flag(k, v),
      data: () => UT.game.data
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.UT);
