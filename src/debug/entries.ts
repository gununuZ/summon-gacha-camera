import type { Rarity } from '../config/gacha';
import { effectNames, hiddenResults, rarities } from '../config/gacha';

// デバッグパネルに並べる演出ボタンの一覧(DOM非依存)。設定から自動生成するので、演出を足してもここは変えない
export interface DebugEntry {
  group: string; // 見出し(SSR / SR / R / ハズレ / 隠し)
  rarity: Rarity;
  id: string; // 演出ID
  label: string;
}

export function debugEntries(): DebugEntry[] {
  const normal = rarities.flatMap((r) =>
    r.effects.map((id) => ({ group: r.label, rarity: r.id, id, label: effectNames[id] ?? id })),
  );
  const hidden = Object.values(hiddenResults).map((h) => ({
    group: '隠し', rarity: h.rarity, id: h.effect, label: effectNames[h.effect] ?? h.effect,
  }));
  return [...normal, ...hidden];
}
