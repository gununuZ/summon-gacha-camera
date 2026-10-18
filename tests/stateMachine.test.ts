import { describe, expect, it } from 'vitest';
import { timing } from '../src/config/gacha';
import type { DrawResult } from '../src/logic/gacha';
import { createState, progress, tap, update } from '../src/logic/stateMachine';

const r = (omen: DrawResult['omen']): DrawResult => ({ rarity: 'R', effect: 'glow', omen });

describe('stateMachine', () => {
  it('IDLE でタップすると CHARGE になり予告色を保持する', () => {
    const s = tap(createState(), 100, r('gold'));
    expect(s.phase).toBe('CHARGE');
    expect(s.result?.omen).toBe('gold');
  });

  it('溜め・発動中のタップは無視される', () => {
    const charging = tap(createState(), 0, r('blue'));
    expect(tap(charging, 500, r('rainbow'))).toBe(charging);
    const reveal = update(charging, timing.chargeMs);
    expect(tap(reveal, timing.chargeMs + 10, r('rainbow'))).toBe(reveal);
  });

  it('時間経過で CHARGE → REVEAL → RESULT に自動遷移する', () => {
    let s = tap(createState(), 0, r('blue'));
    s = update(s, timing.chargeMs - 1);
    expect(s.phase).toBe('CHARGE');
    s = update(s, timing.chargeMs);
    expect(s.phase).toBe('REVEAL');
    s = update(s, timing.chargeMs + timing.revealMs);
    expect(s.phase).toBe('RESULT');
  });

  it('RESULT でタップすると IDLE に戻り、予告色は消える', () => {
    let s = tap(createState(), 0, r('blue'));
    s = update(update(s, timing.chargeMs), timing.chargeMs + timing.revealMs);
    s = tap(s, 9999, r('gold'));
    expect(s.phase).toBe('IDLE');
    expect(s.result).toBeNull();
  });

  it('progress は 0..1 に収まる', () => {
    const s = tap(createState(), 0, r('blue'));
    expect(progress(s, 0)).toBe(0);
    expect(progress(s, timing.chargeMs / 2)).toBeCloseTo(0.5);
    expect(progress(s, timing.chargeMs * 10)).toBe(1);
  });
});
