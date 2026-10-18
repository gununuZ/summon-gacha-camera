import { effectNames, omenStyle, rarities } from '../config/gacha';
import type { DrawResult } from '../logic/gacha';
import type { PoseId } from '../logic/pose';
import type { Phase } from '../logic/stateMachine';

function centerText(ctx: CanvasRenderingContext2D, w: number, y: number, text: string, size: number): void {
  ctx.save();
  ctx.font = `bold ${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.lineWidth = size / 8;
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.fillStyle = '#fff';
  ctx.strokeText(text, w / 2, y);
  ctx.fillText(text, w / 2, y);
  ctx.restore();
}

export function drawPhaseText(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  phase: Phase,
  result: DrawResult | null,
  hidden: PoseId | null = null,
): void {
  const big = Math.round(w / 11);
  const small = Math.round(w / 20);
  if (phase === 'IDLE') centerText(ctx, w, h * 0.9, 'タップで召喚', big);
  if (phase === 'CHARGE') {
    centerText(ctx, w, h * 0.12, hidden ? '— 隠しポーズ成立 —' : '召喚中…', hidden ? small : big);
  }
  if (phase === 'REVEAL') centerText(ctx, w, h * 0.12, '(演出は次の段階で実装)', small);
  if (phase === 'RESULT') {
    // 仮表示。演出と結果表示の段階で作り込む
    if (result) {
      const label = rarities.find((e) => e.id === result.rarity)!.label;
      centerText(ctx, w, h * 0.38, label, big);
      centerText(ctx, w, h * 0.45, effectNames[result.effect], small);
      centerText(ctx, w, h * 0.5, `予告色: ${omenStyle[result.omen].label}`, small);
    }
    centerText(ctx, w, h * 0.9, 'タップで待機に戻る', small);
  }
}

export function drawDim(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number): void {
  if (alpha <= 0) return;
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.fillRect(0, 0, w, h);
}

// 溜め中のキープ進捗バー(ポーズを取り始めたら出る)
export function drawHoldBar(ctx: CanvasRenderingContext2D, w: number, h: number, ratio: number): void {
  if (ratio <= 0) return;
  const bw = w * 0.5;
  const x = (w - bw) / 2;
  const y = h * 0.17;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x, y, bw, h * 0.012);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, bw * Math.min(1, ratio), h * 0.012);
}
