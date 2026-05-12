import type { BrowColor, Point } from './types';

export interface CoverBox {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: BrowColor;
}

export function createCoverBoxFromBrow(points: Point[], img: HTMLImageElement): CoverBox {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const padX = (maxX - minX) * 0.2;
  const padY = (maxY - minY) * 0.6;
  const x = Math.max(0, minX - padX);
  const y = Math.max(0, minY - padY);
  const width = Math.min(img.naturalWidth - x, maxX - minX + padX * 2);
  const height = Math.min(img.naturalHeight - y, maxY - minY + padY * 2);
  return {
    x,
    y,
    width,
    height,
    rotation: 0,
    color: pickColorAt(img, x, Math.max(0, y - height * 0.5)),
  };
}

export function pickColorAt(img: HTMLImageElement, x: number, y: number): BrowColor {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const cx = Math.max(0, Math.min(canvas.width - 1, Math.round(x)));
  const cy = Math.max(0, Math.min(canvas.height - 1, Math.round(y)));
  const d = ctx.getImageData(cx, cy, 1, 1).data;
  return { r: d[0], g: d[1], b: d[2] };
}
