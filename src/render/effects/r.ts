import type { Effect } from './types';
import { clamp01, fillSky, glow, pickEdge, ramp, rnd } from './util';

const env = (t: number): number => ramp(t, 0, 0.12) * (1 - ramp(t, 0.85, 1));

// R: 紙吹雪 + 背景が星空
export function confetti(): Effect {
  const stars = Array.from({ length: 80 }, () => ({ x: Math.random(), y: Math.random() * 0.85, s: rnd(0.6, 2.2), ph: rnd(0, 6.28) }));
  const colors = ['#ff5a8a', '#ffd24a', '#4aa8ff', '#6be08a', '#c18bff', '#ffffff'];
  interface Piece { x: number; y: number; vy: number; ph: number; rot: number; vr: number; s: number; col: string }
  const pieces: Piece[] = [];
  return {
    back(ctx, c) {
      fillSky(ctx, c, '#0b1030', '#2a1f5a', env(c.t));
      ctx.save();
      for (const st of stars) {
        ctx.globalAlpha = env(c.t) * (0.45 + 0.55 * Math.sin(c.ms / 300 + st.ph));
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(st.x * c.w, st.y * c.h, st.s * (c.w / 400), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
    front(ctx, c) {
      if (c.t < 0.8) {
        for (let i = 0; i < Math.ceil(c.dt / 12); i++) {
          pieces.push({
            x: rnd(0, c.w), y: -10, vy: rnd(0.25, 0.6) * c.h, ph: rnd(0, 6.28),
            rot: rnd(0, 6.28), vr: rnd(-6, 6), s: rnd(0.012, 0.024) * c.w, col: colors[Math.floor(Math.random() * colors.length)],
          });
        }
      }
      ctx.save();
      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i];
        p.y += (p.vy * c.dt) / 1000;
        p.x += Math.sin(p.ph + c.ms / 260) * 0.6;
        p.rot += (p.vr * c.dt) / 1000;
        if (p.y > c.h + 20) { pieces.splice(i, 1); continue; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.abs(Math.cos(p.rot * 1.7)) + 0.15);
        ctx.fillStyle = p.col;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
        ctx.restore();
      }
      ctx.restore();
    },
  };
}

// R: 人物がうっすら光る(輪郭から光がにじむ)
export function glowAura(): Effect {
  const sparks: { x: number; y: number; vy: number; life: number; age: number }[] = [];
  return {
    front(ctx, c) {
      const e = env(c.t);
      const step = Math.max(1, Math.floor(c.edge.length / 36));
      const pulse = 0.75 + 0.25 * Math.sin(c.ms / 220);
      for (let i = 0; i < c.edge.length; i += step) {
        const p = c.edge[i];
        glow(ctx, p.x, p.y, c.w * 0.1, 'rgba(255,240,180,0.9)', 0.22 * e * pulse);
      }
      if (c.t < 0.85) {
        const p = pickEdge(c);
        if (p) sparks.push({ x: p.x, y: p.y, vy: rnd(30, 90), life: rnd(500, 1100), age: 0 });
      }
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.age += c.dt;
        s.y -= (s.vy * c.dt) / 1000;
        if (s.age > s.life) { sparks.splice(i, 1); continue; }
        ctx.globalAlpha = clamp01(1 - s.age / s.life);
        ctx.fillStyle = '#fff6c8';
        ctx.beginPath();
        ctx.arc(s.x, s.y, c.w * 0.006, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
  };
}
