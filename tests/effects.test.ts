import { describe, expect, it } from 'vitest';
import { hiddenResults, rarities } from '../src/config/gacha';
import { effectFactories } from '../src/render/effects';

describe('演出の登録', () => {
  it('設定にあるすべての演出IDに実装がある', () => {
    const ids = [...rarities.flatMap((r) => r.effects), ...Object.values(hiddenResults).map((h) => h.effect)];
    for (const id of ids) expect(effectFactories[id], id).toBeTypeOf('function');
  });
  it('どの演出も back か front を持つ', () => {
    for (const [id, make] of Object.entries(effectFactories)) {
      const e = make();
      expect(Boolean(e.back || e.front), id).toBe(true);
    }
  });
});
