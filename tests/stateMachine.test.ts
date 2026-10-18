import { describe, expect, it } from 'vitest';
import { timing } from '../src/config/gacha';
import { createState, progress, tap, update } from '../src/logic/stateMachine';

describe('stateMachine', () => {
  it('IDLE でタップすると CHARGE になり予告色を保持する', () => {
    const s = tap(createState(), 100, 'gold');
    expect(s.phase).toBe('CHARGE');
    expect(s.omen).toBe('gold');
  });

  it('溜め・発動中のタップは無視される', () => {
    const charging = tap(createState(), 0, 'blue');
    expect(tap(charging, 500, 'rainbow')).toBe(charging);
    const reveal = update(charging, timing.chargeMs);
    expect(tap(reveal, timing.chargeMs + 10, 'rainbow')).toBe(reveal);
  });

  it('時間経過で CHARGE → REVEAL → RESULT に自動遷移する', () => {
    let s = tap(createState(), 0, 'blue');
    s = update(s, timing.chargeMs - 1);
    expect(s.phase).toBe('CHARGE');
    s = update(s, timing.chargeMs);
    expect(s.phase).toBe('REVEAL');
    s = update(s, timing.chargeMs + timing.revealMs);
    expect(s.phase).toBe('RESULT');
  });

  it('RESULT でタップすると IDLE に戻り、予告色は消える', () => {
    let s = tap(createState(), 0, 'blue');
    s = update(update(s, timing.chargeMs), timing.chargeMs + timing.revealMs);
    s = tap(s, 9999, 'gold');
    expect(s.phase).toBe('IDLE');
    expect(s.omen).toBeNull();
  });

  it('progress は 0..1 に収まる', () => {
    const s = tap(createState(), 0, 'blue');
    expect(progress(s, 0)).toBe(0);
    expect(progress(s, timing.chargeMs / 2)).toBeCloseTo(0.5);
    expect(progress(s, timing.chargeMs * 10)).toBe(1);
  });
});
