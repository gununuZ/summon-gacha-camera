import type { Omen } from '../config/gacha';
import { omenStyle } from '../config/gacha';
import type { PoseId } from '../logic/pose';

const TAU = Math.PI * 2;

// 予告色。虹は角度と時間で色相を回す
function colorAt(omen: Omen, angle: number, tMs: number): string {
  if (omen !== 'rainbow') return omenStyle[omen].color;
  return `hsl(${((angle / TAU) * 360 + tMs * 0.15) % 360}, 100%, 65%)`;
}

function ring(ctx: CanvasRenderingContext2D, omen: Omen, r: number, width: number, tMs: number): void {
  const seg = 48;
  ctx.lineWidth = width;
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * TAU;
    const a1 = ((i + 1.05) / seg) * TAU;
    ctx.strokeStyle = colorAt(omen, a0, tMs);
    ctx.beginPath();
    ctx.arc(0, 0, r, a0, a1);
    ctx.stroke();
  }
}

function polygon(ctx: CanvasRenderingContext2D, omen: Omen, r: number, n: number, rot: number, tMs: number): void {
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i / n) * TAU;
    const a1 = rot + ((i + 1) / n) * TAU;
    ctx.strokeStyle = colorAt(omen, a0, tMs);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a0) * r, Math.sin(a0) * r);
    ctx.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
    ctx.stroke();
  }
}

// 足元(画面下部)の魔法陣。strength: 0..1 で展開度・明るさ
export function drawMagicCircle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  omen: Omen,
  strength: number,
  tMs: number,
  hidden: PoseId | null = null,
): void {
  if (strength <= 0) return;
  const eased = 1 - Math.pow(1 - strength, 3);
  // 隠しポーズ成立の合図: 詠唱は巨大化、腕クロスは脈打つ
  const pulse = hidden === 'cross' ? 1 + 0.06 * Math.sin(tMs * 0.03) : 1;
  const grow = hidden === 'chant' ? 1.3 : 1;
  const R = w * 0.44 * (0.15 + 0.85 * eased) * grow * pulse;
  const squash = 0.32; // 床に置いたように見せる縦つぶし
  const unit = Math.max(2, w / 180);

  ctx.save();
  ctx.translate(w / 2, h * 0.82);
  ctx.scale(1, squash);
  ctx.globalAlpha = Math.min(1, 0.25 + strength);
  ctx.shadowColor = omen === 'rainbow' ? '#ffffff' : omenStyle[omen].color;
  ctx.shadowBlur = unit * (6 + 14 * strength);
  ctx.lineCap = 'round';

  ring(ctx, omen, R, unit * 1.6, tMs);
  ring(ctx, omen, R * 0.82, unit * 0.9, tMs);

  // 外周のルーン(目盛り)。時計回り
  ctx.save();
  ctx.rotate(tMs * (hidden === 'chant' ? 0.0016 : 0.0006));
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * TAU;
    const len = i % 3 === 0 ? 0.1 : 0.05;
    ctx.strokeStyle = colorAt(omen, a, tMs);
    ctx.lineWidth = unit * 0.9;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * R * 0.88, Math.sin(a) * R * 0.88);
    ctx.lineTo(Math.cos(a) * R * (0.88 + len), Math.sin(a) * R * (0.88 + len));
    ctx.stroke();
  }
  ctx.restore();

  // 内側の六芒星。反時計回り
  ctx.lineWidth = unit;
  polygon(ctx, omen, R * 0.66, 3, -tMs * 0.0009, tMs);
  polygon(ctx, omen, R * 0.66, 3, -tMs * 0.0009 + Math.PI, tMs);

  // 中心へ集まる光の粒
  ctx.shadowBlur = unit * 8;
  for (let i = 0; i < 24; i++) {
    const phase = (tMs / 1000) * 0.7 + i / 24;
    const k = 1 - (phase % 1);
    const a = (i / 24) * TAU + i;
    ctx.fillStyle = colorAt(omen, a, tMs);
    ctx.beginPath();
    ctx.arc(Math.cos(a) * R * 1.3 * k, Math.sin(a) * R * 1.3 * k, unit * 1.6 * k, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
