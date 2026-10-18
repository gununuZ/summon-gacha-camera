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

// video を canvas に cover で描く(必要なら左右反転)
export function drawVideoCover(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  w: number,
  h: number,
  mirror: boolean,
): void {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return;
  const scale = Math.max(w / vw, h / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  ctx.save();
  if (mirror) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, (w - dw) / 2, (h - dh) / 2, dw, dh);
  ctx.restore();
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
