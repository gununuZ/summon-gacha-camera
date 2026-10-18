import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// GitHub Pages はサブパス配信のため base を相対にする
export default defineConfig(({ command }) => ({
  base: './',
  // HTTPS は LAN 開発(vite --host)のときだけ。ビルド成果物には影響しない
  plugins: command === 'serve' ? [basicSsl()] : [],
}));
