import type { Omen } from '../config/gacha';
import { omenStyle } from '../config/gacha';
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
  omen: Omen | null,
): void {
  const big = Math.round(w / 11);
  const small = Math.round(w / 20);
  if (phase === 'IDLE') centerText(ctx, w, h * 0.9, 'タップで召喚', big);
  if (phase === 'CHARGE') centerText(ctx, w, h * 0.12, '召喚中…', big);
  if (phase === 'REVEAL') centerText(ctx, w, h * 0.12, '(演出は次の段階で実装)', small);
  if (phase === 'RESULT') {
    centerText(ctx, w, h * 0.4, '(結果表示は次の段階で実装)', small);
    if (omen) centerText(ctx, w, h * 0.46, `予告色: ${omenStyle[omen].label}`, small);
    centerText(ctx, w, h * 0.9, 'タップで待機に戻る', small);
  }
}

export function drawDim(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number): void {
  if (alpha <= 0) return;
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.fillRect(0, 0, w, h);
}
