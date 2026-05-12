/**
 * 좌·우 양쪽 눈썹이 포함된 PNG/JPEG를 받아서 두 개의 이미지로 분리합니다.
 *
 * 단순 휴리스틱: 알파(또는 어두운 픽셀) 분포의 X축 히스토그램에서 가장 비어있는 컬럼을
 * 분할선으로 사용합니다. JPEG처럼 알파가 없는 입력도 처리할 수 있도록 임계값 기반.
 */

export interface ProcessedBrows {
  left: HTMLImageElement;
  right: HTMLImageElement;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToImage(canvas: HTMLCanvasElement): Promise<HTMLImageElement> {
  return loadImage(canvas.toDataURL('image/png'));
}

function findMidColumn(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  const imgData = ctx.getImageData(0, 0, w, h).data;
  const density = new Array(w).fill(0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = imgData[i + 3];
      const lum = (imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3;
      // 픽셀이 "내용 있음"으로 간주되는 조건: 알파가 있고 밝기가 너무 밝지 않음
      if (a > 30 && lum < 230) density[x]++;
    }
  }
  // 중앙 50% 영역에서 가장 비어있는 컬럼 찾기
  const start = Math.floor(w * 0.25);
  const end = Math.floor(w * 0.75);
  let minIdx = Math.floor(w / 2);
  let minVal = Infinity;
  for (let x = start; x < end; x++) {
    if (density[x] < minVal) {
      minVal = density[x];
      minIdx = x;
    }
  }
  return minIdx;
}

function trimAlpha(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;
  const data = ctx.getImageData(0, 0, w, h).data;
  let minX = w, minY = h, maxX = 0, maxY = 0;
  let found = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = data[i + 3];
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (a > 30 && lum < 230) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!found) return canvas;
  const pad = 4;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const tw = maxX - minX + 1;
  const th = maxY - minY + 1;
  const out = document.createElement('canvas');
  out.width = tw;
  out.height = th;
  out.getContext('2d')!.drawImage(canvas, minX, minY, tw, th, 0, 0, tw, th);
  return out;
}

export async function processBrowPng(srcDataUrl: string): Promise<ProcessedBrows> {
  const img = await loadImage(srcDataUrl);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const mid = findMidColumn(ctx, w, h);

  const leftCanvas = document.createElement('canvas');
  leftCanvas.width = w - mid;
  leftCanvas.height = h;
  leftCanvas.getContext('2d')!.drawImage(canvas, mid, 0, w - mid, h, 0, 0, w - mid, h);

  const rightCanvas = document.createElement('canvas');
  rightCanvas.width = mid;
  rightCanvas.height = h;
  rightCanvas.getContext('2d')!.drawImage(canvas, 0, 0, mid, h, 0, 0, mid, h);

  const leftTrim = trimAlpha(leftCanvas);
  const rightTrim = trimAlpha(rightCanvas);

  const [left, right] = await Promise.all([canvasToImage(leftTrim), canvasToImage(rightTrim)]);
  return { left, right };
}
