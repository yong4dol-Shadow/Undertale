/* =========================================================
   scenes/title.js - 타이틀 화면
   ========================================================= */
(function (UT) {
  'use strict';
  const U = UT.util;

  function title() {
    let sel = 0;
    let t = 0;
    const items = [];

    return {
      enter() {
        UT.audio.play('title');
        items.length = 0;
        if (UT.game.hasSave()) items.push('이어하기');
        items.push('처음부터');
        if (UT.game.hasSave()) items.push('기록 지우기');
        sel = 0;
        UT.game.setFade(0);
      },
      update(dt) {
        t += dt;
        const n = items.length;
        if (UT.input.pressed('up')) { sel = (sel + n - 1) % n; UT.audio.sfx('blip2'); }
        if (UT.input.pressed('down')) { sel = (sel + 1) % n; UT.audio.sfx('blip2'); }
        if (UT.input.pressed('confirm')) {
          UT.audio.resume();
          UT.audio.sfx('confirm');
          const pick = items[sel];
          if (pick === '이어하기') {
            UT.game.load();
            UT.audio.stop();
            UT.game.replace(UT.scenes.overworld());
            const d = UT.game.data;
            const room = d.saveRoom || d.room;
            UT.world.goto(room, 'default');
            if (d.savePos) {
              UT.world.player.x = d.savePos.x;
              UT.world.player.y = d.savePos.y;
              UT.world.player.dir = d.savePos.dir || 'down';
              UT.world.updateCam(true);
            }
          } else if (pick === '처음부터') {
            UT.game.data = UT.game.freshData();
            UT.game.push(UT.scenes.naming());
          } else {
            UT.game.eraseSave();
            UT.game.toast('기록을 지웠다.');
            this.enter();
          }
        }
      },
      draw(ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 640, 480);

        /* 로고 */
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = U.font(56, 'bold');
        ctx.fillStyle = '#ffffff';
        const logo = 'UNDERTALE';
        let x = 320 - (logo.length - 1) * 17;
        for (let i = 0; i < logo.length; i++) {
          ctx.fillText(logo[i], x + i * 34, 92);
        }
        ctx.font = U.font(24);
        ctx.fillStyle = '#c8c8c8';
        ctx.fillText('갈 라 진   대 지', 320, 168);

        /* 하트 */
        const bob = Math.sin(t * 2) * 4;
        UT.sprite.draw(ctx, UT.sprites.heart, 320, 250 + bob, { scale: 3, center: true });

        /* 메뉴 */
        ctx.font = U.font(24);
        items.forEach((it, i) => {
          const y = 300 + i * 40;
          ctx.fillStyle = i === sel ? '#ffe14d' : '#ffffff';
          ctx.fillText(it, 320, y);
          if (i === sel) UT.sprite.draw(ctx, UT.sprites.heart, 320 - 82, y + 22, { center: false });
        });

        ctx.font = U.font(14);
        ctx.fillStyle = '#5a5a5a';
        ctx.fillText('소닉 언리쉬드의 줄거리를 빌린 언더테일풍 팬 게임', 320, 432);
        ctx.fillText('Z 확인 · X 취소 · C 메뉴 · M 음소거', 320, 452);
        ctx.restore();
      }
    };
  }

  UT.scenes = UT.scenes || {};
  UT.scenes.title = title;
})(window.UT);
