import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { poses } from '../config/gacha';
import type { Joints } from '../logic/pose';
import { jointsFromLandmarks } from '../logic/pose';

export type PoseStatus = 'loading' | 'ready' | 'failed';

export interface PoseDetector {
  detect(video: HTMLVideoElement, nowMs: number): Joints | null;
  readonly lastDetectMs: number; // 直近の推論時間(重さの確認用)
}

// wasm・モデルはサイト内(public/)から読む。サブパス配信でも動くよう document.baseURI 基準にする
const url = (path: string): string => new URL(path, document.baseURI).href;

export async function createPoseDetector(): Promise<PoseDetector> {
  const fileset = await FilesetResolver.forVisionTasks(url('mediapipe/wasm'));
  const make = (delegate: 'GPU' | 'CPU') =>
    PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: url('models/pose_landmarker_lite.task'), delegate },
      runningMode: 'VIDEO',
      numPoses: 1,
    });
  let landmarker: PoseLandmarker;
  try {
    landmarker = await make('GPU');
  } catch {
    landmarker = await make('CPU'); // GPU が使えない端末向け
  }

  let lastVideoTime = -1;
  let lastRunMs = -Infinity;
  let lastJoints: Joints | null = null;
  const self: PoseDetector = {
    lastDetectMs: 0,
    detect(video, nowMs) {
      // 同じフレームの二重推論と、短すぎる間隔での推論を避ける(描画のFPSを守る)
      if (video.currentTime === lastVideoTime || nowMs - lastRunMs < poses.detectIntervalMs) return lastJoints;
      lastVideoTime = video.currentTime;
      lastRunMs = nowMs;
      const t0 = performance.now();
      const res = landmarker.detectForVideo(video, nowMs);
      (self as { lastDetectMs: number }).lastDetectMs = performance.now() - t0;
      const lm = res.landmarks[0];
      lastJoints = lm ? jointsFromLandmarks(lm) : null;
      return lastJoints;
    },
  };
  return self;
}
