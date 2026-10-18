import { describe, expect, it } from 'vitest';
import { debugEntries } from '../src/debug/entries';
import { effectFactories } from '../src/render/effects';

describe('debugEntries', () => {
  it('実装済みの演出がすべてボタンになる(重複なし)', () => {
    const ids = debugEntries().map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.sort()).toEqual(Object.keys(effectFactories).sort());
  });
  it('見出しはレアリティ順(隠しは最後)', () => {
    const groups = [...new Set(debugEntries().map((e) => e.group))];
    expect(groups).toEqual(['SSR', 'SR', 'R', 'ハズレ', '隠し']);
  });
});
