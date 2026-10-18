// MediaPipe の wasm を public/mediapipe/ にコピーする(外部CDNに依存しないため自前配信)。
// コピー先は .gitignore 済み。dev / build の前に自動実行される
import { cpSync, mkdirSync } from 'node:fs';

const src = 'node_modules/@mediapipe/tasks-vision/wasm';
const dst = 'public/mediapipe/wasm';
mkdirSync(dst, { recursive: true });
cpSync(src, dst, { recursive: true });
console.log(`copied ${src} -> ${dst}`);
