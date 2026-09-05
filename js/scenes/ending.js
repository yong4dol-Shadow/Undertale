/* =========================================================
   scenes/ending.js - 엔딩 (재움 / 파괴 두 분기) + 크레딧
   ========================================================= */
(function (UT) {
  'use strict';
  const U = UT.util;

  const TRUE_END = [
    '* 녹스가 가라앉는다.',
    '* 죽은 것이 아니다. 잠든 것이다.',
    '* 균열이 아물듯 닫히고, 일곱 조각이 서로를 찾아 붙는다.',
    '* 그리고 아침이 왔다.',
    '* 오랜만에, 아주 평범한 아침이.',
    { text: '“해가 떴네.“', face: 'lux' },
    { text: '“나 이제 돌아가야 해.“', face: 'lux' },
    '* 룩스의 몸이 조금씩 옅어진다.',
    { text: '“밤이 자는 동안, 낮도 같이 자야 하거든.“', face: 'coco' },
    { text: '“그게 이 행성이 굴러가는 방법이야.“', face: 'coco' },
    '* 당신은 손을 뻗었다.',
    '* 잡히지 않았다.',
    { text: '“울지 마. 나 안 없어져.“', face: 'coco' },
    { text: '“땅 밑에 있을 거야. 네가 밟고 서 있는 데.“', face: 'coco' },
    { text: '“...초콜릿, 다음에 꼭 같이 먹자.“', face: 'coco' },
    '* 손바닥에 파란 펜던트가 남았다.',
    '* 아직 미지근하다.',
    '* 그날 밤, 당신은 변하지 않았다.',
    '* 다음 날 밤도, 그 다음 날 밤도.',
    '* 밤은 그냥 밤이었다. 조용하고, 별이 많은.'
  ];

  const KILL_END = [
    '* 녹스가 부서진다.',
    '* 비명 대신, 아주 긴 숨소리가 났다.',
    '* 균열이 닫히고, 일곱 조각이 제자리를 찾았다.',
    '* 그리고 아침이 왔다.',
    '* ...그 뒤로도 계속 아침이었다.',
    { text: '“...밤이 안 와.“', face: 'lux' },
    { text: '“밤이 없으면 낮도 쉴 수가 없는데.“', face: 'lux' },
    '* 룩스의 빛이 흔들린다. 반쪽만 남은 것처럼.',
    { text: '“괜찮아. 네 잘못 아니야.“', face: 'coco' },
    { text: '“나도 저 아래에 조금 있었거든. 밤 쪽에.“', face: 'coco' },
    '* 코코의 형체가 옅어진다.',
    { text: '“초콜릿은... 다음 생에 먹자.“', face: 'coco' },
    '* 손바닥에 파란 펜던트가 남았다.',
    '* 차갑다.',
    '* 세상은 구해졌다. 절반쯤.'
  ];

  function ending(kind) {
    let phase = 'text';
    let dlg = null;
    let scroll = 0;
    let t = 0;

    const credits = [
      'UNDERTALE : 갈라진 대지',
      '',
      '이야기 구조 원안',
      'Sonic Unleashed (2008)',
      '— 갈라진 행성 · 밤의 형상 · 빛의 동행자 —',
      '',
      '형식 · 화법 · 전투',
      'UNDERTALE (2015) 헌정',
      '',
      '이 게임은 두 작품에 대한 애정으로 만든',
      '비상업 팬 게임입니다.',
      '',
      '', '',
      '등장',
      UT.game.data.name + '  ...  당신',
      (UT.game.flag('coco_name') || '코코') + '  ...  빛의 조각',
      '닥터 오보이드  ...  계획이 있는 사람',
      '바질 박사  ...  파이를 굽는 사람',
      '녹스  ...  잠들어야 했던 것',
      '',
      '', '',
      '기록',
      'LV ' + UT.game.data.lv,
      '쓰러뜨린 수 ' + UT.game.data.kills,
      '봐준 수 ' + UT.game.data.spared,
      '되돌린 조각 ' + (UT.game.flag('shards') || 0) + ' / 7',
      '플레이 시간 ' + Math.floor(UT.game.data.playtime / 60) + '분',
      '',
      '', '',
      kind === 'true'
        ? '* 밤이 오면, 발밑이 조금 따뜻하다.'
        : '* 밤이 오지 않는 세상에서, 당신은 자주 아래를 본다.',
      '',
      '', '', '',
      'THE END',
      '',
      '', '',
      'Z — 타이틀로'
    ];

    return {
      enter() {
        UT.audio.play(kind === 'true' ? 'hope' : 'sad');
        UT.game.setFade(0);
        const pages = (kind === 'true' ? TRUE_END : KILL_END).map((p) =>
          typeof p === 'string' ? { text: p } : p);
        dlg = UT.dialog.create(pages, {
          box: { x: 40, y: 300, w: 560, h: 150 },
          onDone: () => { phase = 'credits'; UT.audio.play(kind === 'true' ? 'hope' : 'sad'); }
        });
        UT.game.flag('ending', kind);
        UT.game.save();
      },
      update(dt) {
        t += dt;
        if (phase === 'text') {
          dlg.update(dt, UT.game.ctx);
        } else {
          scroll += dt * 34;
          const total = credits.length * 34 + 480;
          if (scroll > total - 200 && UT.input.pressed('confirm')) {
            UT.audio.stop();
            UT.game.replace(UT.scenes.title());
          }
          if (scroll > total + 260) {
            UT.audio.stop();
            UT.game.replace(UT.scenes.title());
          }
        }
      },
      draw(ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 640, 480);
        if (phase === 'text') {
          /* 배경: 떠오르는 빛 */
          ctx.save();
          for (let i = 0; i < 40; i++) {
            const y = (480 - ((t * 22 + i * 47) % 520));
            const x = (i * 97) % 640;
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = kind === 'true' ? '#ffe9a8' : '#6a6a8a';
            ctx.fillRect(x, y, 3, 3);
          }
          ctx.restore();
          const spr = kind === 'true' ? UT.sprites.lux : UT.sprites.coco_sad;
          UT.sprite.draw(ctx, spr, 320, 250, { scale: 5, center: true, alpha: 0.92 });
          dlg.draw(ctx);
        } else {
          ctx.save();
          ctx.textAlign = 'center';
          credits.forEach((line, i) => {
            const y = 480 + i * 34 - scroll;
            if (y < -40 || y > 500) return;
            const big = i === 0 || line === 'THE END';
            ctx.font = U.font(big ? 30 : 19, big ? 'bold' : '');
            ctx.fillStyle = big ? '#ffffff' : '#c0c0c0';
            ctx.fillText(line, 320, y);
          });
          ctx.restore();
        }
      }
    };
  }

  UT.scenes = UT.scenes || {};
  UT.scenes.ending = ending;
})(window.UT);
