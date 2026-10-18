import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';
import { segmentation } from '../config/framing';
import { maskAlpha } from '../logic/mask';

export interface Segmenter {
  // 人物マスク(アルファに人物の確信度が入った canvas)。まだ推論していなければ null
  readonly mask: HTMLCanvasElement | null;
  readonly lastMs: number; // 直近の推論時間(重さの確認用)
  readonly info: string; // 確認用(ラベル・マスク数・サイズ)
  update(video: HTMLVideoElement, nowMs: number): void;
}

const url = (path: string): string => new URL(path, document.baseURI).href;

export async function createSegmenter(invert: boolean): Promise<Segmenter> {
  const fileset = await FilesetResolver.forVisionTasks(url('mediapipe/wasm'));
  const make = (delegate: 'GPU' | 'CPU') =>
    ImageSegmenter.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: url('models/selfie_segmenter.tflite'), delegate },
      runningMode: 'VIDEO',
      outputConfidenceMasks: true,
      outputCategoryMask: false,
    });
  let seg: ImageSegmenter;
  try {
    seg = await make('GPU');
  } catch {
    seg = await make('CPU');
  }

  // 人物のチャンネル番号をラベルから決める(見つからなければ最後のチャンネル)
  const labels = seg.getLabels();
  const personIdx = labels.findIndex((l) => /person|foreground/i.test(l));

  const state = { mask: null as HTMLCanvasElement | null, lastMs: 0, info: `labels=${JSON.stringify(labels)}` };
  let lastVideoTime = -1;
  let lastRunMs = -Infinity;
  let ctx2d: CanvasRenderingContext2D | null = null;

  return {
    get mask() { return state.mask; },
    get lastMs() { return state.lastMs; },
    get info() { return state.info; },
    update(video, nowMs) {
      if (video.currentTime === lastVideoTime || nowMs - lastRunMs < segmentation.intervalMs) return;
      lastVideoTime = video.currentTime;
      lastRunMs = nowMs;
      const t0 = performance.now();
      const res = seg.segmentForVideo(video, nowMs);
      const masks = res.confidenceMasks ?? [];
      const m = masks[personIdx >= 0 ? personIdx : masks.length - 1];
      if (m) {
        const { width, height } = m;
        const conf = m.getAsFloat32Array();
        if (!state.mask || state.mask.width !== width || state.mask.height !== height) {
          state.mask = document.createElement('canvas');
          state.mask.width = width;
          state.mask.height = height;
          ctx2d = state.mask.getContext('2d')!;
        }
        const img = ctx2d!.createImageData(width, height);
        for (let i = 0; i < conf.length; i++) {
          img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = 255;
          img.data[i * 4 + 3] = maskAlpha(invert ? 1 - conf[i] : conf[i], segmentation.edgeLow, segmentation.edgeHigh);
        }
        ctx2d!.putImageData(img, 0, 0);
        state.info = `labels=${JSON.stringify(labels)} masks=${masks.length} ${width}x${height}`;
      }
      res.close();
      state.lastMs = performance.now() - t0;
    },
  };
}
