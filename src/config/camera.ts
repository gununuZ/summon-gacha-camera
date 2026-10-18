// カメラ・描画まわりの設定。端末が重いときはここを下げる
export const cameraConfig = {
  facingMode: 'user' as const,
  idealWidth: 1280,
  idealHeight: 720,
  mirror: true, // 自撮り前提。左右反転表示
};
