import { cameraConfig } from './config/camera';
import { mountDebugPanel } from './debug/panel';
import { defaultFraming, framings, segmentation } from './config/framing';
import type { Omen, Rarity } from './config/gacha';
import { poses, timing } from './config/gacha';
import { FpsCounter } from './logic/fps';
import { draw } from './logic/gacha';
import { PoseHold, detectPose } from './logic/pose';
import { syntheticSilhouette } from './logic/silhouette';
import { defaultRng } from './logic/rng';
import { applyPose, createState, progress, tap, update } from './logic/stateMachine';
import { drawVideoCover, startCamera, videoToCanvas } from './render/camera';
import { drawMagicCircle } from './render/circle';
import { effectFactories } from './render/effects';
import type { Effect, FxContext } from './render/effects/types';
import { ramp } from './render/effects/util';
import { drawPerson } from './render/person';
import type { PoseDetector, PoseStatus } from './render/poseDetector';
import { createPoseDetector } from './render/poseDetector';
import type { Segmenter } from './render/segmenter';
import { SilhouetteSampler } from './render/silhouette';
import { createSegmenter } from './render/segmenter';
import { drawDim, drawHint, drawHoldBar, drawPhaseText } from './render/ui';

const canvas = document.getElementById('stage') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const personLayer = document.createElement('canvas'); // 切り抜いた人物を作る作業用
const sampler = new SilhouetteSampler();
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

// 確認用: ?omen= ?rarity= ?effect= で強制指定、?maskInvert=1 で切り抜きを反転、?framing=wide で広画角モード、?debug=1 で関節・詳細表示、?fakeSil=1 で仮の輪郭を使う
// (本格的なデバッグUIは後の段階)
const q = new URLSearchParams(location.search);
let forceOmen = (q.get('omen') as Omen | null) ?? undefined; // デバッグパネルでも切り替わる
const forceRarity = (q.get('rarity') as Rarity | null) ?? undefined;
const forceEffect = q.get('effect') ?? undefined;
const debug = q.get('debug') === '1';
const fakeSil = q.get('fakeSil') === '1'; // 確認用: 人物が映らない環境で仮の輪郭を使う
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
      let segStatus = fakeSil ? 'off(fakeSil)' : 'loading';
      if (!fakeSil) createSegmenter(maskInvert).then(
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
        state = tap(state, performance.now(), draw(defaultRng, { forceOmen, forceRarity, forceEffect }));
        if (before !== state.phase) hold.reset();
      });

      // デバッグパネル: 演出ボタンのタップで、状態に関わらずその演出を今すぐ再生する
      if (debug) {
        mountDebugPanel({
          onPickEffect: (id) => {
            state = tap(createState(), performance.now(), draw(defaultRng, { forceEffect: id, forceOmen }));
            hold.reset();
          },
          onOmen: (o) => { forceOmen = o ?? undefined; },
        });
      }

      let liveCandidate: string | null = null;
      let effect: Effect | null = null;
      let lastPhase = state.phase;
      let lastNow = performance.now();

      // 演出に渡す情報(輪郭・頭頂・魔法陣の中心)を canvas 座標で作る。
      // 人物が取れない環境(確認用 ?fakeSil=1)や、切り抜きの失敗時は仮の上半身を使う
      const buildFx = (w: number, h: number, t: number, dt: number, mask: HTMLCanvasElement | null, v: HTMLVideoElement): FxContext => {
        const useSynthetic = fakeSil || !mask;
        if (mask && !useSynthetic) sampler.update(mask, performance.now());
        const ana = useSynthetic ? syntheticSilhouette() : sampler.get();
        const map = (p: { x: number; y: number }): { x: number; y: number } =>
          useSynthetic ? { x: p.x * w, y: p.y * h } : videoToCanvas(p.x, p.y, v, w, h, cameraConfig.mirror);
        const box = ana.box ? (() => { const a = map({ x: ana.box.x0, y: ana.box.y0 }); const b = map({ x: ana.box.x1, y: ana.box.y1 }); return { x0: Math.min(a.x, b.x), y0: Math.min(a.y, b.y), x1: Math.max(a.x, b.x), y1: Math.max(a.y, b.y) }; })() : null;
        return {
          w, h, t, ms: t * timing.revealMs, dt,
          edge: ana.edge.map(map),
          box,
          headTop: ana.headTop ? map(ana.headTop) : { x: w / 2, y: h * 0.25 },
          anchor: { x: w / 2, y: framing.circle === 'back' ? h * 0.42 : h * 0.82 },
        };
      };
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

        const result = state.result;
        const inEffect = (state.phase === 'CHARGE' || state.phase === 'REVEAL') && result;
        if (state.phase !== lastPhase) {
          effect = state.phase === 'REVEAL' && result ? (effectFactories[result.effect]?.() ?? null) : null;
          lastPhase = state.phase;
        }
        const dt = Math.min(100, now - lastNow);
        lastNow = now;

        if (inEffect && result) {
          if (segmenter) segmenter.update(video, now);
          const mask = segmenter?.mask ?? null;
          const person = (): void => {
            if (mask) drawPerson(ctx, personLayer, video, mask, w, h, cameraConfig.mirror);
          };
          if (state.phase === 'CHARGE') {
            const p = progress(state, now);
            // 背景層: 暗くした映像 + 魔法陣 → 人物層
            drawDim(ctx, w, h, 0.35 * Math.min(1, p * 3));
            drawMagicCircle(ctx, w, h, result.omen, p, now, state.hidden, framing.circle);
            person();
            drawHoldBar(ctx, w, h, state.hidden ? 0 : holdRatio);
          } else if (effect) {
            const t = progress(state, now);
            const fx = buildFx(w, h, t, dt, mask, video);
            drawDim(ctx, w, h, 0.35 * (1 - ramp(t, 0, 0.2)));
            effect.back?.(ctx, fx);
            drawMagicCircle(ctx, w, h, result.omen, Math.max(0, 1 - t * 4), now, state.hidden, framing.circle);
            person();
            effect.front?.(ctx, fx);
          }
        }
        if (state.phase === 'IDLE') drawHint(ctx, w, h, framing.hint);
        drawPhaseText(ctx, w, h, state.phase, state.result, state.hidden, debug);

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
