import type { BrowColor } from './types';

export const DEFAULT_BROW_COLOR: BrowColor = { r: 60, g: 38, b: 30 };

/**
 * 흑백/단색 눈썹 PNG의 알파를 유지한 채 색상만 교체합니다.
 * 결과는 캔버스(이미지처럼 ctx.drawImage 가능)로 반환.
 */
export function tintBrow(img: HTMLImageElement, color: BrowColor): HTMLCanvasElement {
  const w = img.width;
  const h = img.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3];
    if (a === 0) continue;
    // 원본 밝기를 유지하면서 색조만 변경 (multiply)
    const lum = (px[i] + px[i + 1] + px[i + 2]) / (3 * 255);
    px[i] = Math.round(color.r * lum);
    px[i + 1] = Math.round(color.g * lum);
    px[i + 2] = Math.round(color.b * lum);
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}
