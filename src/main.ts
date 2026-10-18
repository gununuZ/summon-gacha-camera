import { cameraConfig } from './config/camera';
import type { Omen, Rarity } from './config/gacha';
import { FpsCounter } from './logic/fps';
import { draw } from './logic/gacha';
import { defaultRng } from './logic/rng';
import { createState, progress, tap, update } from './logic/stateMachine';
import { drawVideoCover, startCamera } from './render/camera';
import { drawMagicCircle } from './render/circle';
import { drawDim, drawPhaseText } from './render/ui';

const canvas = document.getElementById('stage') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const fps = new FpsCounter();

function resize(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
}
window.addEventListener('resize', resize);
resize();

function message(text: string): void {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = `${Math.round(canvas.width / 18)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

// 確認用: ?omen=blue|gold|rainbow と ?rarity=SSR|SR|R|MISS で強制指定(本格的なデバッグUIは後の段階)
const q = new URLSearchParams(location.search);
const forceOmen = (q.get('omen') as Omen | null) ?? undefined;
const forceRarity = (q.get('rarity') as Rarity | null) ?? undefined;

// iOS はカメラ起動にユーザー操作が必要なので、最初のタップでカメラを起動する
message('タップでカメラ起動');
canvas.addEventListener(
  'pointerdown',
  async () => {
    try {
      const video = await startCamera();
      let state = createState();
      canvas.addEventListener('pointerdown', () => {
        state = tap(state, performance.now(), draw(defaultRng, { forceOmen, forceRarity }));
      });

      const loop = (now: number): void => {
        state = update(state, now);
        const { width: w, height: h } = canvas;
        drawVideoCover(ctx, video, w, h, cameraConfig.mirror);

        if (state.phase === 'CHARGE' && state.result) {
          const p = progress(state, now);
          drawDim(ctx, w, h, 0.35 * Math.min(1, p * 3));
          drawMagicCircle(ctx, w, h, state.result.omen, p, now);
        } else if (state.phase === 'REVEAL' && state.result) {
          drawDim(ctx, w, h, 0.35);
          drawMagicCircle(ctx, w, h, state.result.omen, 1, now);
        }
        drawPhaseText(ctx, w, h, state.phase, state.result);

        const f = fps.tick(now);
        ctx.fillStyle = '#0f0';
        ctx.font = `${Math.round(w / 24)}px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(`${f} fps  ${video.videoWidth}x${video.videoHeight}`, 12, 32);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    } catch (e) {
      message(`カメラ失敗: ${(e as Error).name}`);
    }
  },
  { once: true },
);
