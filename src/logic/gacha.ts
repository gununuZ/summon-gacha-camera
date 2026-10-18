import type { Omen, Rarity, RarityEntry } from '../config/gacha';
import { rarities as defaultTable } from '../config/gacha';
import type { Rng } from './rng';

export interface DrawResult {
  rarity: Rarity;
  effect: string;
  omen: Omen;
}

export interface DrawOptions {
  table?: RarityEntry[];
  forceRarity?: Rarity; // デバッグ: 結果を強制
  forceOmen?: Omen; // デバッグ: 予告色を強制
}

// 重みつき選択。entries の値は合計1でなくてもよい
function pick<T extends string>(rng: Rng, weights: Record<T, number>): T {
  const keys = Object.keys(weights) as T[];
  const total = keys.reduce((s, k) => s + weights[k], 0);
  let r = rng() * total;
  for (const k of keys) {
    r -= weights[k];
    if (r < 0) return k;
  }
  return keys[keys.length - 1];
}

export function draw(rng: Rng, opts: DrawOptions = {}): DrawResult {
  const table = opts.table ?? defaultTable;
  const rate = Object.fromEntries(table.map((e) => [e.id, e.rate])) as Record<Rarity, number>;
  const rarity = opts.forceRarity ?? pick(rng, rate);
  const entry = table.find((e) => e.id === rarity)!;
  const omen = opts.forceOmen ?? pick(rng, entry.omen);
  const effect = entry.effects[Math.floor(rng() * entry.effects.length)];
  return { rarity, effect, omen };
}

// 設定の検証。確率の合計が1でない等のミスを検出する
export function validateTable(table: RarityEntry[]): string[] {
  const errors: string[] = [];
  const near1 = (x: number) => Math.abs(x - 1) < 1e-9;
  if (!near1(table.reduce((s, e) => s + e.rate, 0))) errors.push('rate の合計が 1 ではない');
  for (const e of table) {
    if (!near1(e.omen.blue + e.omen.gold + e.omen.rainbow)) errors.push(`${e.id}: omen の合計が 1 ではない`);
    if (e.effects.length === 0) errors.push(`${e.id}: effects が空`);
  }
  return errors;
}

// n 回シミュレーション(デバッグ表示用)
export interface SimSummary {
  n: number;
  rarity: Record<Rarity, number>;
  omen: Record<Omen, number>;
  omenByRarity: Record<Rarity, Record<Omen, number>>;
}

export function simulate(n: number, rng: Rng, table?: RarityEntry[]): SimSummary {
  const zeroOmen = (): Record<Omen, number> => ({ blue: 0, gold: 0, rainbow: 0 });
  const s: SimSummary = {
    n,
    rarity: { SSR: 0, SR: 0, R: 0, MISS: 0 },
    omen: zeroOmen(),
    omenByRarity: { SSR: zeroOmen(), SR: zeroOmen(), R: zeroOmen(), MISS: zeroOmen() },
  };
  for (let i = 0; i < n; i++) {
    const d = draw(rng, { table });
    s.rarity[d.rarity]++;
    s.omen[d.omen]++;
    s.omenByRarity[d.rarity][d.omen]++;
  }
  return s;
}
