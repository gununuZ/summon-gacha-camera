import { describe, expect, it } from 'vitest';
import { effectNames, rarities } from '../src/config/gacha';
import { draw, simulate, validateTable } from '../src/logic/gacha';
import { seededRng } from '../src/logic/rng';

const N = 200_000;
const sim = simulate(N, seededRng(12345));

describe('排出テーブルの設定', () => {
  it('確率の合計が正しい', () => {
    expect(validateTable(rarities)).toEqual([]);
  });
  it('壊れた設定を検出できる', () => {
    const bad = rarities.map((e) => ({ ...e }));
    bad[0] = { ...bad[0], rate: 0.5 };
    expect(validateTable(bad).length).toBeGreaterThan(0);
  });
  it('すべての演出IDに表示名がある', () => {
    for (const e of rarities) for (const id of e.effects) expect(effectNames[id]).toBeTruthy();
  });
});

describe('レアリティの排出率(20万回)', () => {
  for (const e of rarities) {
    it(`${e.id} が約 ${e.rate * 100}%`, () => {
      expect(sim.rarity[e.id] / N).toBeCloseTo(e.rate, 2); // ±0.005
    });
  }
});

describe('予告色の条件付き確率', () => {
  for (const e of rarities) {
    for (const omen of ['blue', 'gold', 'rainbow'] as const) {
      it(`${e.id} のとき ${omen} が約 ${e.omen[omen] * 100}%`, () => {
        const count = sim.rarity[e.id];
        expect(sim.omenByRarity[e.id][omen] / count).toBeCloseTo(e.omen[omen], 1); // ±0.05
      });
    }
  }
  it('ハズレにも虹予告(フェイク)が出る', () => {
    expect(sim.omenByRarity.MISS.rainbow).toBeGreaterThan(0);
  });
});

describe('抽選の性質', () => {
  it('演出は結果のレアリティに属する', () => {
    const rng = seededRng(1);
    for (let i = 0; i < 2000; i++) {
      const d = draw(rng);
      expect(rarities.find((e) => e.id === d.rarity)!.effects).toContain(d.effect);
    }
  });
  it('同じシードなら同じ結果(再現性)', () => {
    expect(draw(seededRng(7))).toEqual(draw(seededRng(7)));
  });
  it('強制指定が効く', () => {
    const d = draw(seededRng(1), { forceRarity: 'SSR', forceOmen: 'blue' });
    expect(d.rarity).toBe('SSR');
    expect(d.omen).toBe('blue');
  });
  it('ハズレの演出は5種すべて出る', () => {
    const rng = seededRng(3);
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const d = draw(rng, { forceRarity: 'MISS' });
      seen.add(d.effect);
    }
    expect(seen.size).toBe(5);
  });
});
