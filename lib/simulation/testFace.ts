import type { FaceLandmarks } from './types';

export const TEST_FACE_WIDTH = 600;
export const TEST_FACE_HEIGHT = 800;

/**
 * 테스트용 합성 얼굴 이미지를 데이터 URL로 생성.
 * withBrows=true면 가이드 눈썹을 함께 그립니다.
 */
export function generateTestFaceImage(withBrows: boolean): string {
  const canvas = document.createElement('canvas');
  canvas.width = TEST_FACE_WIDTH;
  canvas.height = TEST_FACE_HEIGHT;
  const ctx = canvas.getContext('2d')!;

  // 배경
  ctx.fillStyle = '#F4ECE8';
  ctx.fillRect(0, 0, TEST_FACE_WIDTH, TEST_FACE_HEIGHT);

  const cx = TEST_FACE_WIDTH / 2;
  const cy = TEST_FACE_HEIGHT / 2 + 40;
  const faceW = TEST_FACE_WIDTH * 0.55;
  const faceH = TEST_FACE_HEIGHT * 0.62;

  // 얼굴 (피부톤 타원)
  const grd = ctx.createRadialGradient(cx, cy - 50, faceW * 0.3, cx, cy, faceW);
  grd.addColorStop(0, '#F8E1D2');
  grd.addColorStop(1, '#E5C5B0');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.ellipse(cx, cy, faceW / 2, faceH / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // 눈
  ctx.fillStyle = '#3A2D2D';
  const eyeY = cy - faceH * 0.1;
  const eyeOffset = faceW * 0.18;
  ctx.beginPath();
  ctx.ellipse(cx - eyeOffset, eyeY, 18, 8, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + eyeOffset, eyeY, 18, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // 코
  ctx.strokeStyle = '#C19A85';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, eyeY + 20);
  ctx.quadraticCurveTo(cx - 8, eyeY + 80, cx, eyeY + 100);
  ctx.stroke();

  // 입
  ctx.strokeStyle = '#A55C5C';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 40, eyeY + 160);
  ctx.quadraticCurveTo(cx, eyeY + 180, cx + 40, eyeY + 160);
  ctx.stroke();

  if (withBrows) {
    drawBrow(ctx, cx - eyeOffset, eyeY - 45, 90, 1);
    drawBrow(ctx, cx + eyeOffset, eyeY - 45, 90, -1);
  }

  return canvas.toDataURL('image/png');
}

function drawBrow(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, dir: 1 | -1) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = '#3D2A22';
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.quadraticCurveTo(0, -10 * dir, w / 2, 0);
  ctx.quadraticCurveTo(0, 5 * dir, -w / 2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * 테스트 얼굴 이미지에 맞는 합성 랜드마크.
 */
export function generateTestFaceLandmarks(width: number, height: number): FaceLandmarks {
  const cx = width / 2;
  const cy = height / 2 + 40;
  const faceH = height * 0.62;
  const faceW = width * 0.55;
  const eyeY = cy - faceH * 0.1;
  const eyeOffset = faceW * 0.18;
  const browY = eyeY - 45;

  const make = (centerX: number): { x: number; y: number }[] => {
    const w = 90;
    return Array.from({ length: 6 }).map((_, i) => ({
      x: centerX - w / 2 + (w * i) / 5,
      y: browY - Math.sin((i / 5) * Math.PI) * 4,
    }));
  };

  return {
    leftEyebrow: make(cx + eyeOffset),
    rightEyebrow: make(cx - eyeOffset),
  };
}
