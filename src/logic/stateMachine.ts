import { hiddenResults, timing } from '../config/gacha';
import type { DrawResult } from './gacha';
import type { PoseId } from './pose';

// 待機 → 溜め → 発動 → 結果 → 待機。DOM/Canvas に依存しない純粋ロジック
export type Phase = 'IDLE' | 'CHARGE' | 'REVEAL' | 'RESULT';

export interface GachaState {
  readonly phase: Phase;
  readonly startedAtMs: number;
  readonly result: DrawResult | null; // タップ時に抽選済みの結果
  readonly hidden: PoseId | null; // 隠しポーズが成立していればそのID
}

export function createState(): GachaState {
  return { phase: 'IDLE', startedAtMs: 0, result: null, hidden: null };
}

// タップ: IDLE のときだけ溜めを開始(抽選済みの結果を受け取る)。
// RESULT のときは待機へ戻る。溜め・発動中のタップは無視する
export function tap(s: GachaState, nowMs: number, result: DrawResult): GachaState {
  if (s.phase === 'IDLE') return { phase: 'CHARGE', startedAtMs: nowMs, result, hidden: null };
  if (s.phase === 'RESULT') return { phase: 'IDLE', startedAtMs: nowMs, result: null, hidden: null };
  return s;
}

// 隠しポーズ成立: 溜め中だけ、抽選結果を隠し結果で上書きする(1回の溜めで1度だけ)
export function applyPose(s: GachaState, pose: PoseId): GachaState {
  if (s.phase !== 'CHARGE' || s.hidden !== null) return s;
  return { ...s, hidden: pose, result: hiddenResults[pose] };
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
