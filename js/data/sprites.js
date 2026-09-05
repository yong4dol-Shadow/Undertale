/* =========================================================
   data/sprites.js - 모든 도트 그래픽 (외부 이미지 없음)
   ========================================================= */
(function (UT) {
  'use strict';

  const S = {};
  UT.sprites = S;

  function def(key, pal, rows) {
    const spr = UT.sprite.make({ key, pal, rows });
    S[key] = spr;
    return spr;
  }

  /** 특정 행 구간을 좌우로 밀어 걷기 프레임 생성 */
  function shifted(key, spr, from, to, dx) {
    const rows = spr.rows.map((r, i) => {
      if (i < from || i > to) return r;
      if (dx > 0) return '.'.repeat(dx) + r.slice(0, r.length - dx);
      return r.slice(-dx) + '.'.repeat(-dx);
    });
    return def(key, spr.pal, rows);
  }

  /* ================= 팔레트 ================= */
  const HERO = {
    h: '#5a3418', s: '#f2c9a0', e: '#241a14', b: '#3f74c8', d: '#27508f',
    p: '#3f4557', r: '#d24040', y: '#f0f0f0', w: '#ffffff'
  };
  const NIGHT = {
    f: '#33437a', g: '#1e2a54', e: '#ffd24d', w: '#ffffff', y: '#d8d8e0',
    s: '#e8ecff', k: '#141a33'
  };
  const COCO = {
    b: '#ffe9a8', o: '#e0a750', e: '#2a2a3a', w: '#a8e8ff', p: '#4fc3f7', r: '#ff9ec4'
  };

  /* ================= SOUL ================= */
  def('heart', { r: '#ff2020' }, [
    '................',
    '...rrr....rrr...',
    '..rrrrr..rrrrr..',
    '.rrrrrrrrrrrrrr.',
    '.rrrrrrrrrrrrrr.',
    '.rrrrrrrrrrrrrr.',
    '..rrrrrrrrrrrr..',
    '..rrrrrrrrrrrr..',
    '...rrrrrrrrrr...',
    '....rrrrrrrr....',
    '.....rrrrrr.....',
    '......rrrr......',
    '.......rr.......',
    '................'
  ]);

  def('heart_purple', { r: '#b46bff' }, S.heart.rows);
  def('heart_yellow', { r: '#ffd44d' }, S.heart.rows);
  def('heart_white', { r: '#ffffff' }, S.heart.rows);

  def('heart_broken', { r: '#ff2020' }, [
    '................',
    '...rrr....rrr...',
    '..rrrr....rrrr..',
    '.rrrrr.rr.rrrrr.',
    '.rrrr.rrrr.rrrr.',
    '.rrrrrrr..rrrrr.',
    '..rrrrr..rrrrr..',
    '..rrrr..rrrrrr..',
    '...rrr.rrrrrr...',
    '....rr.rrrrr....',
    '.....r.rrrr.....',
    '......rrrr......',
    '.......rr.......',
    '................'
  ]);

  /* ================= 주인공 (낮 형상) ================= */
  def('hero_down', HERO, [
    '.....hhhhhh.....',
    '...hhhhhhhhhh...',
    '..hhhhhhhhhhhh..',
    '..hhsssssssshh..',
    '..hhsssssssshh..',
    '..hsseesseesshh.',
    '..hhsssssssshh..',
    '...hssssssssh...',
    '....yyyyyyyy....',
    '...bbbyyyybbb...',
    '..bbbbbbbbbbbb..',
    '..bbbbbbbbbbbb..',
    '..sbbbbbbbbbbs..',
    '..sbbbddddbbbs..',
    '..sbbbddddbbbs..',
    '...bbbddddbbb...',
    '....pppppppp....',
    '....pppppppp....',
    '....ppp..ppp....',
    '....ppp..ppp....',
    '...rrrr..rrrr...',
    '...rrrr..rrrr...'
  ]);

  def('hero_up', HERO, [
    '.....hhhhhh.....',
    '...hhhhhhhhhh...',
    '..hhhhhhhhhhhh..',
    '..hhhhhhhhhhhh..',
    '..hhhhhhhhhhhh..',
    '..hhhhhhhhhhhh..',
    '..hhhhhhhhhhhh..',
    '...hhhhhhhhhh...',
    '....yyyyyyyy....',
    '...bbbyyyybbb...',
    '..bbbbbbbbbbbb..',
    '..bbbbbbbbbbbb..',
    '..sbbbbbbbbbbs..',
    '..sbbbddddbbbs..',
    '..sbbbddddbbbs..',
    '...bbbddddbbb...',
    '....pppppppp....',
    '....pppppppp....',
    '....ppp..ppp....',
    '....ppp..ppp....',
    '...rrrr..rrrr...',
    '...rrrr..rrrr...'
  ]);

  def('hero_side', HERO, [
    '.....hhhhhh.....',
    '....hhhhhhhhh...',
    '...hhhhhhhhhhh..',
    '...hhhssssssss..',
    '...hhhsssssss...',
    '...hhhsseesss...',
    '...hhhssssssss..',
    '....hhssssssss..',
    '.....yyyyyyy....',
    '....bbbyyybbb...',
    '...bbbbbbbbbb...',
    '...bbbbbbbbbb...',
    '...bbbbbbbbbbs..',
    '...bbbddddbbbs..',
    '...bbbddddbbbs..',
    '...bbbddddbb....',
    '....pppppppp....',
    '....pppppppp....',
    '....pppppppp....',
    '.....pppppp.....',
    '...rrrrrrrrr....',
    '...rrrrrrrrr....'
  ]);

  shifted('hero_down_a', S.hero_down, 16, 21, 1);
  shifted('hero_down_b', S.hero_down, 16, 21, -1);
  shifted('hero_up_a', S.hero_up, 16, 21, 1);
  shifted('hero_up_b', S.hero_up, 16, 21, -1);
  shifted('hero_side_a', S.hero_side, 16, 21, 1);
  shifted('hero_side_b', S.hero_side, 16, 21, -1);

  /* ================= 주인공 (밤 형상) ================= */
  def('night_down', NIGHT, [
    '......ffffffff......',
    '....ffffffffffff....',
    '...ffffffffffffff...',
    '..ffffffffffffffff..',
    '..ffeeffffffffeeff..',
    '..ffffffffffffffff..',
    '..ffffwwwwwwwwffff..',
    '...ffffffffffffff...',
    '....yyyyyyyyyyyy....',
    '..ffffffffffffffff..',
    '.ffffffffffffffffff.',
    'sffffffffffffffffffs',
    'sffffffffffffffffffs',
    'sfffffgggggggfffffff',
    '.ffffggggggggffffff.',
    '.ffffffffffffffffff.',
    '..ffffffffffffffff..',
    '...ffffff..ffffff...',
    '...ffffff..ffffff...',
    '...gggggg..gggggg...',
    '..ssssss....ssssss..',
    '....................'
  ]);

  def('night_up', NIGHT, [
    '......ffffffff......',
    '....ffffffffffff....',
    '...ffffffffffffff...',
    '..ffffffffffffffff..',
    '..ffffffffffffffff..',
    '..ffffffffffffffff..',
    '..ffffffffffffffff..',
    '...ffffffffffffff...',
    '....yyyyyyyyyyyy....',
    '..ffffffffffffffff..',
    '.ffffffffffffffffff.',
    'sffffffffffffffffffs',
    'sffffffffffffffffffs',
    'sffffffffffffffffffs',
    '.ffffffffffffffffff.',
    '.ffffffffffffffffff.',
    '..ffffffffffffffff..',
    '...ffffff..ffffff...',
    '...ffffff..ffffff...',
    '...gggggg..gggggg...',
    '..ssssss....ssssss..',
    '....................'
  ]);

  def('night_side', NIGHT, [
    '.....ffffffffff.....',
    '...ffffffffffffff...',
    '..ffffffffffffffff..',
    '..ffffffffffffffff..',
    '..fffffffffeeffff...',
    '..ffffffffffffff....',
    '..fffffffwwwwww.....',
    '...fffffffffff......',
    '....yyyyyyyyy.......',
    '..fffffffffffff.....',
    '.fffffffffffffff....',
    '.ffffffffffffffff...',
    'sfffffffffffffffff..',
    'sffffffgggggffffff..',
    'sfffffgggggggfffff..',
    '.ffffffffffffffff...',
    '..ffffffffffffff....',
    '...ffffff.fffff.....',
    '...ffffff.fffff.....',
    '...gggggg.ggggg.....',
    '..ssssss..sssss.....',
    '....................'
  ]);

  shifted('night_down_a', S.night_down, 17, 21, 1);
  shifted('night_down_b', S.night_down, 17, 21, -1);
  shifted('night_up_a', S.night_up, 17, 21, 1);
  shifted('night_up_b', S.night_up, 17, 21, -1);
  shifted('night_side_a', S.night_side, 17, 21, 1);
  shifted('night_side_b', S.night_side, 17, 21, -1);

  /* ================= 코코 (빛의 정령) ================= */
  def('coco', COCO, [
    '.....oooooo.....',
    '...oobbbbbboo...',
    '..obbbbbbbbbbo..',
    'w.obbeebbeebbo.w',
    'ww.bbeebbeebb.ww',
    'wwwbbbbbbbbbbwww',
    'ww.bbbrrrrbbb.ww',
    'w..obbbbbbbbo..w',
    '....obbppbbo....',
    '.....oppppo.....',
    '......oppo......',
    '.......oo.......'
  ]);

  def('coco_b', COCO, [
    '.....oooooo.....',
    '...oobbbbbboo...',
    '..obbbbbbbbbbo..',
    '..obbeebbeebbo..',
    'w..bbeebbeebb..w',
    'ww.bbbbbbbbbb.ww',
    'w..bbbrrrrbbb..w',
    '...obbbbbbbbo...',
    '....obbppbbo....',
    '.....oppppo.....',
    '......oppo......',
    '.......oo.......'
  ]);

  def('coco_sad', COCO, [
    '.....oooooo.....',
    '...oobbbbbboo...',
    '..obbbbbbbbbbo..',
    '..obbbbbbbbbbo..',
    'w..bbeebbeebb..w',
    'ww.bbbbbbbbbb.ww',
    'w..bbbbbbbbbb..w',
    '...obbbrrbbbo...',
    '....obbppbbo....',
    '.....oppppo.....',
    '......oppo......',
    '.......oo.......'
  ]);

  /* ================= 닥터 오보이드 ================= */
  def('ovoid', {
    s: '#f2c9a0', m: '#a03a3a', g: '#f0f0f0', e: '#2a2a3a', r: '#c83030',
    y: '#e8c04a', k: '#303040', w: '#ffffff'
  }, [
    '........kkkkkkkk........',
    '......kkkkkkkkkkkk......',
    '.....kkkkkkkkkkkkkk.....',
    '.....kkssssssssssss.....',
    '....kssssssssssssssk....',
    '....sssggggggggggsss....',
    '....ssggeeggggeeggss....',
    '....sssggggggggggsss....',
    '....sssssssmmssssss.....',
    '.....ssmmmmmmmmmmss.....',
    '.....smmmmmmmmmmmms.....',
    '......ssmmmmmmmmss......',
    '....rrrrrrrrrrrrrrrr....',
    '...rrrrrrryyyyrrrrrrr...',
    '..rrrrrrrryyyyrrrrrrrr..',
    '..srrrrrrryyyyrrrrrrrs..',
    '..srrrrrrrrrrrrrrrrrrs..',
    '..srrrrrrrrrrrrrrrrrrs..',
    '...rrrrrrrrrrrrrrrrrr...',
    '....kkkkkk....kkkkkk....',
    '....kkkkkk....kkkkkk....',
    '...kkkkkkk....kkkkkkk...'
  ]);

  /* ================= NPC ================= */
  const NPC = { a: '#e8e8e8', b: '#c8ccd8', s: '#f2c9a0', e: '#241a14', h: '#3a2a1a', c: '#5aa85a', d: '#3a7a3a', o: '#e08a3a', p: '#a05ad0' };

  function npcSprite(key, hair, cloth, cloth2) {
    return def(key, Object.assign({}, NPC, { h: hair, c: cloth, d: cloth2 }), [
      '....hhhhhhhh....',
      '...hhhhhhhhhh...',
      '..hhssssssssh...',
      '..hsseesseessh..',
      '..hhssssssssh...',
      '...hssssssssh...',
      '....ssssssss....',
      '...cccccccccc...',
      '..cccccccccccc..',
      '..scccccccccc s.',
      '..scccddcccccs..',
      '..scccddccccc...',
      '...ccccccccc....',
      '....dddddddd....',
      '....dddddddd....',
      '....ddd..ddd....',
      '....ddd..ddd....',
      '...eeee..eeee...'
    ]);
  }
  npcSprite('npc_a', '#3a2a1a', '#5aa85a', '#3a7a3a');
  npcSprite('npc_b', '#8a5a2a', '#e08a3a', '#b06a20');
  npcSprite('npc_c', '#dadada', '#7a8ad0', '#4a5a9a');
  npcSprite('npc_d', '#2a2a2a', '#d05a7a', '#a03a5a');

  /* 바질 박사 */
  def('basil', {
    h: '#e0e0e0', s: '#f2c9a0', e: '#241a14', c: '#f4f4f4', d: '#d8d8d8',
    g: '#8ad8f0', b: '#4a5a7a', k: '#2a2a2a'
  }, [
    '....hhhhhhhh....',
    '...hhhhhhhhhh...',
    '..hhssssssssh...',
    '..hgggsggggghh..',
    '..hsgeesseegsh..',
    '...hssssssssh...',
    '....sshhhhss....',
    '....shhhhhhs....',
    '...cccccccccc...',
    '..cccccccccccc..',
    '..sccccbbcccc s.',
    '..sccccbbccccs..',
    '..scccccccccc...',
    '...cccccccccc...',
    '....dddddddd....',
    '....ddd..ddd....',
    '....ddd..ddd....',
    '...kkkk..kkkk...'
  ]);

  /* ================= 오브젝트 ================= */
  def('save_star', { y: '#ffe14d', w: '#ffffff', o: '#e8a020' }, [
    '.......ww.......',
    '.......yy.......',
    '......yyyy......',
    '......yyyy......',
    '.yy...yyyy...yy.',
    '..yyyyyyyyyyyy..',
    '...yyyyyyyyyy...',
    '....yyyyyyyy....',
    '.....yyyyyy.....',
    '....yyyyyyyy....',
    '....yyy..yyy....',
    '...yyy....yyy...',
    '..yyo......oyy..',
    '..yo........oy..',
    '................',
    '................'
  ]);

  def('gem', { c: '#7ce8ff', w: '#ffffff', d: '#2a8ab0' }, [
    '.....wwwwww.....',
    '...wwccccccww...',
    '..wccccccccccw..',
    '.wcccccwwcccccw.',
    '.wccccwwwwccccw.',
    '.wcccccwwcccccw.',
    '..dcccccccccdd..',
    '..dddccccccddd..',
    '...ddddccdddd...',
    '....dddddddd....',
    '.....dddddd.....',
    '......dddd......',
    '.......dd.......',
    '................'
  ]);

  def('choco', { b: '#6a3a1a', d: '#4a2410', w: '#f0e0c0' }, [
    '................',
    '..wwwwwwwwwwww..',
    '..wbbbdbbbdbbw..',
    '..wbbbdbbbdbbw..',
    '..wdddddddddddw.',
    '..wbbbdbbbdbbw..',
    '..wbbbdbbbdbbw..',
    '..wdddddddddddw.',
    '..wbbbdbbbdbbw..',
    '..wwwwwwwwwwww..',
    '................',
    '................'
  ]);

  def('icecream', { c: '#ffd8e8', w: '#fff0f4', n: '#e0a750', r: '#ff5a7a' }, [
    '.......r........',
    '......ccc.......',
    '.....ccccc......',
    '....wcccccw.....',
    '....ccccccc.....',
    '.....nnnnn......',
    '.....nnnnn......',
    '......nnn.......',
    '......nnn.......',
    '.......n........',
    '................',
    '................'
  ]);

  def('pendant', { p: '#4fc3f7', w: '#ffffff', y: '#ffe14d' }, [
    '......yy........',
    '.....y..y.......',
    '....y....y......',
    '....y....y......',
    '.....pppp.......',
    '....pppppp......',
    '....pwppppp.....',
    '....pppppp......',
    '.....pppp.......',
    '................',
    '................',
    '................'
  ]);

  /* ================= 몬스터 ================= */
  /* 그림자 조각 */
  def('m_shard', { d: '#2a2440', k: '#171430', e: '#ff5a5a', w: '#ffffff' }, [
    '........dddd........',
    '......dddddddd......',
    '.....dddddddddd.....',
    '....dddddddddddd....',
    '...dddddddddddddd...',
    '...ddeeddddddeedd...',
    '...ddeeddddddeedd...',
    '...dddddddddddddd...',
    '...dddwwwwwwwwddd...',
    '...dddwddddddwddd...',
    '...dddwwwwwwwwddd...',
    '...dddddddddddddd...',
    '....kkddddddddkk....',
    '.....kkddddddkk.....',
    '....kk..kkkk..kk....',
    '...kk...kkkk...kk...'
  ]);

  /* 밤벌레 */
  def('m_crawler', { d: '#3a2a5a', p: '#8a5ad0', e: '#ffe14d', k: '#201838' }, [
    '..........dd..........',
    '.....dd..dddd..dd.....',
    '......dddddddddd......',
    '.....dddddddddddd.....',
    '....dddeedddddeeddd...',
    '....dddddddddddddd....',
    '...pppppppppppppppp...',
    '..pppkppppppppkpppp...',
    '..pppppppppppppppp....',
    '...pppppppppppppp.....',
    '....pppppppppppp......',
    '..kk.pppppppppp.kk....',
    '.kk...kk.kk.kk...kk...',
    '......................'
  ]);

  /* 등불 아주머니 (밤의 마을 몬스터) */
  def('m_lantern', { l: '#ffd980', g: '#f0a030', e: '#3a2a10', d: '#5a4a2a', w: '#fff4c0' }, [
    '........dd........',
    '.......dddd.......',
    '......gggggg......',
    '.....gllllllg.....',
    '....gllllllllg....',
    '....gllllllllg....',
    '....glleellllg....',
    '....gllllllllg....',
    '....gllwwwwllg....',
    '....gllllllllg....',
    '.....gllllllg.....',
    '......gggggg......',
    '.......dddd.......',
    '......dd..dd......'
  ]);

  /* 얼음 정령 */
  def('m_frost', { c: '#bfe8ff', w: '#ffffff', b: '#5aa8d8', e: '#2a4a6a' }, [
    '.........ww.........',
    '........wccw........',
    '.......wccccw.......',
    '......wcccccccw.....',
    '.....wccccccccw.....',
    '.....wcceeccccw.....',
    '.....wccccccccw.....',
    '.....wcceecccw......',
    '......wcccccw.......',
    '....bbwcccccwbb.....',
    '...bb..wccw...bb....',
    '..bb....ww.....bb...',
    '.bb.............bb..',
    '....................'
  ]);

  /* 사막 유령 */
  def('m_dune', { s: '#e8d0a0', d: '#c0a070', e: '#4a3a20', w: '#fff8e8' }, [
    '.......ssss.......',
    '.....ssssssss.....',
    '....ssssssssss....',
    '...sssssssssssss..',
    '...ssseessseesss..',
    '...ssssssssssssss.',
    '...ssswwwwwwsssss.',
    '...sssssssssssss..',
    '...ddssssssssdd...',
    '....ddssssssdd....',
    '.....ddssssdd.....',
    '......dddddd......',
    '.......dddd.......',
    '..................'
  ]);

  /* 오보이드 넛크래커 (2장 보스 로봇) */
  def('b_nutcracker', {
    r: '#c83838', k: '#40465a', s: '#8a92a8', y: '#ffd24d', e: '#ff5a5a', w: '#ffffff'
  }, [
    '......kkkkkkkkkkkk......',
    '....kkrrrrrrrrrrrrkk....',
    '...krrrrrrrrrrrrrrrrk...',
    '...krreeerrrrrreeerrk...',
    '...krrrrrrrrrrrrrrrrk...',
    '...krrrwwwwwwwwwwrrrk...',
    '...krrrwkwkwkwkwwrrrk...',
    '...krrrwwwwwwwwwwrrrk...',
    '....kkrrrrrrrrrrrrkk....',
    '..ssskkkkkkkkkkkkkksss..',
    '.sssskyyyyyyyyyykssssss.',
    '.sssskyykkkkkkyykssssss.',
    '.ssssskyyyyyyyykssssss..',
    '..kkkkkkkkkkkkkkkkkkk...',
    '...kkkkk......kkkkkk....',
    '..ssssss......ssssss....'
  ]);

  /* 다크 모라이 (3장 설원 보스) */
  def('b_moray', {
    d: '#1e2a54', b: '#3a4a8a', e: '#ff4040', w: '#ffffff', k: '#0e1430'
  }, [
    '..........dddddd..........',
    '........dddddddddd........',
    '.......dddddddddddd.......',
    '......dddddddddddddd......',
    '.....dddeeedddddeeedd.....',
    '.....dddeeedddddeeedd.....',
    '.....dddddddddddddddd.....',
    '.....wwwwwwwwwwwwwwww.....',
    '.....wkwkwkwkwkwkwkww.....',
    '.....wwwwwwwwwwwwwwww.....',
    '......dddddddddddddd......',
    '....bbddddddddddddddbb....',
    '...bbbbdddddddddddbbbbb...',
    '..bbbbbbddddddddbbbbbbbb..',
    '.bbbbbbbbbbbbbbbbbbbbbbbb.',
    'kkbbbbbbbbbbbbbbbbbbbbbbkk',
    'kk......................kk'
  ]);

  /* 정글 뱀 (4장 보스) */
  def('b_serpent', {
    g: '#2a7a4a', d: '#17542f', e: '#ffd24d', w: '#ffffff', p: '#8ad04a'
  }, [
    '..........gggggg..........',
    '........gggggggggg........',
    '.......gggggggggggg.......',
    '......gggeeegggeeegg......',
    '......gggeeegggeeegg......',
    '......gggggggggggggg......',
    '......ggwwggggggwwgg......',
    '......gggggggggggggg......',
    '.......gggggggggggg.......',
    '........dddddddddd........',
    '......ppddddddddddpp......',
    '....ppppddddddddppppp.....',
    '..ppppppdddddddppppppp....',
    '.ggggppppdddddppppgggg....',
    'gggggggppppppppgggggggg...',
    'ddddddddgggggggddddddd....'
  ]);

  /* 오보이드 드라군 (6장 보스) */
  def('b_dragoon', {
    r: '#c03030', k: '#3a4058', s: '#98a0b8', y: '#ffd24d', e: '#ff6a3a', w: '#ffffff', g: '#5a6a8a'
  }, [
    '.............kkkkkkkk.............',
    '...........kkrrrrrrrrkk...........',
    '.........kkrrrrrrrrrrrrkk.........',
    '........krrrreeeeeerrrrrk.........',
    '........krrrreeeeeerrrrrk.........',
    '........krrrrrrrrrrrrrrrk.........',
    '........kkrrwwwwwwwwrrkk..........',
    '.........kkkkkkkkkkkkkk...........',
    '......sssskkkkkkkkkkkkssss........',
    '....ssssskyyyyyyyyyyyykssssss.....',
    '...sssssskyykkkkkkkyykssssssss....',
    '...ssssssskyyyyyyyyykssssssss.....',
    '...gggkkkkkkkkkkkkkkkkkkkggg......',
    '..ggg..kkkkkkkkkkkkkkkk..ggg......',
    '.ggg....kkkkk....kkkkk....ggg.....',
    'ggg....sssss......sssss....ggg....',
    '......ssssss......ssssss..........'
  ]);

  /* 녹스 (최종 보스, 1페이즈) */
  def('nox', {
    k: '#120c22', d: '#241640', p: '#5a2a8a', e: '#ff3a3a', y: '#ffd24d', w: '#ffffff'
  }, [
    '..........kkkkkkkkkkkk..........',
    '........kkkkkkkkkkkkkkkk........',
    '......kkkkkkkkkkkkkkkkkkkk......',
    '.....kkkkddddddddddddkkkkkk.....',
    '....kkkddddddddddddddddkkkkk....',
    '...kkkddddddddddddddddddkkkkk...',
    '...kkddddeeeddddddeeeddddkkkk...',
    '...kkdddeeeeedddeeeeedddkkkkk...',
    '...kkddddeeeddddddeeeddddkkkk...',
    '...kkdddddddddddddddddddkkkkk...',
    '...kkddddwwwwwwwwwwwwddddkkkk...',
    '...kkdddwkwkwkwkwkwkwdddkkkkk...',
    '...kkddddwwwwwwwwwwwwddddkkkk...',
    '....kkdddddddddddddddddkkkkk....',
    '....ppkkdddddddddddddkkkkpp.....',
    '...pppppkkkkdddddkkkkkppppp.....',
    '..ppppppppkkkkkkkkkppppppppp....',
    '.pppppppppppppppppppppppppppp...',
    'kppppppppppppppppppppppppppppk..',
    'kkppppppppppppppppppppppppppkk..'
  ]);

  /* 룩스 (각성한 코코) */
  def('lux', {
    w: '#ffffff', y: '#ffe9a8', c: '#a8e8ff', o: '#ffd24d', p: '#4fc3f7'
  }, [
    '..........wwwwww..........',
    '........wwyyyyyyww........',
    '.......wyyyyyyyyyyw.......',
    '......wyyyyyyyyyyyyw......',
    '.....wyyyyccyyccyyyyw.....',
    '.....wyyyyccyyccyyyyw.....',
    '.....wyyyyyyyyyyyyyyw.....',
    '.....wyyyyoooooooyyyw.....',
    '......wyyyyyyyyyyyyw......',
    'cc.....wwyyyyyyyyww.....cc',
    'ccc......wwwppwww......ccc',
    'cccc......wppppw......cccc',
    '.cccc.....wppppw.....cccc.',
    '..cccc....wwppww....cccc..',
    '...ccc.....wwww.....ccc...',
    '....cc..............cc....'
  ]);

  /* ================= 지형 장식 ================= */
  def('tree', { g: '#2a6a3a', d: '#1c4a28', t: '#5a3a20', k: '#3a2414' }, [
    '.....gggggg.....',
    '...gggggggggg...',
    '..gggggddggggg..',
    '.ggggggddgggggg.',
    'ggggggddddgggggg',
    'gggggddddddggggg',
    '.gggggddddggggg.',
    '..ggggggggggg...',
    '...ggggggggg....',
    '.....ttttt......',
    '.....tkkt.......',
    '.....tkkt.......',
    '.....tkkt.......',
    '....kttttk......',
    '................',
    '................'
  ]);

  def('sign', { w: '#e0d0a0', d: '#7a5a30', k: '#3a2a14' }, [
    '................',
    '..wwwwwwwwwwww..',
    '..wkkkkkkkkkkw..',
    '..wkwwwwwwwwkw..',
    '..wkwkkkwkkwkw..',
    '..wkwwwwwwwwkw..',
    '..wkkkkkkkkkkw..',
    '..wwwwwwwwwwww..',
    '.....dddddd.....',
    '.....dddddd.....',
    '.....dddddd.....',
    '.....dddddd.....',
    '....kdddddk.....',
    '................',
    '................',
    '................'
  ]);

  def('pedestal', { s: '#9a9ab0', d: '#6a6a80', w: '#e8e8f0', k: '#3a3a4a' }, [
    '................',
    '................',
    '.....wwwwww.....',
    '....wssssssw....',
    '....wssssssw....',
    '....dssssssd....',
    '....dssssssd....',
    '...ddssssssdd...',
    '..dddssssssddd..',
    '..ddddddddddd d.',
    '.kdddddddddddddk',
    '.kdddddddddddddk',
    '.kkkkkkkkkkkkkkk',
    '................',
    '................',
    '................'
  ]);

  UT.spriteDefs = { def, shifted };
})(window.UT);
