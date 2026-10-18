import type { SilPoint } from '../../logic/silhouette';
import type { FxContext } from './types';

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
// t が a..b の間で 0..1 になる区間関数
export const ramp = (t: number, a: number, b: number): number => clamp01((t - a) / (b - a));
export const rnd = (a: number, b: number): number => a + Math.random() * (b - a);
export const easeOut = (x: number): number => 1 - Math.pow(1 - clamp01(x), 3);

export function pickEdge(c: FxContext): SilPoint | null {
  return c.edge.length ? c.edge[Math.floor(Math.random() * c.edge.length)] : null;
}

// 画面全体を縦グラデーションで塗る(背景の差し替え用)
export function fillSky(ctx: CanvasRenderingContext2D, c: FxContext, top: string, bottom: string, alpha: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, c.h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.w, c.h);
  ctx.restore();
}

// 放射状の光
export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
