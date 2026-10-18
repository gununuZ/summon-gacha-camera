import { describe, expect, it } from 'vitest';
import { maskAlpha } from '../src/logic/mask';

describe('maskAlpha', () => {
  it('low 以下は透明、high 以上は不透明', () => {
    expect(maskAlpha(0, 0.35, 0.65)).toBe(0);
    expect(maskAlpha(0.35, 0.35, 0.65)).toBe(0);
    expect(maskAlpha(0.65, 0.35, 0.65)).toBe(255);
    expect(maskAlpha(1, 0.35, 0.65)).toBe(255);
  });
  it('中間は滑らかに増える(中央で約半分、単調増加)', () => {
    expect(maskAlpha(0.5, 0.35, 0.65)).toBeGreaterThan(120);
    expect(maskAlpha(0.5, 0.35, 0.65)).toBeLessThan(135);
    let prev = -1;
    for (let p = 0; p <= 1; p += 0.05) {
      const a = maskAlpha(p, 0.35, 0.65);
      expect(a).toBeGreaterThanOrEqual(prev);
      prev = a;
    }
  });
});
