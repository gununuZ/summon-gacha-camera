import { getSprite, drawSprite } from '../sprites';
import type { Effect, FxContext } from './types';
import { easeOut, ramp, rnd } from './util';

// ハズレ: 煙が「ぽふっ」と出るだけ
export function smoke(): Effect {
  const puffs = Array.from({ length: 9 }, (_, i) => ({ a: (i / 9) * Math.PI * 2 + rnd(-0.3, 0.3), d: rnd(0.6, 1.2), r: rnd(0.7, 1.2) }));
  return {
    front(ctx, c) {
      const k = ramp(c.t, 0.12, 0.5);
      if (k <= 0) return;
      const R = c.w * 0.12;
      ctx.save();
      ctx.globalAlpha = (1 - ramp(c.t, 0.45, 0.8)) * 0.85;
      ctx.fillStyle = '#cfcfd6';
      for (const p of puffs) {
        ctx.beginPath();
        ctx.arc(c.anchor.x + Math.cos(p.a) * R * p.d * easeOut(k), c.anchor.y + Math.sin(p.a) * R * p.d * easeOut(k) * 0.8, R * p.r * (0.4 + 0.6 * easeOut(k)), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = (1 - ramp(c.t, 0.4, 0.6));
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(c.w / 9)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = c.w / 60;
      ctx.strokeText('ぽふっ', c.anchor.x, c.anchor.y - R * 1.3);
      ctx.fillText('ぽふっ', c.anchor.x, c.anchor.y - R * 1.3);
      ctx.restore();
    },
  };
}

// 画面を横切る鳩。from: 左から(true)/右から(false)
function flyPigeon(ctx: CanvasRenderingContext2D, c: FxContext, k: number, y: number, size: number, fromLeft: boolean, phase: number): void {
  if (k <= 0 || k >= 1) return;
  const x = fromLeft ? -size + k * (c.w + size * 2) : c.w + size - k * (c.w + size * 2);
  const bob = Math.sin(c.ms / 140 + phase) * c.h * 0.012;
  const flap = 0.85 + 0.15 * Math.sin(c.ms / 70 + phase);
  const s = getSprite('pigeon', '🕊️');
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(1, flap);
  drawSprite(ctx, s, 0, 0, size, { flip: fromLeft });
  ctx.restore();
}

// ハズレ: ハトが1羽、画面を横切る
export function pigeon(): Effect {
  return {
    front(ctx, c) {
      flyPigeon(ctx, c, ramp(c.t, 0.1, 0.85), c.h * 0.3, c.w * 0.32, true, 0);
    },
  };
}

// 隠しハズレ: ハトが10羽押し寄せる
export function pigeonSwarm(): Effect {
  const birds = Array.from({ length: 10 }, (_, i) => ({
    start: 0.05 + i * 0.045, y: rnd(0.12, 0.8), size: rnd(0.2, 0.34), left: i % 2 === 0, ph: rnd(0, 6),
  }));
  return {
    front(ctx, c) {
      for (const b of birds) flyPigeon(ctx, c, ramp(c.t, b.start, b.start + 0.4), c.h * b.y, c.w * b.size, b.left, b.ph);
    },
  };
}

// ハズレ: 背後に巨大な影 → 正体は小さいスライム
export function slime(): Effect {
  const shadow = (ctx: CanvasRenderingContext2D, c: FxContext): void => {
    const grow = ramp(c.t, 0, 0.3);
    const shrink = ramp(c.t, 0.42, 0.62);
    const s = easeOut(grow) * (1 - shrink * 0.95);
    if (s <= 0.02) return;
    const cx = c.w / 2;
    const cy = c.h * 0.42;
    ctx.save();
    ctx.globalAlpha = 0.88 * (1 - ramp(c.t, 0.58, 0.64));
    ctx.fillStyle = '#05050a';
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const wob = 1 + 0.06 * Math.sin(a * 5 + c.ms / 200);
      const x = cx + Math.cos(a) * c.w * 0.62 * s * wob;
      const y = cy + Math.sin(a) * c.h * 0.34 * s * wob;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.fill();
    ctx.fillStyle = '#fff'; // 不気味な目
    for (const dx of [-0.2, 0.2]) {
      ctx.beginPath();
      ctx.ellipse(cx + dx * c.w * s, cy - c.h * 0.05 * s, c.w * 0.04 * s, c.h * 0.03 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };
  const little = (ctx: CanvasRenderingContext2D, c: FxContext): void => {
    const k = ramp(c.t, 0.6, 0.7);
    if (k <= 0) return;
    const W = c.w * 0.2 * easeOut(k);
    const bounce = Math.abs(Math.sin(c.ms / 170)) * c.h * 0.035;
    const cx = c.w * 0.76;
    const cy = c.h * 0.8 - bounce;
    const sq = 1 + 0.12 * Math.cos(c.ms / 170 * 2);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sq, 1 / sq);
    ctx.fillStyle = '#5be36a';
    ctx.strokeStyle = '#2f9e44';
    ctx.lineWidth = W * 0.05;
    ctx.beginPath();
    ctx.moveTo(-W / 2, 0);
    ctx.bezierCurveTo(-W / 2, -W * 0.85, W / 2, -W * 0.85, W / 2, 0);
    ctx.quadraticCurveTo(0, W * 0.12, -W / 2, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#123';
    for (const dx of [-0.17, 0.17]) {
      ctx.beginPath();
      ctx.arc(dx * W, -W * 0.28, W * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };
  return { back: shadow, front: little };
}

// ハズレ: 背後に普通のおじさんのシルエット
export function oji(): Effect {
  return {
    back(ctx, c) {
      const a = ramp(c.t, 0.12, 0.35) * (1 - ramp(c.t, 0.9, 1));
      if (a <= 0) return;
      const cx = c.w * 0.74 + Math.sin(c.ms / 700) * c.w * 0.004;
      const S = c.h * 0.5;
      const top = c.h * 0.3;
      ctx.save();
      ctx.globalAlpha = 0.9 * a;
      ctx.fillStyle = '#08080c';
      ctx.beginPath(); // 頭
      ctx.arc(cx, top, S * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath(); // スーツの肩と胴
      ctx.moveTo(cx - S * 0.07, top + S * 0.12);
      ctx.quadraticCurveTo(cx - S * 0.4, top + S * 0.16, cx - S * 0.42, top + S * 0.5);
      ctx.lineTo(cx - S * 0.36, c.h);
      ctx.lineTo(cx + S * 0.36, c.h);
      ctx.lineTo(cx + S * 0.42, top + S * 0.5);
      ctx.quadraticCurveTo(cx + S * 0.4, top + S * 0.16, cx + S * 0.07, top + S * 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
  };
}

// ハズレ: 背景がちょっとだけ暗くなって終わる
export function dim(): Effect {
  return {
    back(ctx, c) {
      ctx.save();
      ctx.globalAlpha = 0.5 * ramp(c.t, 0, 0.3) * (1 - ramp(c.t, 0.7, 1));
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, c.w, c.h);
      ctx.restore();
    },
  };
}
