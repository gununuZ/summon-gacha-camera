import { describe, expect, it } from 'vitest';
import { analyzeSilhouette, syntheticSilhouette } from '../src/logic/silhouette';

// 10x10 の中央 6x6 を人物にしたマスク
function blob(): Uint8Array {
  const a = new Uint8Array(100);
  for (let y = 2; y < 8; y++) for (let x = 2; x < 8; x++) a[y * 10 + x] = 255;
  return a;
}

describe('analyzeSilhouette', () => {
  it('輪郭は外周のセルだけ(内側は含まない)', () => {
    const r = analyzeSilhouette(blob(), 10, 10);
    expect(r.edge.length).toBe(20); // 6x6 の外周 = 36 - 16
    expect(r.edge.some((p) => p.x > 0.35 && p.x < 0.65 && p.y > 0.35 && p.y < 0.65)).toBe(false);
  });
  it('外接矩形と頭頂が求まる', () => {
    const r = analyzeSilhouette(blob(), 10, 10);
    expect(r.box).toEqual({ x0: 0.2, y0: 0.2, x1: 0.8, y1: 0.8 });
    expect(r.headTop!.y).toBeCloseTo(0.2);
    expect(r.headTop!.x).toBeCloseTo(0.5);
  });
  it('人物がいなければ空', () => {
    const r = analyzeSilhouette(new Uint8Array(100), 10, 10);
    expect(r.edge).toEqual([]);
    expect(r.box).toBeNull();
    expect(r.headTop).toBeNull();
  });
  it('画面の端に接する側は輪郭にしない', () => {
    const a = new Uint8Array(100);
    for (let y = 5; y < 10; y++) for (let x = 2; x < 8; x++) a[y * 10 + x] = 255; // 下端まで届く
    const r = analyzeSilhouette(a, 10, 10);
    expect(r.edge.some((p) => p.y > 0.95)).toBe(false);
  });
});

describe('syntheticSilhouette', () => {
  it('点が 0..1 に収まる', () => {
    for (const p of syntheticSilhouette().edge) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(1);
    }
  });
});
