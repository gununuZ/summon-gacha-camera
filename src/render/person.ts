import { drawCover, drawVideoCover } from './camera';

// 人物だけを切り抜いて ctx に重ねる(layer は作業用 canvas)
export function drawPerson(
  ctx: CanvasRenderingContext2D,
  layer: HTMLCanvasElement,
  video: HTMLVideoElement,
  mask: HTMLCanvasElement,
  w: number,
  h: number,
  mirror: boolean,
): void {
  if (layer.width !== w || layer.height !== h) {
    layer.width = w;
    layer.height = h;
  }
  const g = layer.getContext('2d')!;
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, w, h);
  drawVideoCover(g, video, w, h, mirror);
  g.globalCompositeOperation = 'destination-in';
  drawCover(g, mask, video.videoWidth, video.videoHeight, w, h, mirror);
  ctx.drawImage(layer, 0, 0);
}
