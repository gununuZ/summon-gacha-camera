import type { Omen } from '../config/gacha';
import { debugEntries } from './entries';

// デバッグパネル(?debug=1 のときだけ出る)。演出をボタンのタップで直接再生できる。
// canvas の外(DOM)に置くので、ここでのタップが通常のガチャ開始には影響しない
export interface DebugPanelHandlers {
  onPickEffect(effectId: string): void; // 演出ボタン: その演出を今すぐ再生
  onOmen(omen: Omen | null): void; // 予告色の固定(null=自動)
}

const OMENS: { v: Omen | null; label: string }[] = [
  { v: null, label: '自動' },
  { v: 'blue', label: '青' },
  { v: 'gold', label: '金' },
  { v: 'rainbow', label: '虹' },
];

export function mountDebugPanel(h: DebugPanelHandlers): void {
  const css = (el: HTMLElement, s: Partial<CSSStyleDeclaration>): void => void Object.assign(el.style, s);
  const stop = (el: HTMLElement): void => {
    for (const ev of ['pointerdown', 'pointerup', 'click']) el.addEventListener(ev, (e) => e.stopPropagation());
  };

  const toggle = document.createElement('button');
  toggle.textContent = '⚙';
  css(toggle, {
    position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 8px)', right: '8px', width: '44px', height: '44px',
    fontSize: '22px', borderRadius: '22px', border: '1px solid #fff6', background: '#000a', color: '#fff', zIndex: '20',
  });

  const panel = document.createElement('div');
  css(panel, {
    position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 58px)', right: '8px', width: '168px',
    maxHeight: '75dvh', overflowY: 'auto', padding: '8px', borderRadius: '10px', background: '#000c',
    color: '#fff', font: '13px sans-serif', zIndex: '20', display: 'none',
  });

  const heading = (text: string): HTMLElement => {
    const d = document.createElement('div');
    d.textContent = text;
    css(d, { margin: '8px 0 4px', opacity: '0.7', fontSize: '11px' });
    return d;
  };
  const button = (text: string, onClick: () => void): HTMLButtonElement => {
    const b = document.createElement('button');
    b.textContent = text;
    css(b, {
      display: 'block', width: '100%', minHeight: '38px', margin: '3px 0', padding: '4px 6px', textAlign: 'left',
      border: '1px solid #fff4', borderRadius: '8px', background: '#222', color: '#fff', fontSize: '13px',
    });
    b.addEventListener('click', onClick);
    return b;
  };

  // 予告色の固定(選択中は枠を光らせる)
  panel.append(heading('予告色'));
  const row = document.createElement('div');
  css(row, { display: 'flex', gap: '4px' });
  const omenBtns = OMENS.map(({ v, label }) => {
    const b = button(label, () => {
      h.onOmen(v);
      omenBtns.forEach((x) => css(x, { borderColor: '#fff4' }));
      css(b, { borderColor: '#ffd24a' });
    });
    css(b, { textAlign: 'center', padding: '4px 0' });
    row.append(b);
    return b;
  });
  css(omenBtns[0], { borderColor: '#ffd24a' });
  panel.append(row);

  // 演出ボタン(設定から自動生成)
  let lastGroup = '';
  for (const e of debugEntries()) {
    if (e.group !== lastGroup) {
      panel.append(heading(e.group));
      lastGroup = e.group;
    }
    panel.append(button(e.label, () => h.onPickEffect(e.id)));
  }

  toggle.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });
  stop(toggle);
  stop(panel);
  document.body.append(toggle, panel);
}
