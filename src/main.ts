import { cameraConfig } from './config/camera';
import { defaultFraming, framings, segmentation } from './config/framing';
import type { Omen, Rarity } from './config/gacha';
import { poses } from './config/gacha';
import { FpsCounter } from './logic/fps';
import { draw } from './logic/gacha';
import { PoseHold, detectPose } from './logic/pose';
import { defaultRng } from './logic/rng';
import { applyPose, createState, progress, tap, update } from './logic/stateMachine';
import { drawCover, drawVideoCover, startCamera, videoToCanvas } from './render/camera';
import { drawMagicCircle } from './render/circle';
import type { PoseDetector, PoseStatus } from './render/poseDetector';
import { createPoseDetector } from './render/poseDetector';
import type { Segmenter } from './render/segmenter';
import { createSegmenter } from './render/segmenter';
import { drawDim, drawHint, drawHoldBar, drawPhaseText } from './render/ui';

const canvas = document.getElementById('stage') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const personLayer = document.createElement('canvas'); // 切り抜いた人物を作る作業用
const pctx = personLayer.getContext('2d')!;
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

// 確認用: ?omen= ?rarity= で強制指定、?maskInvert=1 で切り抜きを反転、?framing=wide で広画角モード、?debug=1 で関節・詳細表示
// (本格的なデバッグUIは後の段階)
const q = new URLSearchParams(location.search);
const forceOmen = (q.get('omen') as Omen | null) ?? undefined;
const forceRarity = (q.get('rarity') as Rarity | null) ?? undefined;
const debug = q.get('debug') === '1';
const maskInvert = q.has('maskInvert') ? q.get('maskInvert') === '1' : segmentation.invert;
const framing = framings[q.get('framing') === 'wide' ? 'wide' : defaultFraming];

// iOS はカメラ起動にユーザー操作が必要なので、最初のタップでカメラを起動する
message('タップでカメラ起動');
canvas.addEventListener(
  'pointerdown',
  async () => {
    try {
      const video = await startCamera();
      let state = createState();
      const hold = new PoseHold();

      // モデルは読み込みが重いので裏で準備する。失敗しても通常のガチャは動く
      let segmenter: Segmenter | null = null;
      let segStatus = 'loading';
      createSegmenter(maskInvert).then(
        (s) => { segmenter = s; segStatus = 'ready'; },
        (e) => { segStatus = 'failed'; console.error('segmenter failed', e); },
      );
      let detector: PoseDetector | null = null;
      let poseStatus: PoseStatus | 'off' = framing.posesEnabled ? 'loading' : 'off';
      if (framing.posesEnabled) {
        createPoseDetector().then(
          (d) => { detector = d; poseStatus = 'ready'; },
          (e) => { poseStatus = 'failed'; console.error('pose detector failed', e); },
        );
      }

      canvas.addEventListener('pointerdown', () => {
        const before = state.phase;
        state = tap(state, performance.now(), draw(defaultRng, { forceOmen, forceRarity }));
        if (before !== state.phase) hold.reset();
      });

      let liveCandidate: string | null = null;
      const loop = (now: number): void => {
        state = update(state, now);
        const { width: w, height: h } = canvas;
        if (personLayer.width !== w || personLayer.height !== h) {
          personLayer.width = w;
          personLayer.height = h;
        }
        drawVideoCover(ctx, video, w, h, cameraConfig.mirror);

        // 溜め中だけポーズを判定する(広画角モードのみ)
        let holdRatio = 0;
        let joints = null;
        if (state.phase === 'CHARGE' && detector && !state.hidden) {
          joints = detector.detect(video, now);
          const st = hold.update(joints ? detectPose(joints) : null, now);
          liveCandidate = st.candidate;
          holdRatio = st.candidate ? st.heldMs / poses.holdMs : 0;
          if (st.confirmed) state = applyPose(state, st.confirmed);
        } else {
          liveCandidate = null;
        }

        const effectOn = (state.phase === 'CHARGE' || state.phase === 'REVEAL') && state.result;
        if (effectOn && state.result) {
          const p = state.phase === 'CHARGE' ? progress(state, now) : 1;
          // 背景層: 暗くした映像 + 魔法陣
          drawDim(ctx, w, h, state.phase === 'CHARGE' ? 0.35 * Math.min(1, p * 3) : 0.35);
          drawMagicCircle(ctx, w, h, state.result.omen, p, now, state.hidden, framing.circle);
          // 人物層: 切り抜いた人物を最前面に重ねる(魔法陣が人物の背後になる)
          if (segmenter) {
            segmenter.update(video, now);
            if (segmenter.mask) {
              pctx.globalCompositeOperation = 'source-over';
              pctx.clearRect(0, 0, w, h);
              drawVideoCover(pctx, video, w, h, cameraConfig.mirror);
              pctx.globalCompositeOperation = 'destination-in';
              drawCover(pctx, segmenter.mask, video.videoWidth, video.videoHeight, w, h, cameraConfig.mirror);
              ctx.drawImage(personLayer, 0, 0);
            }
          }
          if (state.phase === 'CHARGE') drawHoldBar(ctx, w, h, state.hidden ? 0 : holdRatio);
        }
        if (state.phase === 'IDLE') drawHint(ctx, w, h, framing.hint);
        drawPhaseText(ctx, w, h, state.phase, state.result, state.hidden);

        const f = fps.tick(now);
        const line = Math.round(w / 20);
        ctx.fillStyle = '#0f0';
        ctx.font = `${Math.round(w / 24)}px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(`${f} fps  ${video.videoWidth}x${video.videoHeight}`, 12, 32);
        ctx.fillText(`seg: ${segStatus}${segmenter ? ` ${segmenter.lastMs.toFixed(0)}ms` : ''}`, 12, 32 + line);
        ctx.fillText(
          `pose: ${poseStatus}${detector ? ` ${detector.lastDetectMs.toFixed(0)}ms` : ''}${liveCandidate ? ` [${liveCandidate}]` : ''}`,
          12,
          32 + line * 2,
        );
        if (debug && segmenter) ctx.fillText(segmenter.info, 12, 32 + line * 3);

        if (debug && joints) {
          ctx.fillStyle = '#f0f';
          for (const jt of Object.values(joints)) {
            const c = videoToCanvas(jt.x, jt.y, video, w, h, cameraConfig.mirror);
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
