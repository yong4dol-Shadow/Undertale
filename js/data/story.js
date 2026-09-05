/* =========================================================
   data/story.js - 컷신 스크립트
   (소닉 언리쉬드의 이야기 구조를 언더테일 화법으로 옮긴 것)
   ========================================================= */
(function (UT) {
  'use strict';

  const S = UT.S;
  const U = UT.util;
  const G = () => UT.game;
  const NAME = () => UT.game.data.name;

  /* ---------- 공용 헬퍼 ---------- */

  function* setForm(form, quiet) {
    const d = UT.game.data;
    if (d.form === form) return;
    d.form = form;
    if (quiet) return;
    UT.audio.stop();
    UT.audio.sfx('transform');
    UT.game.flash('#b46bff', 0.9);
    UT.game.shake(7, 1.0);
    yield* S.wait(1.2);
  }

  function* travel(to, spawn, ...lines) {
    yield* S.fadeOut(0.8);
    UT.audio.stop();
    if (lines.length) yield* S.say.apply(null, lines);
    UT.world.goto(to, spawn);
    yield* S.fadeIn(0.9);
  }

  /** 원석을 신전에 되돌리는 연출 */
  function* restoreShard(index, ...after) {
    UT.audio.stop();
    yield* S.say('* 당신은 빛을 잃은 원석을 받침대에 올렸다.');
    UT.audio.sfx('shine');
    UT.game.flash('#ffffff', 1);
    yield* S.wait(0.6);
    UT.game.shake(5, 1.4);
    yield* S.say(
      '* 받침대가 원석을 삼켰다.',
      '* 신전 바닥의 문양이 하나씩 켜진다.',
      '* 멀리서, 땅이 제자리를 찾아 들어가는 소리가 들린다.'
    );
    UT.game.flag('shards', index);
    UT.audio.play('hope');
    yield* S.say('* 대륙 한 조각이 돌아왔다. (' + index + '/7)');
    if (after.length) yield* S.say.apply(null, after);
  }

  const story = {};
  UT.story = story;

  /* ============================================================
     프롤로그
     ============================================================ */
  story.prologue_hall = function* () {
    UT.game.setFade(1);
    yield* S.wait(0.4);
    yield* S.fadeIn(1.2);
    yield* S.say(
      '* 오늘 밤, 하늘에 요새가 하나 떠 있다.',
      '* 그 안에는 이 행성에서 훔쳐 간 일곱 개의 원석이 있다.',
      '* 그리고 그 원석을 되찾으러 온 사람이 하나 있다.',
      '* 당신이다.'
    );
    yield* S.say('* (방향키로 이동, Z로 확인.)\n* 위쪽 문으로.');
  };

  story.prologue_core = function* () {
    UT.audio.play('tension');
    yield* S.wait(0.5);
    yield* S.say({ text: '“어서 와라. 빠른 발.“', face: 'ovoid' });
    yield* S.say(
      { text: '“네가 원석을 되찾으러 올 걸 알고 있었지.\n그래서 일곱 개 전부 여기 뒀다.“', face: 'ovoid' },
      { text: '“미끼로 말이야.“', face: 'ovoid' }
    );
    UT.game.shake(4, 0.8);
    yield* S.wait(0.8);
    yield* S.say('* 발밑의 바닥이 자석처럼 당신을 붙잡았다.');
    yield* S.say({ text: '“조금만 버텨 다오.\n네 안에서 도는 그 빛, 아주 잘 모이고 있으니까.“', face: 'ovoid' });

    yield* S.battle('ovoid_intro');

    UT.audio.stop();
    yield* S.say({ text: '“충전 완료.“', face: 'ovoid' });
    UT.game.flash('#ffffff', 1);
    UT.audio.sfx('shatter');
    UT.game.shake(12, 2.4);
    yield* S.wait(1.4);
    yield* S.say(
      '* 함선 아래로 빛의 기둥이 떨어졌다.',
      '* 행성의 껍질이, 잘 익은 과일처럼 갈라진다.',
      '* 하나, 둘, ... 일곱 조각.'
    );
    yield* S.say(
      '* 갈라진 틈에서 아주 오래된 것이 눈을 떴다.',
      '* 봉인되기 전부터 거기 있던 것.',
      '* 어둠. 녹스.'
    );
    yield* S.say({ text: '“하하! 하하하! 이게 내 행성이다!“', face: 'ovoid' },
                 { text: '“...어라. 잠깐. 저건 계획보다 좀 큰데.“', face: 'ovoid' });
    UT.audio.sfx('roar');
    UT.game.shake(9, 1.6);
    yield* S.wait(1.0);
    yield* S.say(
      '* 어둠 한 줄기가 당신의 SOUL에 박혔다.',
      '* 몸이 뜨거워진다. 뼈가 다시 배열된다.'
    );
    yield* setForm('night');
    yield* S.say(
      '* ...당신은 당신이 아닌 것이 되었다.',
      '* 빛을 잃은 일곱 원석이 당신과 함께 떨어진다.',
      '* 아주, 아주 오래 떨어졌다.'
    );
    yield* S.fadeOut(1.6);
    yield* S.wait(0.8);
    UT.game.flag('chapter', 1);
    UT.world.goto('mirka_beach', 'default');
  };

  /* ============================================================
     1장 : 미르카 해안마을
     ============================================================ */
  story.ch1_wake = function* () {
    UT.game.setFade(1);
    UT.game.data.form = 'day';
    yield* S.wait(0.6);
    yield* S.fadeIn(1.4);
    UT.audio.play('town');
    yield* S.say(
      '* 아침.',
      '* 모래 위. 파도가 신발을 적신다.',
      '* 몸은... 원래대로다. 해가 떠 있는 동안은.'
    );
    yield* S.say('* 그런데 등 밑에서 무언가가 꿈틀거린다.');
    UT.audio.sfx('confirm');
    yield* S.say(
      { text: '“으아아! 무거워! 무거워어어!“', face: 'coco' },
      { text: '“...어? 어라?“', face: 'coco' }
    );
    yield* S.say('* 손바닥만 한 것이 모래에서 빠져나왔다.\n* 등에 작은 날개, 목에 파란 펜던트.');
    yield* S.say(
      { text: '“나... 누구지?“', face: 'coco' },
      { text: '“이름이... 이름이 뭐였더라...“', face: 'coco' },
      { text: '“근데 배는 고파. 그건 확실해.“', face: 'coco' }
    );
    const pick = yield* S.choice('* 뭐라고 부를까?', ['코코', '초코'], 'coco');
    UT.game.flag('coco_name', pick === 0 ? '코코' : '초코');
    yield* S.say(
      { text: '“코코... 코코! 응, 그거 좋다!“', face: 'coco' },
      { text: '“초콜릿 냄새 나는 이름이잖아!“', face: 'coco' },
      { text: '“너는? 이름 있어?“', face: 'coco' }
    );
    yield* S.say('* 당신은 이름을 말했다.\n* “' + NAME() + '.“');
    yield* S.say({ text: '“' + NAME() + '. 응. 안 잊어버릴게.“', face: 'coco' },
                 { text: '“...한 번 잊어버려 본 사람은, 그런 거 조심하거든.“', face: 'coco' });
    UT.game.flag('ch1_met_coco', true);
    UT.game.flag('coco_follow', true);
    yield* S.say('* 코코가 따라오기 시작했다.', '* 마을은 동쪽이다.');
  };

  story.mirka_villager1 = function* () {
    yield* S.say(
      { text: '“어젯밤에 하늘이 갈라졌어. 봤나?“', face: 'npc_a' },
      { text: '“땅도 갈라졌지. 저 언덕 너머는 이제 낭떠러지야.“', face: 'npc_a' },
      { text: '“해가 지면 밖에 나가지 마. 요즘 밤은... 밤 이상이야.“', face: 'npc_a' }
    );
  };

  story.mirka_villager2 = function* () {
    if (UT.game.flag('shards')) {
      yield* S.say({ text: '“땅이 돌아왔어! 어젯밤 그 소리, 자네였나?“', face: 'npc_b' });
      return;
    }
    yield* S.say(
      { text: '“언덕 위에 오래된 신전이 있어.“', face: 'npc_b' },
      { text: '“할머니 말로는, 저기에 돌을 돌려놓으면\n땅이 제자리로 돌아온다더군.“', face: 'npc_b' },
      { text: '“동화 같은 얘기지. ...어제까진 그렇게 생각했는데 말이야.“', face: 'npc_b' }
    );
  };

  story.mirka_shop = function* () {
    yield* S.say({ text: '“아이스크림 하나 어때? 녹기 전에.“', face: 'npc_d' });
    yield* S.say({ text: '“...아니 잠깐, 그쪽 어깨 위에 있는 건 뭐야?“', face: 'npc_d' },
                 { text: '“내 거 아니야! 나 아무것도 안 먹었어!“', face: 'coco' });
    if (!UT.game.flag('shop_gift')) {
      UT.game.flag('shop_gift', true);
      if (UT.items.add('icecream')) yield* S.say('* 아이스크림을 하나 받았다.');
    }
  };

  story.ch1_night = function* () {
    UT.audio.stop();
    yield* S.say('* 해가 언덕 뒤로 넘어간다.');
    yield* S.wait(0.6);
    yield* S.say('* 몸이 뜨거워진다.');
    yield* setForm('night');
    UT.audio.play('night');
    yield* S.say(
      { text: '“으아아아! 뭐야! 뭐야 너!“', face: 'coco' },
      { text: '“...아니, 잠깐. 냄새는 똑같네.“', face: 'coco' },
      { text: '“' + NAME() + ' 맞지? 맞지?“', face: 'coco' }
    );
    yield* S.say('* 당신은 고개를 끄덕였다.\n* 목소리가 나오지 않는다. 대신 아주 잘 보인다. 밤인데도.');
    yield* S.say({ text: '“그럼 됐어. 가자.“', face: 'coco' },
                 { text: '“...어? 저기 뭐 있는데?“', face: 'coco' });
    UT.game.flag('ch1_can_encounter', true);
    yield* S.battle('shard');
    UT.audio.play('night');
    const r = UT.game.lastBattle;
    if (r && r.outcome === 'spare') {
      yield* S.say({ text: '“...봐줬네.“', face: 'coco' },
                   { text: '“나, 그거 좋다고 생각해.“', face: 'coco' });
    } else if (r && r.outcome === 'kill') {
      yield* S.say({ text: '“...없어졌어.“', face: 'coco' },
                   { text: '“저것도 원래는 어딘가의 조각이었을 텐데.“', face: 'coco' });
    }
    yield* S.say('* 신전은 북쪽이다.');
  };

  story.ch1_temple = function* () {
    UT.audio.play('temple');
    yield* S.say(
      '* 신전 안은 조용하다.',
      '* 벽에 그림이 있다. 낮을 담은 손과, 밤을 담은 손.',
      '* 두 손은 서로를 붙잡고 있다.'
    );
    yield* S.say({ text: '“...이 그림, 어디서 봤더라.“', face: 'coco' },
                 { text: '“머리가 아파. 근데 슬프진 않아. 이상하지?“', face: 'coco' });
    yield* S.say('* 받침대가 당신을 기다리고 있다. (Z로 확인)');
    yield* S.until(() => UT.input.pressed('confirm'));
    yield* restoreShard(1);
    yield* setForm('day');
    yield* S.say(
      '* 신전 창으로 아침이 들어온다.',
      { text: '“해가 떴어! 너도 돌아왔고!“', face: 'coco' },
      { text: '“...근데 이거, 앞으로 여섯 번 더 해야 하는 거지?“', face: 'coco' }
    );
    yield* S.say('* 다음 신전은 바다 건너, 오래된 대학 도시에 있다.');
    UT.game.flag('chapter', 2);
    yield* travel('spag_street', 'default');
  };

  /* ============================================================
     2장 : 스파고니아
     ============================================================ */
  story.ch2_arrive = function* () {
    UT.game.data.form = 'night';
    UT.audio.play('night');
    yield* S.say(
      '* 스파고니아. 돌길과 붉은 지붕의 도시.',
      '* 여기는 이미 밤이다. 그리고 당신도 밤이다.'
    );
    yield* S.say(
      { text: '“사람이 없네.“', face: 'coco' },
      { text: '“다들 안에 숨었나 봐. ...우리 때문은 아니겠지?“', face: 'coco' }
    );
    yield* S.say('* 골목 아래에 연구소가 있다. 문이 열려 있다.');
    UT.game.flag('ch2_can_encounter', true);
  };

  story.spag_student = function* () {
    yield* S.say(
      { text: '“교, 교수님 연구실이 저 아래예요!“', face: 'npc_c' },
      { text: '“가이아 문서? 그거 전공하신 분은 세상에 한 분뿐이에요.“', face: 'npc_c' },
      { text: '“...그쪽, 사람 맞죠? 맞다고 해 주세요.“', face: 'npc_c' }
    );
  };

  story.ch2_lab = function* () {
    UT.audio.play('temple');
    yield* S.say('* 책이 바닥까지 쌓여 있다.\n* 어딘가에서 파이 굽는 냄새가 난다.');
  };

  story.ch2_basil_talk = function* () {
    if (UT.game.flag('ch2_lab_done')) {
      yield* S.say({ text: '“옥상! 옥상으로 갔네! 서두르게!“', face: 'basil' });
      return;
    }
    yield* S.say(
      { text: '“오, 손님. 파이 드시겠나? ...아니 잠깐.“', face: 'basil' },
      { text: '“자네 밤의 형상이군. 문서 12장 그대로야!“', face: 'basil' },
      { text: '“무섭냐고? 학자한테 그건 무서운 게 아니라 자료라네.“', face: 'basil' }
    );
    yield* S.say(
      { text: '“가이아 문서는 이렇게 말하지.“', face: 'basil' },
      { text: '“행성에는 두 심장이 있다. 낮의 룩스, 밤의 녹스.“', face: 'basil' },
      { text: '“낮이 밤을 재우고, 밤이 낮을 쉬게 한다.\n둘 중 하나만 깨어 있으면 행성은 견디지 못해.“', face: 'basil' },
      { text: '“일곱 신전은 그 재우는 장치야.\n일곱 원석이 제자리에 있을 때만 작동하지.“', face: 'basil' }
    );
    yield* S.say({ text: '“...그런데 자네, 어깨 위의 그건.“', face: 'basil' },
                 { text: '“나? 나 코코!“', face: 'coco' },
                 { text: '“...문서 1장 삽화랑 똑같이 생겼는데.“', face: 'basil' });
    UT.audio.stop();
    UT.game.shake(8, 1.2);
    UT.audio.sfx('explode');
    yield* S.wait(1.0);
    yield* S.say('* 천장이 뜯겨 나갔다.');
    yield* S.say(
      { text: '“여어! 문서 좀 빌리자!“', face: 'ovoid' },
      { text: '“신전 위치가 전부 적혀 있다지? 학자 양반도 같이 오시게.“', face: 'ovoid' }
    );
    yield* S.say('* 강철 집게가 박사를 들어 올렸다.');
    yield* S.say({ text: '“파이! 파이가 아직 오븐에!“', face: 'basil' });
    UT.game.flag('ch2_lab_done', true);
    yield* S.say('* 옥상이다. 거리 동쪽 끝.');
  };

  story.ch2_boss = function* () {
    UT.audio.play('tension');
    yield* S.say(
      { text: '“늦었군! 자료는 이미 복사했다!“', face: 'ovoid' },
      { text: '“하지만 자네를 그냥 보내면 내 체면이 안 서지.“', face: 'ovoid' },
      { text: '“넛크래커. 저 밤의 강아지를 정리해라.“', face: 'ovoid' }
    );
    yield* S.battle('nutcracker');
    const r = UT.game.lastBattle;
    UT.audio.stop();
    if (r && r.outcome === 'dead') return;
    yield* S.say('* 집게가 열리고 박사가 굴러 나왔다.');
    if (r && r.outcome === 'spare') {
      yield* S.say({ text: '“...멈춰 놓기만 했군. 자네 이상한 애야.“', face: 'basil' },
                   { text: '“고장 안 났으면 고쳐서 오븐 타이머로 쓰겠어.“', face: 'basil' });
    } else {
      yield* S.say({ text: '“음. 아주 확실하게 정리했군.“', face: 'basil' },
                   { text: '“...고철값이라도 받아야겠어.“', face: 'basil' });
    }
    yield* S.say(
      { text: '“오보이드는 도망쳤네. 원석 몇 개도 들고 갔고.“', face: 'basil' },
      { text: '“하지만 신전은 못 옮겨. 자네가 먼저 가면 돼.“', face: 'basil' },
      { text: '“여기 도시 아래에 둘째 신전이 있네. 가게.“', face: 'basil' },
      { text: '“...그리고 그 꼬마. 잘 데리고 다니게.\n문서 마지막 장이 그 애 얘기였어.“', face: 'basil' }
    );
    if (UT.items.add('pie')) yield* S.say('* 바질의 파이를 받았다.');
    yield* travel('temple2', 'default');
  };

  story.ch2_temple = function* () {
    UT.audio.play('temple');
    yield* S.say('* 도시 아래, 물길 옆의 신전.\n* 벽화 속 작은 것이 웃고 있다. 날개가 달렸다.');
    yield* S.say({ text: '“...저거 나 같은데.“', face: 'coco' },
                 { text: '“기분 이상해. 내가 나를 보고 있는 것 같아.“', face: 'coco' });
    yield* S.say('* 받침대. (Z로 확인)');
    yield* S.until(() => UT.input.pressed('confirm'));
    yield* restoreShard(2);
    yield* setForm('day');
    yield* S.say('* 다음 조각은 북쪽 끝, 눈에 덮여 있다.');
    UT.game.flag('chapter', 3);
    yield* travel('holo_field', 'default', '* 얼음 바람이 부는 쪽으로 갔다.');
  };

  /* ============================================================
     3장 : 홀로스카
     ============================================================ */
  story.ch3_arrive = function* () {
    UT.game.data.form = 'night';
    UT.audio.play('night');
    yield* S.say(
      '* 홀로스카. 밤이 반년쯤 이어지는 땅.',
      '* 여기서는 밤의 형상이 오히려 편하다. 털이 있으니까.'
    );
    yield* S.say({ text: '“나 추워! 너 따뜻해! 붙어 갈래!“', face: 'coco' });
    UT.game.flag('ch3_can_encounter', true);
  };

  story.ch3_village = function* () {
    yield* S.say('* 눈에 파묻힌 작은 마을.\n* 굴뚝마다 연기가 곧게 올라간다.');
  };

  story.holo_villager = function* () {
    yield* S.say(
      { text: '“얼음 밑에 신전이 있소. 우리 할아버지의 할아버지가 지켰지.“', face: 'npc_c' },
      { text: '“근데 요새는 얼음 밑에서 뭔가 헤엄쳐 다녀.“', face: 'npc_c' },
      { text: '“이빨이 아주 많은 거요. 조심하시오.“', face: 'npc_c' }
    );
    if (!UT.game.flag('holo_gift')) {
      UT.game.flag('holo_gift', true);
      if (UT.items.add('stew')) yield* S.say('* 설원 수프를 받았다.');
    }
  };

  story.ch3_temple = function* () {
    UT.audio.play('temple');
    yield* S.say('* 얼음 아래 신전. 숨을 쉬면 하얗게 얼어붙는다.');
    yield* S.say({ text: '“...' + NAME() + '. 나 여기 와 본 적 있어.“', face: 'coco' },
                 { text: '“어떻게 아냐고? 발이 길을 알아.“', face: 'coco' });
    UT.audio.sfx('roar');
    UT.game.shake(10, 1.4);
    yield* S.wait(1.0);
    yield* S.say('* 바닥의 얼음이 갈라진다.');
    yield* S.battle('moray');
    const r = UT.game.lastBattle;
    if (r && r.outcome === 'dead') return;
    UT.audio.stop();
    if (r.outcome === 'spare') {
      yield* S.say({ text: '“도망갔다! 내가! 빛으로!“', face: 'coco' },
                   { text: '“...나 방금 뭐 한 거지?“', face: 'coco' });
    } else {
      yield* S.say({ text: '“...흩어졌어.“', face: 'coco' },
                   { text: '“근데 이상해. 슬픈 느낌이 났어. 저쪽에서.“', face: 'coco' });
    }
    yield* S.say('* 받침대. (Z로 확인)');
    yield* S.until(() => UT.input.pressed('confirm'));
    yield* restoreShard(3);
    yield* setForm('day');
    yield* S.say(
      { text: '“' + NAME() + '. 나 기억 하나 났어.“', face: 'coco' },
      { text: '“아주 오래전에, 내가 뭔가를 재웠어.“', face: 'coco' },
      { text: '“자장가를 불렀던 것 같아. 아주 길게.“', face: 'coco' }
    );
    UT.game.flag('chapter', 4);
    yield* travel('ada_village', 'default', '* 남쪽. 물과 초록의 대륙으로.');
  };

  /* ============================================================
     4장 : 아다바트
     ============================================================ */
  story.ch4_arrive = function* () {
    UT.audio.play('town');
    yield* S.say('* 아다바트. 물 위에 판자를 깔고 사는 마을.',
                 '* 여기는 아직 낮이다. 조금 남았다.');
    yield* S.say({ text: '“물! 물이다! 나 물 좋아해!“', face: 'coco' },
                 { text: '“...어? 나 물 좋아했나? 방금 알았어.“', face: 'coco' });
    UT.game.flag('ch4_can_encounter', true);
  };

  story.ada_villager = function* () {
    yield* S.say(
      { text: '“다리가 끊겼어. 넝쿨이 통째로 감아 버렸거든.“', face: 'npc_b' },
      { text: '“원래 저 넝쿨 뱀은 신전 지킴이였어.“', face: 'npc_b' },
      { text: '“어릴 때 아이들 태워 주기도 했는데... 지금은 눈이 까매.“', face: 'npc_b' }
    );
  };

  story.ch4_temple = function* () {
    UT.audio.play('tension');
    yield* S.say('* 신전 입구. 거대한 넝쿨이 문을 감고 있다.');
    UT.audio.sfx('roar');
    yield* S.wait(0.7);
    yield* S.battle('serpent');
    const r = UT.game.lastBattle;
    if (r && r.outcome === 'dead') return;
    UT.audio.stop();
    if (r.outcome === 'spare') {
      yield* S.say('* 뱀은 몸을 눕혀 다리가 되어 주었다.',
                   { text: '“...지키는 방법, 다시 생각났나 봐.“', face: 'coco' });
    } else {
      yield* S.say('* 넝쿨이 풀리며 문이 열렸다.',
                   { text: '“...이 신전, 이제 아무도 안 지키네.“', face: 'coco' });
    }
    UT.audio.play('temple');
    yield* S.say('* 받침대. (Z로 확인)');
    yield* S.until(() => UT.input.pressed('confirm'));
    yield* restoreShard(4, '* 이어서, 다섯째와 여섯째 조각도 제자리를 찾았다.');
    UT.game.flag('shards', 6);
    yield* setForm('day');
    yield* S.say(
      { text: '“여섯 개. 하나 남았어.“', face: 'coco' },
      { text: '“' + NAME() + '. 나 요즘 자꾸 생각나는 게 있는데.“', face: 'coco' },
      { text: '“내가 재운 그거... 지금 깨어 있잖아. 그렇지?“', face: 'coco' }
    );
    UT.game.flag('chapter', 5);
    yield* travel('shamar_dune', 'default', '* 마지막 신전은 사막 한가운데에 있다.');
  };

  /* ============================================================
     5장 : 샤말
     ============================================================ */
  story.ch5_arrive = function* () {
    UT.game.data.form = 'night';
    UT.audio.play('night');
    yield* S.say('* 샤말. 낮에는 타고 밤에는 어는 땅.',
                 '* 모래 위에 별이 너무 많아서, 하늘이 무겁다.');
    UT.game.flag('ch5_can_encounter', true);
  };

  story.ch5_temple = function* () {
    UT.audio.play('temple');
    yield* S.say('* 마지막 신전. 모래에 반쯤 묻혀 있다.');
    yield* S.say({ text: '“' + NAME() + '. 이거 끝나면 말이야.“', face: 'coco' },
                 { text: '“같이 초콜릿 먹으러 가자. 제일 큰 걸로.“', face: 'coco' });
    yield* S.say('* 당신은 고개를 끄덕였다.');
    yield* S.say('* 받침대. (Z로 확인)');
    yield* S.until(() => UT.input.pressed('confirm'));
    UT.audio.stop();
    UT.audio.sfx('explode');
    UT.game.shake(9, 1.2);
    yield* S.wait(0.9);
    yield* S.say('* 천장이 무너졌다.');
    yield* S.say(
      { text: '“여섯 번이나 뒤처리를 했으면 됐지.“', face: 'ovoid' },
      { text: '“마지막 하나는 내가 가져가마.“', face: 'ovoid' }
    );
    UT.audio.sfx('hurt');
    yield* S.say('* 집게가 원석을 낚아챘다.');
    yield* S.say({ text: '“그리고 그 꼬마도.“', face: 'ovoid' });
    yield* S.say(
      { text: '“놔! 놔아아! ' + NAME() + '!“', face: 'coco' },
      '* 손이 닿지 않았다.'
    );
    UT.game.flag('coco_follow', false);
    yield* S.say(
      { text: '“문서에 이렇게 쓰여 있더군.“', face: 'ovoid' },
      { text: '“밤을 재우는 건 낮의 심장이라고.“', face: 'ovoid' },
      { text: '“그 심장을 내가 갖고 있으면?\n밤은 영원하고, 나는 그 밤의 주인이 되는 거다.“', face: 'ovoid' },
      { text: '“오보이드랜드에서 기다리마. 입장료는 비싸다!“', face: 'ovoid' }
    );
    yield* S.say('* 신전에 혼자 남았다.', '* 아주 조용하다.', '* ...가야 한다.');
    UT.game.flag('chapter', 6);
    yield* travel('ovoid_gate', 'default', '* 균열 위에 세워진 유원지로.');
  };

  /* ============================================================
     6장 : 오보이드랜드
     ============================================================ */
  story.ch6_arrive = function* () {
    UT.audio.play('tension');
    yield* S.say(
      '* 오보이드랜드.',
      '* 균열 바로 위에 못을 박듯 세운 유원지 겸 공장.',
      '* 회전목마가 아무도 태우지 않고 돌고 있다.'
    );
    yield* S.say('* 스피커: “즐거우신가요? 즐거우셔야 합니다.“');
    UT.game.flag('ch6_can_encounter', true);
  };

  story.ch6_boss = function* () {
    UT.audio.play('tension');
    yield* S.say('* 균열 바로 위. 바닥이 유리처럼 얇다.');
    yield* S.say({ text: '“' + NAME() + '! 여기야!“', face: 'coco' });
    yield* S.say('* 코코가 유리관 안에 있다.\n* 관 옆에는 빛을 잃은 마지막 원석.');
    yield* S.say(
      { text: '“마침 잘 왔다. 실험 대상이 하나 더 필요했거든.“', face: 'ovoid' },
      { text: '“이 꼬마에게서 빛을 뽑으면 밤이 영원해진다.\n영원한 밤이면, 자네는 영원히 그 모습이겠지.“', face: 'ovoid' },
      { text: '“어떤가? 서로 손해 볼 것 없잖나?“', face: 'ovoid' }
    );
    const pick = yield* S.choice('* 뭐라고 답할까?', ['거절한다', '침묵한다']);
    if (pick === 0) yield* S.say('* 당신은 고개를 저었다.\n* 아주 천천히, 아주 분명하게.');
    else yield* S.say('* 당신은 아무 말도 하지 않았다.\n* 대신 한 걸음 앞으로 나갔다.');
    yield* S.say({ text: '“...그럴 줄 알았다.“', face: 'ovoid' });
    yield* S.battle('dragoon');
    const r = UT.game.lastBattle;
    if (r && r.outcome === 'dead') return;
    UT.audio.stop();
    UT.game.shake(6, 1.0);
    if (r.outcome === 'spare') {
      yield* S.say({ text: '“...그만하자. 그만!“', face: 'ovoid' },
                   { text: '“내가 졌다. 졌어! 유리관은 열어 주마!“', face: 'ovoid' });
    } else {
      yield* S.say('* 드라군이 무릎을 꿇었다.',
                   { text: '“내... 내 걸작이...!“', face: 'ovoid' });
    }
    UT.audio.sfx('confirm');
    yield* S.say('* 유리관이 열렸다.');
    yield* S.say({ text: '“' + NAME() + '!“', face: 'coco' },
                 { text: '“나 하나도 안 울었어. 진짜야.“', face: 'coco' });
    UT.game.flag('coco_follow', true);
    yield* S.say('* 마지막 원석을 되찾았다. (7/7)');
    UT.game.flag('shards', 7);

    UT.audio.stop();
    UT.audio.sfx('roar');
    UT.game.shake(14, 3.0);
    yield* S.wait(1.4);
    yield* S.say(
      '* 발밑이 울린다.',
      '* 일곱 조각이 다 모였는데도, 땅이 닫히지 않는다.'
    );
    yield* S.say(
      { text: '“...아니. 아니야. 이건 내 설계가 아니야.“', face: 'ovoid' },
      { text: '“저 아래 놈이... 벌써 이만큼 자랐다고?“', face: 'ovoid' }
    );
    yield* S.say('* 균열에서 손이 올라온다.\n* 유원지를, 공장을, 오보이드의 기계를 통째로 삼킨다.');
    yield* S.say({ text: '“...이건 계획에 없었어!“', face: 'ovoid' },
                 '* 오보이드는 탈출 포드로 사라졌다.');
    UT.game.flash('#000000', 1);
    yield* S.say('* 바닥이 사라졌다.',
                 { text: '“' + NAME() + '! 손! 손 잡아!“', face: 'coco' },
                 '* 둘은 아래로 떨어졌다.');
    UT.game.flag('chapter', 7);
    yield* travel('abyss', 'default');
  };

  /* ============================================================
     7장 : 심연
     ============================================================ */
  story.ch7_abyss = function* () {
    UT.game.data.form = 'night';
    UT.audio.stop();
    yield* S.say(
      '* 바닥이 없는 곳.',
      '* 위도 아래도 없고, 아주 큰 것이 숨 쉬는 소리만 있다.'
    );
    UT.audio.sfx('roar');
    UT.game.shake(8, 2.0);
    yield* S.wait(1.2);
    yield* S.say('* 녹스가 깨어 있다.', '* 일곱 조각을 되돌려도, 재워 줄 사람이 없었으니까.');
    yield* S.battle('nox1');
    if (UT.game.lastBattle && UT.game.lastBattle.outcome === 'dead') return;

    UT.audio.stop();
    yield* S.say(
      '* 공격이 통하지 않는다.',
      '* 밤의 형상으로도, 낮의 발로도 닿지 않는다.',
      '* 무릎이 꺾였다.'
    );
    yield* S.say({ text: '“' + NAME() + '.“', face: 'coco' },
                 { text: '“나 이제 기억났어. 전부.“', face: 'coco' });
    yield* S.say(
      { text: '“나는 낮이야. 저건 밤이고.“', face: 'coco' },
      { text: '“아주 오래전에 내가 재웠어. 자장가를 불러서.“', face: 'coco' },
      { text: '“그리고 나도 같이 잠들었지. 그래서 다 잊어버린 거야.“', face: 'coco' }
    );
    yield* S.say({ text: '“' + NAME() + '. 일어설 수 있어?“', face: 'coco' });
    const pick = yield* S.choice('* ...', ['일어선다', '일어선다']);
    yield* S.say('* 당신은 일어섰다.');
    UT.audio.sfx('shine');
    UT.game.flash('#ffffff', 1);
    yield* S.wait(1.0);
    UT.audio.play('hope');
    yield* S.say(
      '* 코코의 몸에서 빛이 터져 나왔다.',
      '* 작던 것이 커진다. 커지고, 더 커진다.',
      '* 산만 한 손 두 개가 당신을 떠받쳤다.'
    );
    yield* S.say({ text: '“이게 원래 내 모습이야. 룩스.“', face: 'lux' },
                 { text: '“...근데 코코라고 불러. 그게 더 좋아.“', face: 'lux' });
    yield* S.say('* 일곱 원석이 당신 주위를 돌기 시작한다.',
                 '* 빛이 몸으로 들어온다. 밤의 형상 위에, 낮이 겹쳐진다.');
    UT.game.data.form = 'day';
    if (UT.game.data.weapon !== 'prismedge') {
      UT.game.data.items.push(UT.game.data.weapon);
      UT.game.data.weapon = 'prismedge';
    }
    if (UT.game.data.armor !== 'cocopendant') {
      UT.game.data.items.push(UT.game.data.armor);
      UT.game.data.armor = 'cocopendant';
    }
    UT.game.data.hp = UT.game.data.maxhp;
    yield* S.say('* 프리즘 칼날과 코코의 펜던트를 장착했다.',
                 '* HP가 전부 회복되었다.');
    yield* S.say({ text: '“마지막이야. 죽이든, 재우든.“', face: 'lux' },
                 { text: '“...나는 네가 고르는 쪽을 믿을게.“', face: 'lux' });
    yield* S.battle('nox_final');
    const r = UT.game.lastBattle;
    if (!r || r.outcome === 'dead') return;
    UT.audio.stop();
    UT.game.push(UT.scenes.ending(r.outcome === 'spare' ? 'true' : 'kill'));
  };

  /* 신전 안 받침대 상호작용용(공용) */
  story.pedestal_hint = function* () {
    yield* S.say('* 받침대 위가 비어 있다.');
  };

})(window.UT);
