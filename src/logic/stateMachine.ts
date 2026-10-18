import type { Omen } from '../config/gacha';
import { timing } from '../config/gacha';

// 待機 → 溜め → 発動 → 結果 → 待機。DOM/Canvas に依存しない純粋ロジック
export type Phase = 'IDLE' | 'CHARGE' | 'REVEAL' | 'RESULT';

export interface GachaState {
  readonly phase: Phase;
  readonly startedAtMs: number;
  readonly omen: Omen | null;
}

export function createState(): GachaState {
  return { phase: 'IDLE', startedAtMs: 0, omen: null };
}

// タップ: IDLE のときだけ溜めを開始(抽選済みの予告色を受け取る)。
// RESULT のときは待機へ戻る。溜め・発動中のタップは無視する
export function tap(s: GachaState, nowMs: number, omen: Omen): GachaState {
  if (s.phase === 'IDLE') return { phase: 'CHARGE', startedAtMs: nowMs, omen };
  if (s.phase === 'RESULT') return { phase: 'IDLE', startedAtMs: nowMs, omen: null };
  return s;
}

// 時間経過による自動遷移
export function update(s: GachaState, nowMs: number): GachaState {
  const elapsed = nowMs - s.startedAtMs;
  if (s.phase === 'CHARGE' && elapsed >= timing.chargeMs) {
    return { ...s, phase: 'REVEAL', startedAtMs: s.startedAtMs + timing.chargeMs };
  }
  if (s.phase === 'REVEAL' && elapsed >= timing.revealMs) {
    return { ...s, phase: 'RESULT', startedAtMs: s.startedAtMs + timing.revealMs };
  }
  return s;
}

// 現フェーズの進行度 0..1(CHARGE/REVEAL のみ意味を持つ)
export function progress(s: GachaState, nowMs: number): number {
  const dur = s.phase === 'CHARGE' ? timing.chargeMs : s.phase === 'REVEAL' ? timing.revealMs : 0;
  if (dur === 0) return 0;
  return Math.min(1, Math.max(0, (nowMs - s.startedAtMs) / dur));
}
