import { cameraConfig } from '../config/camera';

export async function startCamera(): Promise<HTMLVideoElement> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: cameraConfig.facingMode,
      width: { ideal: cameraConfig.idealWidth },
      height: { ideal: cameraConfig.idealHeight },
    },
  });
  const video = document.createElement('video');
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true; // iOS Safari: インライン再生に必須
  await video.play();
  return video;
}

// 画像(video / canvas など)を canvas に cover で描く(必要なら左右反転)。
// sw, sh は「映像全体を表す縦横」。マスクのように解像度が違うものも、同じ矩形に重ねられる
export function drawCover(
  ctx: CanvasRenderingContext2D,
  src: CanvasImageSource,
  sw: number,
  sh: number,
  w: number,
  h: number,
  mirror: boolean,
): void {
  if (!sw || !sh) return;
  const scale = Math.max(w / sw, h / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.save();
  if (mirror) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(src, (w - dw) / 2, (h - dh) / 2, dw, dh);
  ctx.restore();
}

export function drawVideoCover(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  w: number,
  h: number,
  mirror: boolean,
): void {
  drawCover(ctx, video, video.videoWidth, video.videoHeight, w, h, mirror);
}

// 映像の正規化座標(0..1)を、drawVideoCover と同じ変換で canvas 座標へ写す(関節表示用)
export function videoToCanvas(
  x: number,
  y: number,
  video: HTMLVideoElement,
  w: number,
  h: number,
  mirror: boolean,
): { x: number; y: number } {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const scale = Math.max(w / vw, h / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  const px = (w - dw) / 2 + x * dw;
  return { x: mirror ? w - px : px, y: (h - dh) / 2 + y * dh };
}
