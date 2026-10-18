import type { SilAnalysis } from '../logic/silhouette';
import { analyzeSilhouette } from '../logic/silhouette';

// 人物マスク(canvas)を粗い格子に落として輪郭などを取る。毎フレームは重いので間引く
const GW = 80;
const GH = 45;
const INTERVAL_MS = 66;

export class SilhouetteSampler {
  private cv = document.createElement('canvas');
  private g: CanvasRenderingContext2D;
  private last: SilAnalysis = { edge: [], box: null, headTop: null };
  private lastMs = -Infinity;

  constructor() {
    this.cv.width = GW;
    this.cv.height = GH;
    this.g = this.cv.getContext('2d', { willReadFrequently: true })!;
  }

  update(mask: HTMLCanvasElement, nowMs: number): void {
    if (nowMs - this.lastMs < INTERVAL_MS) return;
    this.lastMs = nowMs;
    this.g.clearRect(0, 0, GW, GH);
    this.g.drawImage(mask, 0, 0, GW, GH);
    const px = this.g.getImageData(0, 0, GW, GH).data;
    const alpha = new Uint8ClampedArray(GW * GH);
    for (let i = 0; i < alpha.length; i++) alpha[i] = px[i * 4 + 3];
    this.last = analyzeSilhouette(alpha, GW, GH);
  }

  get(): SilAnalysis {
    return this.last;
  }
}
