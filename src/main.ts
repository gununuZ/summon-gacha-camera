import { cameraConfig } from './config/camera';
import type { Omen, Rarity } from './config/gacha';
import { poses } from './config/gacha';
import { FpsCounter } from './logic/fps';
import { draw } from './logic/gacha';
import { PoseHold, detectPose } from './logic/pose';
import { defaultRng } from './logic/rng';
import { applyPose, createState, progress, tap, update } from './logic/stateMachine';
import { drawVideoCover, startCamera, videoToCanvas } from './render/camera';
import { drawMagicCircle } from './render/circle';
import type { PoseDetector, PoseStatus } from './render/poseDetector';
import { createPoseDetector } from './render/poseDetector';
import { drawDim, drawHoldBar, drawPhaseText } from './render/ui';

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

// 確認用: ?omen=blue|gold|rainbow ?rarity=SSR|SR|R|MISS で強制指定、?debug=1 で関節表示
// (本格的なデバッグUIは後の段階)
const q = new URLSearchParams(location.search);
const forceOmen = (q.get('omen') as Omen | null) ?? undefined;
const forceRarity = (q.get('rarity') as Rarity | null) ?? undefined;
const debug = q.get('debug') === '1';

// iOS はカメラ起動にユーザー操作が必要なので、最初のタップでカメラを起動する
message('タップでカメラ起動');
canvas.addEventListener(
  'pointerdown',
  async () => {
    try {
      const video = await startCamera();
      let state = createState();
      const hold = new PoseHold();

      // ポーズ検出はモデル読み込みが重いので裏で準備する。失敗しても通常のガチャは動く
      let detector: PoseDetector | null = null;
      let poseStatus: PoseStatus = 'loading';
      createPoseDetector().then(
        (d) => {
          detector = d;
          poseStatus = 'ready';
        },
        (e) => {
          poseStatus = 'failed';
          console.error('pose detector failed', e);
        },
      );

      canvas.addEventListener('pointerdown', () => {
        const before = state.phase;
        state = tap(state, performance.now(), draw(defaultRng, { forceOmen, forceRarity }));
        if (before !== state.phase) hold.reset();
      });

      let liveCandidate: string | null = null;
      const loop = (now: number): void => {
        state = update(state, now);
        const { width: w, height: h } = canvas;
        drawVideoCover(ctx, video, w, h, cameraConfig.mirror);

        // 溜め中だけポーズを判定する
        let holdRatio = 0;
        let joints = null;
        if (state.phase === 'CHARGE' && detector && !state.hidden) {
          joints = detector.detect(video, now);
          const pose = joints ? detectPose(joints) : null;
          const st = hold.update(pose, now);
          liveCandidate = st.candidate;
          holdRatio = st.candidate ? st.heldMs / poses.holdMs : 0;
          if (st.confirmed) state = applyPose(state, st.confirmed);
        } else {
          liveCandidate = null;
        }

        if (state.phase === 'CHARGE' && state.result) {
          const p = progress(state, now);
          drawDim(ctx, w, h, 0.35 * Math.min(1, p * 3));
          drawMagicCircle(ctx, w, h, state.result.omen, p, now, state.hidden);
          drawHoldBar(ctx, w, h, state.hidden ? 0 : holdRatio);
        } else if (state.phase === 'REVEAL' && state.result) {
          drawDim(ctx, w, h, 0.35);
          drawMagicCircle(ctx, w, h, state.result.omen, 1, now, state.hidden);
        }
        drawPhaseText(ctx, w, h, state.phase, state.result, state.hidden);

        const f = fps.tick(now);
        ctx.fillStyle = '#0f0';
        ctx.font = `${Math.round(w / 24)}px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(`${f} fps  ${video.videoWidth}x${video.videoHeight}`, 12, 32);
        ctx.fillText(
          `pose: ${poseStatus}${detector ? ` ${detector.lastDetectMs.toFixed(0)}ms` : ''}${liveCandidate ? ` [${liveCandidate}]` : ''}`,
          12,
          32 + Math.round(w / 20),
        );

        // 関節の可視化(確認用)
        if (debug && joints) {
          ctx.fillStyle = '#f0f';
          for (const p of Object.values(joints)) {
            const c = videoToCanvas(p.x, p.y, video, w, h, cameraConfig.mirror);
            ctx.beginPath();
            ctx.arc(c.x, c.y, w / 60, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    } catch (e) {
      message(`カメラ失敗: ${(e as Error).name}`);
    }
  },
  { once: true },
);
