'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import { tintBrow } from '@/lib/simulation/browColorTint';
import type { BrowTransform, EditTarget, FaceLandmarks, Point } from '@/lib/simulation/types';

interface Props {
  photoImage: HTMLImageElement;
  baseImage: HTMLImageElement | null;
  leftBrowImage: HTMLImageElement | null;
  rightBrowImage: HTMLImageElement | null;
  leftBrow: BrowTransform;
  rightBrow: BrowTransform;
  showBefore: boolean;
  compareMode: boolean;
  editTarget: EditTarget;
  landmarks?: FaceLandmarks | null;
  showLandmarks?: boolean;
  onDragLeft: (x: number, y: number) => void;
  onDragRight: (x: number, y: number) => void;
  onSelectTarget: (target: EditTarget) => void;
  onBrowGestureStart: (side: 'left' | 'right') => void;
  onBrowGesture: (side: 'left' | 'right', scaleRatio: number, rotationDeltaDeg: number) => void;
}

interface Pointer {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  side: 'left' | 'right';
}

function tintedCanvas(img: HTMLImageElement, t: BrowTransform): HTMLCanvasElement {
  return tintBrow(img, t.color);
}

function pointInBrow(px: number, py: number, img: HTMLImageElement, t: BrowTransform): boolean {
  const w = img.width * t.scaleX;
  const h = img.height * t.scaleY;
  const cx = t.x + w / 2;
  const cy = t.y + h / 2;
  const cos = Math.cos((-t.rotation * Math.PI) / 180);
  const sin = Math.sin((-t.rotation * Math.PI) / 180);
  const dx = px - cx;
  const dy = py - cy;
  const lx = dx * cos - dy * sin;
  const ly = dx * sin + dy * cos;
  return Math.abs(lx) <= w / 2 && Math.abs(ly) <= h / 2;
}

export default function EditorCanvas({
  photoImage,
  baseImage,
  leftBrowImage,
  rightBrowImage,
  leftBrow,
  rightBrow,
  showBefore,
  compareMode: _compareMode,
  editTarget,
  landmarks,
  showLandmarks,
  onDragLeft,
  onDragRight,
  onSelectTarget,
  onBrowGestureStart,
  onBrowGesture,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointersRef = useRef<Map<number, Pointer>>(new Map());
  const gestureStartRef = useRef<{ dist: number; angle: number; side: 'left' | 'right' } | null>(null);
  const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);

  const imgW = photoImage.naturalWidth;
  const imgH = photoImage.naturalHeight;

  // 캔버스 렌더
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = imgW;
    canvas.height = imgH;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, imgW, imgH);
    const bg = !showBefore && baseImage ? baseImage : photoImage;
    ctx.drawImage(bg, 0, 0);

    if (showBefore) return; // 원본 보기 모드 — 눈썹 그리지 않음

    const drawBrow = (img: HTMLImageElement | null, t: BrowTransform) => {
      if (!img) return;
      const tinted = tintedCanvas(img, t);
      const w = img.width * t.scaleX;
      const h = img.height * t.scaleY;
      const cx = t.x + w / 2;
      const cy = t.y + h / 2;
      ctx.save();
      ctx.globalAlpha = t.opacity;
      ctx.globalCompositeOperation = 'multiply';
      ctx.translate(cx, cy);
      ctx.rotate((t.rotation * Math.PI) / 180);
      ctx.drawImage(tinted, -w / 2, -h / 2, w, h);
      ctx.restore();

      // 살짝 추가 레이어로 진하게
      ctx.save();
      ctx.globalAlpha = t.opacity * 0.5;
      ctx.translate(cx, cy);
      ctx.rotate((t.rotation * Math.PI) / 180);
      ctx.drawImage(tinted, -w / 2, -h / 2, w, h);
      ctx.restore();
    };

    drawBrow(leftBrowImage, leftBrow);
    drawBrow(rightBrowImage, rightBrow);

    // 선택된 편집 대상 강조 표시
    if (!showBefore && (editTarget === 'left' || editTarget === 'right')) {
      const t = editTarget === 'left' ? leftBrow : rightBrow;
      const img = editTarget === 'left' ? leftBrowImage : rightBrowImage;
      if (img) {
        const w = img.width * t.scaleX;
        const h = img.height * t.scaleY;
        const cx = t.x + w / 2;
        const cy = t.y + h / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((t.rotation * Math.PI) / 180);
        ctx.strokeStyle = 'rgba(139,74,79,0.6)';
        ctx.lineWidth = Math.max(1, imgW * 0.003);
        ctx.setLineDash([imgW * 0.01, imgW * 0.005]);
        ctx.strokeRect(-w / 2, -h / 2, w, h);
        ctx.restore();
      }
    }

    // face-api 랜드마크 디버그 오버레이
    if (showLandmarks && landmarks) {
      const dotR = Math.max(2, imgW * 0.005);
      const drawDots = (pts: Point[] | undefined, fill: string) => {
        if (!pts || pts.length === 0) return;
        ctx.save();
        ctx.fillStyle = fill;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = Math.max(1, dotR * 0.4);
        for (const p of pts) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, dotR, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      };
      drawDots(landmarks.leftEyebrow, '#8B4A4F');
      drawDots(landmarks.rightEyebrow, '#8B4A4F');
      drawDots(landmarks.leftEye, '#A88080');
      drawDots(landmarks.rightEye, '#A88080');
      drawDots(landmarks.jaw, 'rgba(168,128,128,0.7)');
    }
  }, [
    photoImage, baseImage, leftBrowImage, rightBrowImage, leftBrow, rightBrow,
    showBefore, editTarget, imgW, imgH, landmarks, showLandmarks,
  ]);

  const screenToImage = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const sx = (clientX - rect.left) / rect.width;
      const sy = (clientY - rect.top) / rect.height;
      return { x: sx * imgW, y: sy * imgH };
    },
    [imgW, imgH],
  );

  const detectSide = useCallback(
    (ix: number, iy: number): 'left' | 'right' | null => {
      if (leftBrowImage && pointInBrow(ix, iy, leftBrowImage, leftBrow)) return 'left';
      if (rightBrowImage && pointInBrow(ix, iy, rightBrowImage, rightBrow)) return 'right';
      return null;
    },
    [leftBrow, rightBrow, leftBrowImage, rightBrowImage],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (showBefore) return;
      const { x: ix, y: iy } = screenToImage(e.clientX, e.clientY);
      const side = detectSide(ix, iy);
      if (!side) return;

      e.currentTarget.setPointerCapture(e.pointerId);

      pointersRef.current.set(e.pointerId, {
        id: e.pointerId,
        x: ix,
        y: iy,
        startX: ix,
        startY: iy,
        side,
      });

      // 두 번째 손가락이면 제스처 시작
      if (pointersRef.current.size === 2) {
        const arr = Array.from(pointersRef.current.values());
        const [p1, p2] = arr;
        // 두 손가락이 같은 쪽 눈썹 위에 있을 때만 제스처 처리
        if (p1.side === p2.side) {
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.hypot(dx, dy);
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          gestureStartRef.current = { dist, angle, side: p1.side };
          onBrowGestureStart(p1.side);
        }
      } else {
        // 단일 포인터 — 편집 대상 선택만 동기화 (드래그는 move에서)
        if (editTarget === 'both') {
          // both 유지
        } else if (editTarget !== side) {
          onSelectTarget(side);
        }
      }
    },
    [showBefore, screenToImage, detectSide, editTarget, onSelectTarget, onBrowGestureStart],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const ptr = pointersRef.current.get(e.pointerId);

      // 제스처 진행 중인지 먼저 확인
      const gs = gestureStartRef.current;

      if (!ptr) {
        // 호버 효과
        if (showBefore) {
          if (hoverSide) setHoverSide(null);
          return;
        }
        const { x: ix, y: iy } = screenToImage(e.clientX, e.clientY);
        const side = detectSide(ix, iy);
        if (side !== hoverSide) setHoverSide(side);
        return;
      }

      const { x: ix, y: iy } = screenToImage(e.clientX, e.clientY);
      ptr.x = ix;
      ptr.y = iy;

      if (gs && pointersRef.current.size >= 2) {
        const arr = Array.from(pointersRef.current.values()).filter((p) => p.side === gs.side);
        if (arr.length >= 2) {
          const [p1, p2] = arr;
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.hypot(dx, dy) || 1;
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          const ratio = dist / (gs.dist || 1);
          const dAngle = angle - gs.angle;
          onBrowGesture(gs.side, ratio, dAngle);
        }
        return;
      }

      // 단일 포인터 드래그
      const dx = ix - ptr.startX;
      const dy = iy - ptr.startY;
      const t = ptr.side === 'left' ? leftBrow : rightBrow;
      const newX = t.x + dx;
      const newY = t.y + dy;
      ptr.startX = ix;
      ptr.startY = iy;
      if (ptr.side === 'left') onDragLeft(newX, newY);
      else onDragRight(newX, newY);
    },
    [screenToImage, detectSide, hoverSide, showBefore, leftBrow, rightBrow, onDragLeft, onDragRight, onBrowGesture],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) {
      gestureStartRef.current = null;
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={(e) => {
        if (!pointersRef.current.has(e.pointerId)) setHoverSide(null);
      }}
      className={`absolute inset-0 w-full h-full object-contain touch-none select-none ${
        hoverSide ? 'cursor-grab' : 'cursor-default'
      }`}
      style={{ touchAction: 'none' }}
    />
  );
}
