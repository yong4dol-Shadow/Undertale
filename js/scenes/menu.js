/* =========================================================
   scenes/menu.js - 필드 메뉴 (물품 / 스탯 / 설정)
   ========================================================= */
(function (UT) {
  'use strict';
  const U = UT.util;

  function menu() {
    let tab = 0;          // 0 물품 1 스탯 2 설정
    let sel = 0;
    let itemSel = 0;
    let sub = null;       // 'item'
    let msg = null;
    const TABS = ['물품', '스탯', '설정'];

    return {
      drawBelow: true,
      enter() { UT.audio.sfx('select'); sel = 0; sub = null; msg = null; },

      update(dt) {
        if (msg) {
          msg.update(dt, UT.game.ctx);
          if (msg.done) msg = null;
          return;
        }
        if (sub === 'item') {
          const inv = UT.game.data.items;
          const n = Math.max(1, inv.length);
          if (UT.input.pressed('up')) { itemSel = (itemSel + n - 1) % n; UT.audio.sfx('blip2'); }
          if (UT.input.pressed('down')) { itemSel = (itemSel + 1) % n; UT.audio.sfx('blip2'); }
          if (UT.input.pressed('cancel')) { sub = null; UT.audio.sfx('cancel'); }
          if (UT.input.pressed('confirm') && inv.length) {
            const txt = UT.items.useAt(itemSel);
            itemSel = Math.min(itemSel, Math.max(0, UT.game.data.items.length - 1));
            msg = UT.dialog.create([{ text: txt }]);
          }
          return;
        }
        if (UT.input.pressed('up')) { sel = (sel + 2) % 3; UT.audio.sfx('blip2'); }
        if (UT.input.pressed('down')) { sel = (sel + 1) % 3; UT.audio.sfx('blip2'); }
        if (UT.input.pressed('confirm')) {
          UT.audio.sfx('select');
          if (sel === 0) { sub = 'item'; itemSel = 0; }
          else if (sel === 1) tab = 1;
          else tab = 2;
        }
        if (UT.input.pressed('cancel') || UT.input.pressed('menu')) {
          UT.audio.sfx('cancel');
          UT.game.pop();
        }
      },

      draw(ctx) {
        const d = UT.game.data;
        /* 왼쪽 정보 패널 */
        U.frame(ctx, 20, 20, 250, 210);
        ctx.save();
        ctx.font = U.font(20);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(d.name, 44, 44);
        ctx.fillText('LV  ' + d.lv, 44, 76);
        ctx.fillText('HP  ' + d.hp + ' / ' + d.maxhp, 44, 104);
        ctx.fillText('G   ' + d.gold, 44, 132);
        ctx.fillText('조각 ' + (d.flags.shards || 0) + ' / 7', 44, 160);
        ctx.fillStyle = d.form === 'night' ? '#b46bff' : '#ffe14d';
        ctx.fillText(d.form === 'night' ? '밤의 형상' : '낮의 형상', 44, 192);
        ctx.restore();

        /* 메뉴 */
        U.frame(ctx, 20, 246, 250, 180);
        ctx.save();
        ctx.font = U.font(22);
        ['물품', '스탯', '설정'].forEach((tname, i) => {
          const y = 276 + i * 46;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(tname, 84, y);
          if (sel === i && !sub) UT.sprite.draw(ctx, UT.sprites.heart, 50, y + 4, { center: false });
        });
        ctx.restore();

        /* 오른쪽 패널 */
        if (sub === 'item') {
          U.frame(ctx, 292, 20, 328, 406);
          ctx.save();
          ctx.font = U.font(20);
          const inv = d.items;
          if (!inv.length) {
            ctx.fillStyle = '#8a8a8a';
            ctx.fillText('(비어 있음)', 330, 52);
          }
          inv.forEach((id, i) => {
            const y = 52 + i * 34;
            ctx.fillStyle = i === itemSel ? '#ffe14d' : '#ffffff';
            ctx.fillText(UT.items.name(id), 340, y);
            if (i === itemSel) UT.sprite.draw(ctx, UT.sprites.heart, 310, y + 4, { center: false });
          });
          if (inv.length) {
            const it = UT.items.get(inv[Math.min(itemSel, inv.length - 1)]);
            ctx.font = U.font(16);
            ctx.fillStyle = '#a0a0a0';
            U.wrap(ctx, it.desc || '', 280).forEach((l, i) => ctx.fillText(l, 312, 340 + i * 22));
            ctx.fillStyle = '#ffe14d';
            ctx.fillText(it.equip ? 'Z: 장착' : 'Z: 사용', 312, 396);
          }
          ctx.restore();
        } else if (sel === 1) {
          U.frame(ctx, 292, 20, 328, 406);
          ctx.save();
          ctx.font = U.font(19);
          ctx.fillStyle = '#ffffff';
          const w = UT.items.get(d.weapon), a = UT.items.get(d.armor);
          const lines = [
            '"' + d.name + '"',
            '',
            'LV   ' + d.lv,
            'HP   ' + d.hp + ' / ' + d.maxhp,
            'EXP  ' + d.exp,
            'NEXT ' + UT.game.expToNext(),
            '',
            'AT   ' + UT.game.atkTotal + '  (' + (w ? w.name : '-') + ')',
            'DF   ' + UT.game.defTotal + '  (' + (a ? a.name : '-') + ')',
            '',
            '쓰러뜨린 수  ' + d.kills,
            '봐준 수      ' + d.spared,
            '되돌린 조각  ' + (d.flags.shards || 0) + ' / 7',
            '',
            '플레이 시간  ' + fmtTime(d.playtime)
          ];
          lines.forEach((l, i) => ctx.fillText(l, 316, 48 + i * 24));
          ctx.restore();
        } else if (sel === 2) {
          U.frame(ctx, 292, 20, 328, 406);
          ctx.save();
          ctx.font = U.font(18);
          ctx.fillStyle = '#ffffff';
          const lines = [
            '조작',
            '  방향키 / WASD : 이동',
            '  Z / Enter : 확인',
            '  X / Shift : 취소 · 천천히',
            '  C : 이 메뉴',
            '  M : 음소거    F : 전체화면',
            '',
            '전투',
            '  FIGHT 공격 — 막대가 가운데일 때 Z',
            '  ACT 행동 — 싸우지 않는 길',
            '  ITEM 물품 — 회복',
            '  MERCY 자비 — 노랗게 빛나면 봐줄 수 있다',
            '',
            '파랑 탄환은 움직이면 아프다.',
            '주황 탄환은 멈추면 아프다.',
            '',
            '밤의 형상: 느리지만 단단하고, 3연격.'
          ];
          lines.forEach((l, i) => ctx.fillText(l, 312, 46 + i * 22));
          ctx.restore();
        }

        if (msg) msg.draw(ctx);
      }
    };
  }

  function fmtTime(sec) {
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + '분 ' + (s < 10 ? '0' : '') + s + '초';
  }

  UT.scenes = UT.scenes || {};
  UT.scenes.menu = menu;
})(window.UT);
