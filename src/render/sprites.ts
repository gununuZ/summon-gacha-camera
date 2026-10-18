// 仮素材(絵文字)と、public/assets/ に置いた画像の差し替え。
// public/assets/<name>.png があればそれを使い、無ければ絵文字で代用する
export interface Sprite {
  img: CanvasImageSource;
  w: number;
  h: number;
}

const emojiCache = new Map<string, Sprite>();
const assetState = new Map<string, Sprite | null | 'loading'>();

function emojiSprite(emoji: string): Sprite {
  const hit = emojiCache.get(emoji);
  if (hit) return hit;
  const size = 160;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const g = cv.getContext('2d')!;
  g.font = `${size * 0.8}px "Apple Color Emoji","Noto Color Emoji","Segoe UI Emoji",sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(emoji, size / 2, size / 2 + size * 0.05);
  const s = { img: cv, w: size, h: size };
  emojiCache.set(emoji, s);
  return s;
}

export function getSprite(name: string, fallbackEmoji: string): Sprite {
  const st = assetState.get(name);
  if (st && st !== 'loading') return st;
  if (st === undefined) {
    assetState.set(name, 'loading');
    const img = new Image();
    img.onload = () => assetState.set(name, { img, w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => assetState.set(name, null);
    img.src = new URL(`assets/${name}.png`, document.baseURI).href;
  }
  return emojiSprite(fallbackEmoji);
}

// 真っ黒なシルエットにした複製(影の演出用)
const silCache = new WeakMap<object, Sprite>();
export function silhouetteOf(s: Sprite): Sprite {
  const hit = silCache.get(s.img as object);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = s.w;
  cv.height = s.h;
  const g = cv.getContext('2d')!;
  g.drawImage(s.img, 0, 0, s.w, s.h);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = '#000';
  g.fillRect(0, 0, s.w, s.h);
  const out = { img: cv, w: s.w, h: s.h };
  silCache.set(s.img as object, out);
  return out;
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  s: Sprite,
  cx: number,
  cy: number,
  width: number,
  opts: { rot?: number; alpha?: number; flip?: boolean } = {},
): void {
  const height = (width * s.h) / s.w;
  ctx.save();
  ctx.translate(cx, cy);
  if (opts.rot) ctx.rotate(opts.rot);
  if (opts.flip) ctx.scale(-1, 1);
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.drawImage(s.img, -width / 2, -height / 2, width, height);
  ctx.restore();
}
