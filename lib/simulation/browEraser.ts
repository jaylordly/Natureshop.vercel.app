import type { FaceLandmarks, Point } from './types';

/**
 * 얼굴 사진에서 눈썹 영역을 주변 피부톤으로 부드럽게 덮어 "지운" 캔버스를 반환합니다.
 *
 * 알고리즘:
 *  1) 눈썹 랜드마크의 bounding box를 약간 확장한 영역을 덮을 블러 마스크 생성
 *  2) 영역 위쪽(이마 쪽)에서 평균 피부 색상 샘플
 *  3) 영역에 그라디언트 페인트로 부드럽게 덮음
 */

function bbox(points: Point[]): { x: number; y: number; w: number; h: number; cx: number; cy: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const w = maxX - minX;
  const h = maxY - minY;
  return { x: minX, y: minY, w, h, cx: minX + w / 2, cy: minY + h / 2 };
}

function sampleSkinAbove(ctx: CanvasRenderingContext2D, b: ReturnType<typeof bbox>): string {
  const sx = Math.max(0, Math.floor(b.x));
  const sy = Math.max(0, Math.floor(b.y - b.h * 1.5));
  const sw = Math.max(1, Math.floor(b.w));
  const sh = Math.max(1, Math.floor(b.h * 0.8));
  const data = ctx.getImageData(sx, sy, sw, sh).data;
  let r = 0, g = 0, bl = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    bl += data[i + 2];
    n++;
  }
  if (n === 0) return '#E5C5B0';
  return `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(bl / n)})`;
}

function paintCover(ctx: CanvasRenderingContext2D, b: ReturnType<typeof bbox>, color: string) {
  const padX = b.w * 0.25;
  const padY = b.h * 1.1;
  const x = b.x - padX;
  const y = b.y - padY * 0.4;
  const w = b.w + padX * 2;
  const h = b.h + padY;
  const grd = ctx.createRadialGradient(b.cx, b.cy, b.h * 0.3, b.cx, b.cy, Math.max(w, h) / 2);
  grd.addColorStop(0, color);
  // 가장자리는 점차 투명해지게
  const m = color.match(/rgb\((\d+),(\d+),(\d+)\)/);
  const transparent = m ? `rgba(${m[1]},${m[2]},${m[3]},0)` : 'rgba(229,197,176,0)';
  grd.addColorStop(1, transparent);
  ctx.save();
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.ellipse(b.cx, b.cy, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function eraseBrows(img: HTMLImageElement, landmarks: FaceLandmarks): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  for (const points of [landmarks.leftEyebrow, landmarks.rightEyebrow]) {
    if (!points || points.length < 2) continue;
    const b = bbox(points);
    const color = sampleSkinAbove(ctx, b);
    // 여러 번 페인트해서 자연스럽게
    for (let i = 0; i < 3; i++) paintCover(ctx, b, color);
  }
  return canvas;
}

export function canvasToImage(canvas: HTMLCanvasElement): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = canvas.toDataURL('image/png');
  });
}
