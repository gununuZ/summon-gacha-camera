import type { Effect } from './types';
import { clamp01, glow, pickEdge, ramp, rnd } from './util';

const env = (t: number): number => ramp(t, 0, 0.15) * (1 - ramp(t, 0.85, 1));

// SR: 炎のオーラ(人物の輪郭に沿って炎が立ち上る)
export function fire(): Effect {
  interface P { x: number; y: number; vx: number; vy: number; age: number; life: number; r: number }
  const ps: P[] = [];
  return {
    back(ctx, c) {
      ctx.save();
      ctx.globalAlpha = 0.3 * env(c.t);
      ctx.fillStyle = '#5a1200';
      ctx.fillRect(0, 0, c.w, c.h);
      ctx.restore();
      glow(ctx, c.w / 2, c.h, c.w * 0.9, 'rgba(255,120,20,1)', 0.35 * env(c.t));
    },
    front(ctx, c) {
      if (c.t < 0.85) {
        const n = Math.ceil(c.dt / 3);
        for (let i = 0; i < n && ps.length < 450; i++) {
          const e = pickEdge(c);
          if (!e) break;
          ps.push({ x: e.x, y: e.y, vx: rnd(-25, 25), vy: -rnd(0.08, 0.28) * c.h, age: 0, life: rnd(450, 950), r: rnd(0.014, 0.03) * c.w });
        }
      }
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.age += c.dt;
        p.x += (p.vx * c.dt) / 1000 + Math.sin(p.age / 120 + i) * 0.4;
        p.y += (p.vy * c.dt) / 1000;
        const k = p.age / p.life;
        if (k >= 1) { ps.splice(i, 1); continue; }
        ctx.fillStyle = `rgba(255, ${Math.round(210 - 170 * k)}, ${Math.round(60 - 50 * k)}, ${(1 - k) * 0.85})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (1 - k * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
  };
}

// 稲妻をギザギザの折れ線にする(中点変位)
function bolt(x0: number, y0: number, x1: number, y1: number, jitter: number, depth: number): { x: number; y: number }[] {
  if (depth === 0) return [{ x: x0, y: y0 }, { x: x1, y: y1 }];
  const mx = (x0 + x1) / 2 + rnd(-jitter, jitter);
  const my = (y0 + y1) / 2 + rnd(-jitter, jitter) * 0.3;
  const a = bolt(x0, y0, mx, my, jitter / 2, depth - 1);
  const b = bolt(mx, my, x1, y1, jitter / 2, depth - 1);
  return [...a, ...b.slice(1)];
}

// SR: 雷のオーラ(稲妻が落ち、輪郭に火花が走る)
export function thunder(): Effect {
  const bolts: { pts: { x: number; y: number }[]; born: number }[] = [];
  let next = 0;
  let flash = 0;
  return {
    back(ctx, c) {
      ctx.save();
      ctx.globalAlpha = 0.4 * env(c.t);
      ctx.fillStyle = '#0a1040';
      ctx.fillRect(0, 0, c.w, c.h);
      ctx.restore();
    },
    front(ctx, c) {
      if (c.t < 0.85 && c.ms >= next) {
        next = c.ms + rnd(250, 520);
        const tgt = pickEdge(c) ?? { x: c.w / 2, y: c.h * 0.4 };
        bolts.push({ pts: bolt(rnd(0.15, 0.85) * c.w, 0, tgt.x, tgt.y, c.w * 0.18, 5), born: c.ms });
        flash = 1;
      }
      flash = Math.max(0, flash - c.dt / 140);
      ctx.save();
      ctx.fillStyle = `rgba(210,225,255,${0.35 * flash * env(c.t)})`;
      ctx.fillRect(0, 0, c.w, c.h);
      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i];
        const k = (c.ms - b.born) / 220;
        if (k >= 1) { bolts.splice(i, 1); continue; }
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = '#eaf2ff';
        ctx.shadowColor = '#6aa8ff';
        ctx.shadowBlur = c.w / 25;
        ctx.lineWidth = c.w / 90;
        ctx.beginPath();
        b.pts.forEach((p, j) => (j === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();
      }
      // 輪郭を走る火花
      ctx.globalAlpha = clamp01(env(c.t));
      ctx.strokeStyle = '#ffe96a';
      ctx.lineWidth = c.w / 220;
      ctx.shadowColor = '#ffe96a';
      ctx.shadowBlur = c.w / 60;
      for (let i = 0; i < 14; i++) {
        const e = pickEdge(c);
        if (!e) break;
        const a = rnd(0, Math.PI * 2);
        const L = rnd(0.02, 0.06) * c.w;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + Math.cos(a) * L, e.y + Math.sin(a) * L);
        ctx.stroke();
      }
      ctx.restore();
    },
  };
}
