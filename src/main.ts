import { cameraConfig } from './config/camera';
import { FpsCounter } from './logic/fps';
import { drawVideoCover, startCamera } from './render/camera';

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

// iOS はカメラ起動にユーザー操作が必要なのでタップで開始
message('タップでカメラ起動');
canvas.addEventListener(
  'pointerdown',
  async () => {
    try {
      const video = await startCamera();
      const loop = (now: number): void => {
        drawVideoCover(ctx, video, canvas.width, canvas.height, cameraConfig.mirror);
        const f = fps.tick(now);
        ctx.fillStyle = '#0f0';
        ctx.font = `${Math.round(canvas.width / 24)}px monospace`;
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
