import { drawSprite, getSprite, silhouetteOf } from '../sprites';
import type { Effect } from './types';
import { easeOut, fillSky, glow, ramp, rnd } from './util';

type Kind = 'dragon' | 'true';

// 巨大な神々しいシルエット(両腕を広げた人影)
function godFigure(ctx: CanvasRenderingContext2D, cx: number, cy: number, S: number): void {
  ctx.beginPath();
  ctx.arc(cx, cy - 0.55 * S, 0.14 * S, 0, Math.PI * 2);
  const pts: [number, number][] = [
    [-0.1, -0.42], [-1.1, -0.05], [-1.0, 0.05], [-0.35, -0.15], [-0.6, 0.9],
    [0.6, 0.9], [0.35, -0.15], [1.0, 0.05], [1.1, -0.05], [0.1, -0.42],
  ];
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(cx + x * S, cy + y * S) : ctx.lineTo(cx + x * S, cy + y * S)));
  ctx.closePath();
}

const hue = (i: number, ms: number): string => `hsl(${(i * 24 + ms * 0.12) % 360}, 100%, 65%)`;

// SSR: 背後に巨大な影 → 金色の後光 → 夜空と光の柱。true は隠しSSR「真・召喚」(虹色・神のシルエット)
function divine(kind: Kind): Effect {
  const stars = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random() * 0.9, s: rnd(0.6, 2.4), ph: rnd(0, 6.28) }));
  const sparks: { x: number; y: number; vy: number; ph: number; s: number }[] = [];
  const rainbow = kind === 'true';
  const gold = (i: number, ms: number): string => (rainbow ? hue(i, ms) : 'rgb(255,214,90)');

  return {
    back(ctx, c) {
      const sky = ramp(c.t, 0.05, 0.3) * (1 - ramp(c.t, 0.93, 1));
      fillSky(ctx, c, '#04061a', rainbow ? '#2a1450' : '#1a1640', sky);
      ctx.save();
      for (const st of stars) {
        ctx.globalAlpha = sky * (0.4 + 0.6 * Math.sin(c.ms / 280 + st.ph));
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(st.x * c.w, st.y * c.h, st.s * (c.w / 400), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 光の柱(頭の真後ろから天へ)
      const pillar = ramp(c.t, 0.45, 0.7) * (1 - ramp(c.t, 0.93, 1));
      if (pillar > 0) {
        const pw = c.w * 0.5 * easeOut(pillar);
        const g = ctx.createLinearGradient(c.headTop.x - pw / 2, 0, c.headTop.x + pw / 2, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.5, 'rgba(255,248,210,0.85)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = pillar * 0.8;
        ctx.fillStyle = g;
        ctx.fillRect(c.headTop.x - pw / 2, 0, pw, c.h);
        ctx.restore();
      }

      // 巨大な影(ドラゴン or 神)
      const shadow = ramp(c.t, 0.04, 0.3) * (1 - ramp(c.t, 0.5, 0.65) * 0.55);
      if (shadow > 0) {
        const scale = 1 + c.t * 0.12;
        ctx.save();
        ctx.globalAlpha = 0.85 * shadow;
        if (kind === 'dragon') {
          drawSprite(ctx, silhouetteOf(getSprite('dragon', '🐉')), c.w / 2, c.h * 0.36, c.w * 1.7 * scale);
        } else {
          ctx.fillStyle = '#000';
          godFigure(ctx, c.w / 2, c.h * 0.42, c.h * 0.5 * scale);
          ctx.fill();
          ctx.lineWidth = c.w / 120;
          ctx.strokeStyle = hue(0, c.ms);
          ctx.shadowColor = '#fff';
          ctx.shadowBlur = c.w / 18;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 後光(頭の後ろで回る光線)
      const halo = ramp(c.t, 0.3, 0.55) * (1 - ramp(c.t, 0.93, 1));
      if (halo > 0) {
        const R = c.w * (0.55 + 0.5 * halo);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(c.headTop.x, c.headTop.y + c.h * 0.08);
        ctx.rotate(c.ms / 2600);
        const n = 18;
        for (let i = 0; i < n; i++) {
          ctx.rotate((Math.PI * 2) / n);
          ctx.globalAlpha = 0.35 * halo;
          ctx.fillStyle = gold(i, c.ms);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(R, -R * 0.06);
          ctx.lineTo(R, R * 0.06);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        glow(ctx, c.headTop.x, c.headTop.y + c.h * 0.08, c.w * 0.7, rainbow ? 'rgba(255,255,255,1)' : 'rgba(255,224,120,1)', 0.7 * halo);
      }
    },

    front(ctx, c) {
      // 後光が差す瞬間のフラッシュ
      const f = 1 - ramp(c.t, 0.3, 0.38);
      if (c.t >= 0.3 && f > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(255,255,255,${0.7 * f})`;
        ctx.fillRect(0, 0, c.w, c.h);
        ctx.restore();
      }
      // 金(虹)の光の粒が降る
      if (c.t > 0.45 && c.t < 0.93) {
        for (let i = 0; i < Math.ceil(c.dt / 14); i++) sparks.push({ x: rnd(0, c.w), y: -8, vy: rnd(0.12, 0.3) * c.h, ph: rnd(0, 6.28), s: rnd(0.006, 0.016) * c.w });
      }
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.y += (s.vy * c.dt) / 1000;
        if (s.y > c.h + 10) { sparks.splice(i, 1); continue; }
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(c.ms / 120 + s.ph);
        ctx.fillStyle = gold(i, c.ms);
        ctx.beginPath();
        ctx.arc(s.x + Math.sin(s.ph + c.ms / 400) * 6, s.y, s.s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
  };
}

export const dragon = (): Effect => divine('dragon');
export const trueSummon = (): Effect => divine('true');
