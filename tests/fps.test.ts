import { describe, expect, it } from 'vitest';
import { FpsCounter } from '../src/logic/fps';

describe('FpsCounter', () => {
  it('1秒窓内のフレーム数を返す', () => {
    const c = new FpsCounter(1000);
    let last = 0;
    for (let t = 0; t < 1000; t += 100) last = c.tick(t);
    expect(last).toBe(10);
  });
  it('窓より古いフレームは数えない', () => {
    const c = new FpsCounter(1000);
    c.tick(0);
    expect(c.tick(2000)).toBe(1);
  });
});
