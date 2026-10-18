import { describe, expect, it } from 'vitest';
import { timing } from '../src/config/gacha';
import type { DrawResult } from '../src/logic/gacha';
import { applyPose, createState, progress, tap, update } from '../src/logic/stateMachine';

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

describe('applyPose', () => {
  it('溜め中にポーズが成立すると結果が隠し結果に上書きされる', () => {
    const s = applyPose(tap(createState(), 0, r('blue')), 'chant');
    expect(s.hidden).toBe('chant');
    expect(s.result).toMatchObject({ effect: 'true_summon', rarity: 'SSR', omen: 'rainbow' });
  });
  it('腕クロスは隠しハズレになる', () => {
    const s = applyPose(tap(createState(), 0, r('gold')), 'cross');
    expect(s.result).toMatchObject({ effect: 'pigeon_swarm', rarity: 'MISS' });
  });
  it('1回の溜めでは最初のポーズだけが有効(後から上書きしない)', () => {
    const s1 = applyPose(tap(createState(), 0, r('blue')), 'chant');
    expect(applyPose(s1, 'cross')).toBe(s1);
  });
  it('溜め以外(待機・発動中)では何も起きない', () => {
    const idle = createState();
    expect(applyPose(idle, 'chant')).toBe(idle);
    const reveal = update(tap(createState(), 0, r('blue')), timing.chargeMs);
    expect(applyPose(reveal, 'chant')).toBe(reveal);
  });
  it('次の召喚では hidden がリセットされる', () => {
    let s = applyPose(tap(createState(), 0, r('blue')), 'chant');
    s = update(update(s, timing.chargeMs), timing.chargeMs + timing.revealMs);
    s = tap(tap(s, 9000, r('blue')), 9100, r('blue'));
    expect(s.hidden).toBeNull();
  });
});
