// 乱数源。テスト・再現用にシード付きを差し替えられるようにする
export type Rng = () => number; // [0,1)

export const defaultRng: Rng = Math.random;

// mulberry32: 小さく高速なシード付き乱数
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
