/* =========================================================
   scenes/gameover.js - 게임 오버
   ========================================================= */
(function (UT) {
  'use strict';
  const U = UT.util;

  const VOICES = [
    ['* 포기하지 마.', '* 너는... 너는 아직 갈 수 있어.'],
    ['* 일어나. 부탁이야.', '* 초콜릿 아직 안 먹었잖아.'],
    ['* 밤은 길어. 하지만 끝은 있어.', '* 일어나.'],
    ['* 내가 옆에 있어.', '* 그러니까 한 번만 더.']
  ];

  function gameover() {
    let t = 0;
    let phase = 0;
    let lines = [];
    let shown = 0;

    return {
      enter() {
        UT.audio.stop();
        UT.audio.sfx('hurt');
        const ch = UT.game.flag('chapter') || 0;
        lines = ['* 당신은 의지로 가득 차 있다.'].concat(
          UT.game.flag('ch1_met_coco') ? U.pick(VOICES) : ['* ...하지만 아직, 부르는 목소리는 없다.']
        );
        UT.game.setFade(0);
      },
      update(dt) {
        t += dt;
        if (phase === 0 && t > 2.2) { phase = 1; UT.audio.play('sad'); }
        if (phase === 1) {
          shown = Math.min(lines.length, Math.floor((t - 2.2) / 1.6) + 1);
          if (t > 2.2 + lines.length * 1.6 + 0.6) phase = 2;
        }
        if (phase === 2 && (UT.input.pressed('confirm') || t > 20)) {
          UT.audio.stop();
          this.continueGame();
        }
      },
      continueGame() {
        const d = UT.game.data;
        if (UT.game.hasSave()) {
          UT.game.load();
          const nd = UT.game.data;
          nd.hp = nd.maxhp;
          UT.game.replace(UT.scenes.overworld());
          UT.world.goto(nd.saveRoom || nd.room, 'default');
          if (nd.savePos) {
            UT.world.player.x = nd.savePos.x;
            UT.world.player.y = nd.savePos.y;
            UT.world.updateCam(true);
          }
        } else {
          d.hp = d.maxhp;
          const room = d.room || 'station_hall';
          const r = UT.maps.get(room);
          if (r && r.onEnter) UT.game.flag('scene_' + r.onEnter + '_done', false);
          UT.game.replace(UT.scenes.overworld());
          UT.world.goto(room, 'default');
        }
        UT.game.setFade(0);
      },
      draw(ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 640, 480);
        const shake = phase === 0 ? U.rand(-1, 1) : 0;
        UT.sprite.draw(ctx, UT.sprites.heart_broken, 320 + shake, 180, { scale: 3, center: true });
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = U.font(22);
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < shown; i++) ctx.fillText(lines[i], 320, 250 + i * 34);
        if (phase === 2) {
          ctx.fillStyle = Math.floor(t * 2) % 2 ? '#ffe14d' : '#8a8a8a';
          ctx.font = U.font(18);
          ctx.fillText('Z — 계속하기', 320, 420);
        }
        ctx.restore();
      }
    };
  }

  UT.scenes = UT.scenes || {};
  UT.scenes.gameover = gameover;
})(window.UT);
