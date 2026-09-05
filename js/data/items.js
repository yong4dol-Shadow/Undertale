/* =========================================================
   data/items.js - 아이템 / 장비
   ========================================================= */
(function (UT) {
  'use strict';

  const DB = {
    /* ---- 회복 아이템 ---- */
    choco:    { name: '초콜릿',        heal: 10, sprite: 'choco',    text: '* 초콜릿을 먹었다. HP 10 회복!',              desc: '코코가 세상에서 제일 좋아하는 것.' },
    icecream: { name: '아이스크림',    heal: 15, sprite: 'icecream', text: '* 아이스크림을 먹었다. HP 15 회복!',          desc: '미르카 해변의 명물. 녹기 전에 먹자.' },
    sundae:   { name: '초코 선데이',   heal: 25, sprite: 'icecream', text: '* 초코 선데이를 먹었다. HP 25 회복!',         desc: '코코가 “이건 내 거야!“ 라고 우겼다.' },
    stew:     { name: '설원 수프',     heal: 22, sprite: 'choco',    text: '* 설원 수프를 마셨다. HP 22 회복!',           desc: '얼어붙은 몸까지 녹인다.' },
    noodle:   { name: '협곡 국수',     heal: 20, sprite: 'choco',    text: '* 협곡 국수를 후루룩. HP 20 회복!',           desc: '면이 길어서 아직도 먹는 중이다.' },
    kebab:    { name: '사막 꼬치',     heal: 18, sprite: 'choco',    text: '* 사막 꼬치를 먹었다. HP 18 회복!',           desc: '모래 한 알도 씹히지 않는다. 장인의 솜씨.' },
    pie:      { name: '바질의 파이',   heal: 40, sprite: 'choco',    text: '* 파이를 먹었다. HP 40 회복!',                desc: '박사가 연구보다 공들여 구웠다.' },
    starcandy:{ name: '별사탕',        heal: 12, sprite: 'gem',      text: '* 별사탕을 깨물었다. HP 12 회복!',            desc: '입 안에서 아주 작은 별이 터진다.' },
    lastchoco:{ name: '마지막 초콜릿', heal: 99, sprite: 'choco',    text: '* ...코코의 몫이었던 초콜릿. HP 전부 회복!',  desc: '누군가 “나중에 같이 먹자“ 며 남겨 두었다.' },

    /* ---- 무기 ---- */
    sneakers:  { name: '달리기 신발',   equip: 'weapon', atk: 0,  desc: '너덜너덜하지만, 아직 세상에서 가장 빠르다.' },
    shadowclaw:{ name: '그림자 발톱',   equip: 'weapon', atk: 6,  desc: '밤의 형상과 함께 자라난 손톱. 네 것이면서 네 것이 아니다.' },
    prismedge: { name: '프리즘 칼날',   equip: 'weapon', atk: 12, desc: '빛을 되찾은 원석의 조각. 어둠만을 벤다.' },

    /* ---- 방어구 ---- */
    scarf:     { name: '낡은 목도리',   equip: 'armor', def: 0,  desc: '떨어져도 목에서 풀리지 않았다.' },
    gaiaband:  { name: '가이아 완장',   equip: 'armor', def: 6,  desc: '신전의 수호자가 차던 것. 밤에 미지근하게 따뜻하다.' },
    cocopendant:{name: '코코의 펜던트', equip: 'armor', def: 12, desc: '“이거 차고 있으면, 내가 옆에 있는 거야.“' }
  };

  const I = {
    db: DB,
    get: (id) => DB[id] || null,
    name: (id) => (DB[id] ? DB[id].name : '???'),

    /** 소지품에 추가. 8칸 제한 */
    add(id) {
      const inv = UT.game.data.items;
      if (inv.length >= 8) return false;
      inv.push(id);
      return true;
    },

    removeAt(i) { UT.game.data.items.splice(i, 1); },

    /** 사용 -> 결과 텍스트 반환 */
    useAt(i) {
      const d = UT.game.data;
      const id = d.items[i];
      const it = DB[id];
      if (!it) return '* 아무 일도 일어나지 않았다.';
      if (it.equip) {
        const slot = it.equip;
        const old = d[slot];
        d[slot] = id;
        d.items.splice(i, 1);
        if (old && DB[old]) d.items.push(old);
        return '* ' + it.name + UT.util.josa(it.name, '을') + ' 장착했다.';
      }
      d.items.splice(i, 1);
      const before = d.hp;
      UT.game.heal(it.heal || 0);
      const gained = d.hp - before;
      if (gained <= 0 && d.hp >= d.maxhp) return '* ' + it.name + UT.util.josa(it.name, '을') + ' 먹었다. HP가 가득 찼다!';
      return it.text;
    }
  };

  UT.items = I;
})(window.UT);
