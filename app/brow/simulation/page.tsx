'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Camera, RotateCcw, Save, Loader2, Wand2, ArrowLeft, Eye, Pipette, Crosshair } from 'lucide-react';
import { detectFaceLandmarks, preloadFaceModels } from '@/lib/simulation/faceDetection';
import { generateTestFaceImage, generateTestFaceLandmarks, TEST_FACE_WIDTH, TEST_FACE_HEIGHT } from '@/lib/simulation/testFace';
import { processBrowPng, ProcessedBrows } from '@/lib/simulation/browPngProcessor';
import { tintBrow, DEFAULT_BROW_COLOR } from '@/lib/simulation/browColorTint';
import { eraseBrows, canvasToImage } from '@/lib/simulation/browEraser';
import { CoverBox, createCoverBoxFromBrow, pickColorAt } from '@/lib/simulation/coverBox';
import { BrowTransform, BrowColor, FaceLandmarks, EditTarget } from '@/lib/simulation/types';
import EditorCanvas from '@/components/simulation/EditorCanvas';
import BrowStylePicker, { BrowStyle } from '@/components/simulation/BrowStylePicker';

const KAKAO_URL = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL || 'https://pf.kakao.com/';

const STYLES: BrowStyle[] = [
  { id: 'natural', name: '자연스러운 결', img: '/brows/natural.svg' },
  { id: 'defined', name: '또렷한 아치', img: '/brows/defined.svg' },
  { id: 'full', name: '풍성한 볼륨', img: '/brows/full.svg' },
  { id: 'light', name: '가벼운 결', img: '/brows/light.svg' },
];

const COLOR_PRESETS: { name: string; color: BrowColor }[] = [
  { name: '블랙', color: { r: 30, g: 26, b: 26 } },
  { name: '다크 브라운', color: { r: 60, g: 38, b: 30 } },
  { name: '브라운', color: { r: 90, g: 60, b: 45 } },
  { name: '미디엄', color: { r: 115, g: 80, b: 60 } },
  { name: '라이트', color: { r: 145, g: 105, b: 80 } },
];

type BrowMods = {
  sizeMult: number;
  widthMult: number;
  thicknessMult: number;
  rotation: number;
};

const DEFAULT_MODS: BrowMods = { sizeMult: 1, widthMult: 1, thicknessMult: 1, rotation: 0 };

const DEFAULT_BROW: BrowTransform = {
  x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 0.85,
  color: DEFAULT_BROW_COLOR,
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * 파일을 dataURL로 변환.
 * - EXIF orientation 적용 (카메라 사진 회전 문제 해결)
 * - 최대 1600px로 다운스케일 (모바일 메모리 절약 — 4032x3024 → 1600x1200)
 * - 다운스케일 결과: 캔버스 48MB → 8MB, 후속 처리(eraser, cover) 메모리 6배 감소
 */
async function fileToDataUrl(file: File): Promise<string> {
  const MAX_DIM = 1600;

  // 1차: createImageBitmap + 다운스케일
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    let w = bitmap.width, h = bitmap.height;
    if (w > MAX_DIM || h > MAX_DIM) {
      const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch (err) {
    console.warn('createImageBitmap 실패, FileReader로 폴백:', err);
    // fallback: FileReader로 원본 그대로 읽기 (다운스케일 못함)
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = (e) => {
        console.error('FileReader 실패:', e);
        reject(new Error('파일을 읽을 수 없습니다'));
      };
      r.readAsDataURL(file);
    });
  }
}

async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

function calculatePlacement(
  landmarks: FaceLandmarks | null,
  brows: ProcessedBrows,
  imageWidth: number,
  imageHeight: number,
  color: BrowColor,
): { left: BrowTransform; right: BrowTransform } {
  const base = { rotation: 0, opacity: 0.85, color };

  if (landmarks) {
    const lp = landmarks.leftEyebrow, rp = landmarks.rightEyebrow;
    const avg = (pts: { x: number; y: number }[]) => ({
      x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
      y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
    });
    const lc = avg(lp), rc = avg(rp);
    const lxs = lp.map((p) => p.x), rxs = rp.map((p) => p.x);
    const lw = (Math.max(...lxs) - Math.min(...lxs)) * 1.4;
    const rw = (Math.max(...rxs) - Math.min(...rxs)) * 1.4;
    const ls = lw / brows.left.width, rs = rw / brows.right.width;
    const lys = lp.map((p) => p.y), rys = rp.map((p) => p.y);
    const voL = (Math.max(...lys) - Math.min(...lys)) * 0.3;
    const voR = (Math.max(...rys) - Math.min(...rys)) * 0.3;
    return {
      left: { x: lc.x - (brows.left.width * ls) / 2, y: lc.y - (brows.left.height * ls) / 2 - voL, scaleX: ls, scaleY: ls, ...base },
      right: { x: rc.x - (brows.right.width * rs) / 2, y: rc.y - (brows.right.height * rs) / 2 - voR, scaleX: rs, scaleY: rs, ...base },
    };
  }

  const tw = imageWidth * 0.2;
  const ls = tw / brows.left.width, rs = tw / brows.right.width;
  return {
    left: { x: imageWidth * 0.55, y: imageHeight * 0.28, scaleX: ls, scaleY: ls, ...base },
    right: { x: imageWidth * 0.2, y: imageHeight * 0.28, scaleX: rs, scaleY: rs, ...base },
  };
}

export default function SimulationPage() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoImage, setPhotoImage] = useState<HTMLImageElement | null>(null);
  const [erasedImage, setErasedImage] = useState<HTMLImageElement | null>(null);
  const [eraseEnabled, setEraseEnabled] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);

  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [isProcessingBrow, setIsProcessingBrow] = useState(false);

  const [leftBrow, setLeftBrow] = useState<BrowTransform>(DEFAULT_BROW);
  const [rightBrow, setRightBrow] = useState<BrowTransform>(DEFAULT_BROW);
  const [leftBrowImage, setLeftBrowImage] = useState<HTMLImageElement | null>(null);
  const [rightBrowImage, setRightBrowImage] = useState<HTMLImageElement | null>(null);

  const [leftMods, setLeftMods] = useState<BrowMods>(DEFAULT_MODS);
  const [rightMods, setRightMods] = useState<BrowMods>(DEFAULT_MODS);
  const [editTarget, setEditTarget] = useState<EditTarget>('both');

  const [browColor, setBrowColor] = useState<BrowColor>(DEFAULT_BROW_COLOR);
  const [showBefore, setShowBefore] = useState(false);
  const [landmarks, setLandmarks] = useState<FaceLandmarks | null>(null);
  const [showLandmarks, setShowLandmarks] = useState(false);

  // 수동 가리개 박스 (좌/우)
  const [leftCover, setLeftCover] = useState<CoverBox | null>(null);
  const [rightCover, setRightCover] = useState<CoverBox | null>(null);
  const [coverEnabled, setCoverEnabled] = useState(false);
  const [eyedropperFor, setEyedropperFor] = useState<'left' | 'right' | null>(null);

  const baseScaleRef = useRef({ left: 1, right: 1 });
  const landmarksRef = useRef<FaceLandmarks | null>(null);
  const gestureStartRef = useRef<{ left: BrowMods; right: BrowMods } | null>(null);

  const hasBrows = leftBrowImage && rightBrowImage;

  // 페이지 진입 시 face-api 모델을 미리 로드 — 첫 검출 지연을 줄임
  useEffect(() => {
    preloadFaceModels();
  }, []);

  // mods 변경 시 BrowTransform에 반영 (중심 피벗 유지)
  useEffect(() => {
    if (!leftBrowImage) return;
    const base = baseScaleRef.current.left;
    const newScaleX = base * leftMods.sizeMult * leftMods.widthMult;
    const newScaleY = base * leftMods.sizeMult * leftMods.thicknessMult;
    setLeftBrow((prev) => {
      const oldW = leftBrowImage.width * prev.scaleX;
      const oldH = leftBrowImage.height * prev.scaleY;
      const newW = leftBrowImage.width * newScaleX;
      const newH = leftBrowImage.height * newScaleY;
      return {
        ...prev,
        scaleX: newScaleX,
        scaleY: newScaleY,
        rotation: leftMods.rotation,
        x: prev.x + (oldW - newW) / 2,
        y: prev.y + (oldH - newH) / 2,
      };
    });
  }, [leftMods, leftBrowImage]);

  useEffect(() => {
    if (!rightBrowImage) return;
    const base = baseScaleRef.current.right;
    const newScaleX = base * rightMods.sizeMult * rightMods.widthMult;
    const newScaleY = base * rightMods.sizeMult * rightMods.thicknessMult;
    setRightBrow((prev) => {
      const oldW = rightBrowImage.width * prev.scaleX;
      const oldH = rightBrowImage.height * prev.scaleY;
      const newW = rightBrowImage.width * newScaleX;
      const newH = rightBrowImage.height * newScaleY;
      return {
        ...prev,
        scaleX: newScaleX,
        scaleY: newScaleY,
        rotation: rightMods.rotation,
        x: prev.x + (oldW - newW) / 2,
        y: prev.y + (oldH - newH) / 2,
      };
    });
  }, [rightMods, rightBrowImage]);

  const placeBrows = useCallback(
    (brows: ProcessedBrows, img: HTMLImageElement, lm: FaceLandmarks | null, color: BrowColor) => {
      setLeftBrowImage(brows.left);
      setRightBrowImage(brows.right);
      const placement = calculatePlacement(lm, brows, img.naturalWidth, img.naturalHeight, color);
      baseScaleRef.current = { left: placement.left.scaleX, right: placement.right.scaleX };
      setLeftMods(DEFAULT_MODS);
      setRightMods(DEFAULT_MODS);
      setLeftBrow(placement.left);
      setRightBrow(placement.right);
    },
    [],
  );

  const processPhoto = useCallback(
    async (
      dataUrl: string,
      options?: { precomputedLandmarks?: FaceLandmarks; precomputedErasedDataUrl?: string },
    ) => {
      setPhoto(dataUrl);
      setIsDetecting(true);
      setErasedImage(null);

      const img = new window.Image();
      img.onerror = (e) => {
        console.error('이미지 로드 실패:', e);
        setIsDetecting(false);
      };
      img.onload = async () => {
        try {
          setPhotoImage(img);
          const lm = options?.precomputedLandmarks ?? (await detectFaceLandmarks(img));
          landmarksRef.current = lm;
          setLandmarks(lm);

          // 1) 미리 만들어진 깨끗한 버전이 있으면 그걸 직접 erasedImage로 사용 (테스트 모드)
          if (options?.precomputedErasedDataUrl) {
            const cleanImg = new window.Image();
            cleanImg.onload = () => setErasedImage(cleanImg);
            cleanImg.src = options.precomputedErasedDataUrl;
          }
          // 2) 그 외엔 자동 지우기 알고리즘 적용
          else if (lm) {
            try {
              const erasedCanvas = eraseBrows(img, lm);
              const erased = await canvasToImage(erasedCanvas);
              setErasedImage(erased);
            } catch (err) {
              console.error('눈썹 지우기 실패:', err);
            }
          }

          // 수동 가리개 박스 자동 생성은 일단 비활성화 (안정화 우선)
          // if (lm) {
          //   try {
          //     setLeftCover(createCoverBoxFromBrow(lm.leftEyebrow, img));
          //     setRightCover(createCoverBoxFromBrow(lm.rightEyebrow, img));
          //   } catch (err) {
          //     console.error('가리개 박스 생성 실패:', err);
          //   }
          // }

          if (leftBrowImage && rightBrowImage) {
            placeBrows({ left: leftBrowImage, right: rightBrowImage }, img, lm, browColor);
          }
        } catch (err) {
          console.error('사진 처리 중 오류:', err);
        } finally {
          setIsDetecting(false);
        }
      };
      img.src = dataUrl;
    },
    [browColor, leftBrowImage, rightBrowImage, placeBrows],
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      try {
        const dataUrl = await fileToDataUrl(f);
        await processPhoto(dataUrl);
      } catch (err) {
        console.error('사진 업로드 실패:', err);
        alert('사진을 불러올 수 없어요. 다른 사진으로 시도해 주세요.');
      } finally {
        e.target.value = '';
      }
    },
    [processPhoto],
  );

  const handleTestMode = useCallback(async () => {
    const dataUrl = generateTestFaceImage(true); // 가이드 눈썹 있는 버전
    const cleanDataUrl = generateTestFaceImage(false); // 눈썹 없는 깨끗한 버전 (가리기용)
    const lm = generateTestFaceLandmarks(TEST_FACE_WIDTH, TEST_FACE_HEIGHT);
    await processPhoto(dataUrl, { precomputedLandmarks: lm, precomputedErasedDataUrl: cleanDataUrl });
  }, [processPhoto]);

  const handleSelectStyle = useCallback(
    async (style: BrowStyle) => {
      if (style.comingSoon) return;
      setIsProcessingBrow(true);
      try {
        const dataUrl = await urlToDataUrl(style.img);
        const processed = await processBrowPng(dataUrl);
        setSelectedStyleId(style.id);
        if (photoImage) {
          placeBrows(processed, photoImage, landmarksRef.current, browColor);
        } else {
          setLeftBrowImage(processed.left);
          setRightBrowImage(processed.right);
        }
      } catch (err) {
        console.error('스타일 적용 실패:', err);
        alert('스타일을 적용할 수 없어요. 잠시 후 다시 시도해 주세요.');
      } finally {
        setIsProcessingBrow(false);
      }
    },
    [photoImage, browColor, placeBrows],
  );

  // editTarget 기준으로 mod 업데이트
  const updateMod = useCallback(
    (patch: Partial<BrowMods>) => {
      if (editTarget === 'left' || editTarget === 'both') {
        setLeftMods((prev) => ({ ...prev, ...patch }));
      }
      if (editTarget === 'right' || editTarget === 'both') {
        setRightMods((prev) => ({ ...prev, ...patch }));
      }
    },
    [editTarget],
  );

  const displayedMods = editTarget === 'right' ? rightMods : leftMods;

  const handleColorChange = useCallback((color: BrowColor) => {
    setBrowColor(color);
    setLeftBrow((prev) => ({ ...prev, color }));
    setRightBrow((prev) => ({ ...prev, color }));
  }, []);

  // 드래그: editTarget이 'both'면 다른쪽도 같은 수평선(중심 Y)에 맞춰 따라옴
  const handleDragLeft = useCallback(
    (x: number, y: number) => {
      setLeftBrow((prev) => ({ ...prev, x, y }));
      if (editTarget === 'both' && leftBrowImage && rightBrowImage) {
        setRightBrow((rPrev) => {
          const leftH = leftBrowImage.height * leftBrow.scaleY;
          const rightH = rightBrowImage.height * rPrev.scaleY;
          const leftCenterY = y + leftH / 2;
          return { ...rPrev, y: leftCenterY - rightH / 2 };
        });
      }
    },
    [editTarget, leftBrow.scaleY, leftBrowImage, rightBrowImage],
  );

  const handleDragRight = useCallback(
    (x: number, y: number) => {
      setRightBrow((prev) => ({ ...prev, x, y }));
      if (editTarget === 'both' && leftBrowImage && rightBrowImage) {
        setLeftBrow((lPrev) => {
          const rightH = rightBrowImage.height * rightBrow.scaleY;
          const leftH = leftBrowImage.height * lPrev.scaleY;
          const rightCenterY = y + rightH / 2;
          return { ...lPrev, y: rightCenterY - leftH / 2 };
        });
      }
    },
    [editTarget, rightBrow.scaleY, leftBrowImage, rightBrowImage],
  );

  const handleBrowGestureStart = useCallback(
    (_side: 'left' | 'right') => {
      gestureStartRef.current = { left: leftMods, right: rightMods };
    },
    [leftMods, rightMods],
  );

  const handleBrowGesture = useCallback(
    (_touchedSide: 'left' | 'right', scaleRatio: number, rotationDeltaDeg: number) => {
      const start = gestureStartRef.current;
      if (!start) return;

      const apply = (s: 'left' | 'right') => {
        const startMod = s === 'left' ? start.left : start.right;
        const newSize = clamp(startMod.sizeMult * scaleRatio, 0.5, 2.0);
        const newRot = clamp(startMod.rotation + rotationDeltaDeg, -45, 45);
        const setter = s === 'left' ? setLeftMods : setRightMods;
        setter((prev) => ({ ...prev, sizeMult: newSize, rotation: newRot }));
      };

      // 기본은 editTarget을 따라감 — 'both'면 양쪽이 같은 비율로 움직임
      if (editTarget === 'both') {
        apply('left');
        apply('right');
      } else {
        apply(editTarget);
      }
    },
    [editTarget],
  );

  const handleSave = useCallback(() => {
    if (!photoImage) return;
    const canvas = document.createElement('canvas');
    canvas.width = photoImage.naturalWidth;
    canvas.height = photoImage.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    const baseImg = eraseEnabled && erasedImage ? erasedImage : photoImage;
    ctx.drawImage(baseImg, 0, 0);

    const drawBrow = (browImg: HTMLImageElement | null, t: BrowTransform) => {
      if (!browImg) return;
      const tinted = tintBrow(browImg, t.color);
      const w = browImg.width * t.scaleX, h = browImg.height * t.scaleY;
      const cx = t.x + w / 2, cy = t.y + h / 2;
      ctx.save();
      ctx.globalAlpha = t.opacity;
      ctx.globalCompositeOperation = 'multiply';
      ctx.translate(cx, cy);
      ctx.rotate((t.rotation * Math.PI) / 180);
      ctx.drawImage(tinted, -w / 2, -h / 2, w, h);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = t.opacity * 0.5;
      ctx.translate(cx, cy);
      ctx.rotate((t.rotation * Math.PI) / 180);
      ctx.drawImage(tinted, -w / 2, -h / 2, w, h);
      ctx.restore();
    };
    drawBrow(leftBrowImage, leftBrow);
    drawBrow(rightBrowImage, rightBrow);

    const link = document.createElement('a');
    link.download = `brow-simulation-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [photoImage, erasedImage, eraseEnabled, leftBrowImage, rightBrowImage, leftBrow, rightBrow]);

  const handleResetAll = useCallback(() => {
    if (photo && !confirm('처음부터 다시 시작할까요? 현재 작업 내용은 사라집니다.')) return;
    setPhoto(null);
    setPhotoImage(null);
    setErasedImage(null);
    setSelectedStyleId(null);
    setLeftBrow(DEFAULT_BROW);
    setRightBrow(DEFAULT_BROW);
    setLeftBrowImage(null);
    setRightBrowImage(null);
    setLeftMods(DEFAULT_MODS);
    setRightMods(DEFAULT_MODS);
    setEditTarget('both');
    setShowBefore(false);
    setBrowColor(DEFAULT_BROW_COLOR);
    setLeftCover(null);
    setRightCover(null);
    setCoverEnabled(false);
    setEyedropperFor(null);
    landmarksRef.current = null;
    setLandmarks(null);
    setShowLandmarks(false);
  }, [photo]);

  // 수동 가리개 박스 이동 핸들러
  const handleMoveLeftCover = useCallback((x: number, y: number) => {
    setLeftCover((prev) => (prev ? { ...prev, x, y } : prev));
  }, []);
  const handleMoveRightCover = useCallback((x: number, y: number) => {
    setRightCover((prev) => (prev ? { ...prev, x, y } : prev));
  }, []);

  // 스포이드 — 사진 클릭 → 그 픽셀 색상을 타겟 cover에 적용
  const handleEyedropperPick = useCallback(
    (imageX: number, imageY: number) => {
      if (!photoImage || !eyedropperFor) return;
      const color = pickColorAt(photoImage, imageX, imageY);
      if (eyedropperFor === 'left') {
        setLeftCover((prev) => (prev ? { ...prev, color } : prev));
      } else {
        setRightCover((prev) => (prev ? { ...prev, color } : prev));
      }
      setEyedropperFor(null);
    },
    [photoImage, eyedropperFor],
  );

  const handleResetMods = useCallback(() => {
    if (editTarget === 'left' || editTarget === 'both') setLeftMods(DEFAULT_MODS);
    if (editTarget === 'right' || editTarget === 'both') setRightMods(DEFAULT_MODS);
  }, [editTarget]);

  /** 적용한 스타일만 빼기 — 사진/지우기 상태는 유지 */
  const handleRemoveStyle = useCallback(() => {
    setSelectedStyleId(null);
    setLeftBrow(DEFAULT_BROW);
    setRightBrow(DEFAULT_BROW);
    setLeftBrowImage(null);
    setRightBrowImage(null);
    setLeftMods(DEFAULT_MODS);
    setRightMods(DEFAULT_MODS);
    setEditTarget('both');
    setShowBefore(false);
  }, []);

  const baseImageForCanvas = eraseEnabled ? erasedImage : null;

  return (
    <>
      <section className="container-narrow py-16 sm:py-20 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="h-px w-10 bg-[#A88080]" />
          <p className="text-[#8B7A7A] text-[11px] tracking-eyebrow uppercase">Simulation Studio</p>
          <span className="h-px w-10 bg-[#A88080]" />
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl mb-4 text-[#3A2D2D] tracking-tight">
          스타일 <em className="italic font-light text-[#8B4A4F]">시뮬레이션</em>
        </h1>
        <p className="text-[#8B7A7A] text-sm max-w-md mx-auto leading-relaxed font-light">
          본인 사진 위에 눈썹 스타일을 직접 얹어보세요.
          <br />
          색감·크기·위치까지 조정한 결과를 그대로 저장할 수 있습니다.
        </p>
      </section>

      <div className="h-px bg-[#E8DCD7]" />

      <section className="container-narrow py-10 sm:py-14">
        {photo && (
          <div className="mb-5">
            <button
              onClick={handleResetAll}
              className="text-[11px] tracking-cta uppercase text-[#A88080] hover:text-[#8B4A4F] flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3 h-3" /> 사진 다시 올리기
            </button>
          </div>
        )}

        {!photo ? (
          /* 업로드 화면 — 가운데 정렬 */
          <div className="max-w-xl mx-auto flex flex-col gap-3">
            <div className="text-center mb-2">
              <p className="text-[10px] tracking-eyebrow uppercase text-[#A88080] mb-2">Step 01</p>
              <h2 className="font-serif text-2xl text-[#3A2D2D]">사진을 올려주세요</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="bg-[#FFFFFF] border border-[#E8DCD7] hover:border-[#A88080] hover:shadow-[0_4px_16px_rgba(28,28,28,0.04)] transition p-5 cursor-pointer flex items-center gap-4 group">
                <input type="file" accept="image/*" onChange={handleFileUpload} className="sr-only" />
                <div className="w-12 h-12 rounded-full bg-[#F4ECE8] border border-[#E8DCD7] flex items-center justify-center group-hover:border-[#8B4A4F] transition-colors shrink-0">
                  <Upload className="w-5 h-5 text-[#8B4A4F]" />
                </div>
                <div>
                  <p className="font-serif text-base text-[#3A2D2D] mb-0.5">갤러리에서</p>
                  <p className="text-xs text-[#8B7A7A]">사진첩에서 선택</p>
                </div>
              </label>

              <label className="bg-[#FFFFFF] border border-[#E8DCD7] hover:border-[#A88080] hover:shadow-[0_4px_16px_rgba(28,28,28,0.04)] transition p-5 cursor-pointer flex items-center gap-4 group">
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
                <div className="w-12 h-12 rounded-full bg-[#F4ECE8] border border-[#E8DCD7] flex items-center justify-center group-hover:border-[#8B4A4F] transition-colors shrink-0">
                  <Camera className="w-5 h-5 text-[#8B4A4F]" />
                </div>
                <div>
                  <p className="font-serif text-base text-[#3A2D2D] mb-0.5">카메라로</p>
                  <p className="text-xs text-[#8B7A7A]">정면 촬영</p>
                </div>
              </label>
            </div>

            <button
              onClick={handleTestMode}
              className="bg-[#F4ECE8] border border-dashed border-[#A88080]/40 hover:border-[#8B4A4F] hover:bg-[#F4ECE8]/60 transition p-4 text-center"
            >
              <p className="text-[10px] tracking-brow uppercase text-[#A88080] mb-1">Test Mode</p>
              <p className="text-sm text-[#3A2D2D]">사진 없이 샘플 얼굴로 미리 보기</p>
            </button>

            <p className="text-[10px] text-[#8B7A7A] text-center leading-relaxed">
              업로드된 이미지는 브라우저 안에서만 처리되며 서버로 전송되지 않습니다.
            </p>
          </div>
        ) : (
          /* 시뮬레이션 화면 — 캔버스 hero + 오른쪽 통합 컨트롤 패널 */
          <div className="grid gap-6 lg:gap-8 lg:grid-cols-[1fr_320px] items-start">
            {/* LEFT: Canvas hero */}
            <div className="flex flex-col gap-4">
              <div className="bg-[#FFFFFF] shadow-[0_2px_24px_rgba(58,45,45,0.06)] overflow-hidden">
                <div
                  className="relative bg-[#F4ECE8] mx-auto w-full"
                  style={
                    photoImage
                      ? {
                          aspectRatio: `${photoImage.naturalWidth} / ${photoImage.naturalHeight}`,
                          maxHeight: 'min(70vh, 620px)',
                          maxWidth: `calc(min(70vh, 620px) * ${photoImage.naturalWidth} / ${photoImage.naturalHeight})`,
                        }
                      : { aspectRatio: '3 / 4', maxHeight: 'min(70vh, 620px)' }
                  }
                >
                  {photoImage && (
                    <EditorCanvas
                      photoImage={photoImage}
                      baseImage={baseImageForCanvas}
                      leftBrowImage={leftBrowImage}
                      rightBrowImage={rightBrowImage}
                      leftBrow={leftBrow}
                      rightBrow={rightBrow}
                      showBefore={showBefore}
                      compareMode={false}
                      editTarget={editTarget}
                      landmarks={landmarks}
                      showLandmarks={showLandmarks}
                      onDragLeft={handleDragLeft}
                      onDragRight={handleDragRight}
                      onSelectTarget={(t) => setEditTarget(t)}
                      onBrowGestureStart={handleBrowGestureStart}
                      onBrowGesture={handleBrowGesture}
                    />
                  )}
                  {isDetecting && (
                    <div className="absolute inset-0 bg-[#F4ECE8]/85 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 text-[#8B4A4F] animate-spin" />
                        <p className="text-[10px] tracking-brow uppercase text-[#8B7A7A]">얼굴 인식 중</p>
                      </div>
                    </div>
                  )}

                  {/* 좌상단: 스타일 빼기 (눈썹 적용 후에만) */}
                  {hasBrows && (
                    <button
                      onClick={handleRemoveStyle}
                      className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3.5 py-2 rounded-full text-[11px] tracking-cta uppercase text-[#8B7A7A] hover:text-[#8B4A4F] flex items-center gap-1.5 shadow-sm transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> 스타일 빼기
                    </button>
                  )}

                  {/* 우상단: 누르고 있는 동안 원본 사진 보기 (가리기 적용 전) */}
                  <button
                    onMouseEnter={() => setShowBefore(true)}
                    onMouseLeave={() => setShowBefore(false)}
                    onTouchStart={() => setShowBefore(true)}
                    onTouchEnd={() => setShowBefore(false)}
                    onTouchCancel={() => setShowBefore(false)}
                    className={`absolute top-3 right-3 backdrop-blur px-3.5 py-2 rounded-full text-[11px] tracking-cta uppercase flex items-center gap-1.5 shadow-sm transition select-none ${
                      showBefore
                        ? 'bg-[#8B4A4F] text-[#F4ECE8]'
                        : 'bg-white/90 text-[#8B7A7A] hover:text-[#8B4A4F]'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {showBefore ? '원본 보는 중' : '원본 보기'}
                  </button>

                  {/* 좌측 하단: 디버그 — face-api 랜드마크 표시 토글 */}
                  {photoImage && !isDetecting && landmarks && (
                    <button
                      onClick={() => setShowLandmarks((v) => !v)}
                      title="검출된 얼굴 랜드마크를 점으로 표시 (디버그)"
                      className={`absolute bottom-3 left-3 backdrop-blur px-3.5 py-2 rounded-full text-[11px] tracking-cta uppercase flex items-center gap-1.5 shadow-md transition select-none ${
                        showLandmarks
                          ? 'bg-[#8B4A4F] text-[#F4ECE8]'
                          : 'bg-white/95 text-[#8B7A7A] hover:text-[#8B4A4F]'
                      }`}
                      aria-pressed={showLandmarks}
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      랜드마크
                    </button>
                  )}

                  {/* 우측 하단: 얼굴 인식 + 눈썹 지우기 토글 */}
                  {photoImage && !isDetecting && (
                    <button
                      onClick={() => erasedImage && setEraseEnabled((v) => !v)}
                      disabled={!erasedImage}
                      title={
                        erasedImage
                          ? '얼굴을 인식해서 본인 눈썹을 피부톤으로 대체합니다'
                          : '얼굴을 인식하지 못했어요. 정면 사진으로 다시 시도해 주세요.'
                      }
                      className={`absolute bottom-3 right-3 backdrop-blur px-3.5 py-2 rounded-full text-[11px] tracking-cta uppercase flex items-center gap-1.5 shadow-md transition select-none ${
                        !erasedImage
                          ? 'bg-white/80 text-[#A88080]/60 cursor-not-allowed'
                          : eraseEnabled
                          ? 'bg-[#8B4A4F] text-[#F4ECE8]'
                          : 'bg-white/95 text-[#8B7A7A] hover:text-[#8B4A4F]'
                      }`}
                      aria-pressed={eraseEnabled && !!erasedImage}
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      {!erasedImage ? '얼굴 인식 실패' : eraseEnabled ? '눈썹 지운 상태' : '눈썹 지우기'}
                    </button>
                  )}
                </div>
              </div>

              {hasBrows && (
                <p className="text-[11px] text-[#8B7A7A] text-center font-light">
                  눈썹을 드래그해서 위치 이동 · 두 손가락(눈썹 위)으로 크기·각도 조정
                </p>
              )}
            </div>

            {/* RIGHT: 통합 컨트롤 패널 */}
            <aside className="lg:sticky lg:top-24 flex flex-col bg-[#FFFFFF] shadow-[0_2px_24px_rgba(58,45,45,0.06)] lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              {/* Step 02 · Style */}
              <div className="p-5 border-b border-[#F0E6E0]">
                <p className="text-[10px] tracking-eyebrow uppercase text-[#A88080] mb-3">Step 02 · Style</p>
                <BrowStylePicker
                  styles={STYLES}
                  selectedId={selectedStyleId}
                  isProcessing={isProcessingBrow}
                  onSelect={handleSelectStyle}
                />
              </div>

              {/* 수동 가리개 박스는 안정화 후 다시 추가 예정 */}

              {/* Step 03 · Adjust (눈썹 적용 후만) */}
              {hasBrows && (
                <>
                  <div className="p-5 border-b border-[#F0E6E0] flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] tracking-eyebrow uppercase text-[#A88080]">Step 03 · Adjust</p>
                      <button
                        onClick={handleResetMods}
                        className="text-[10px] tracking-cta uppercase text-[#A88080] hover:text-[#8B4A4F] flex items-center gap-1 transition"
                      >
                        <RotateCcw className="w-3 h-3" /> 리셋
                      </button>
                    </div>

                    {/* 편집 대상 */}
                    <div className="grid grid-cols-3 gap-1 bg-[#F4ECE8] p-1">
                      {(['both', 'left', 'right'] as const).map((t) => {
                        const label = t === 'both' ? '양쪽' : t === 'left' ? '왼쪽' : '오른쪽';
                        const active = editTarget === t;
                        return (
                          <button
                            key={t}
                            onClick={() => setEditTarget(t)}
                            className={`py-1.5 text-[10px] tracking-cta uppercase transition ${
                              active ? 'bg-[#8B4A4F] text-[#F4ECE8]' : 'text-[#8B7A7A] hover:text-[#3A2D2D]'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    <SliderRow
                      label="크기"
                      value={displayedMods.sizeMult}
                      min={0.5}
                      max={2.0}
                      step={0.01}
                      format={(v) => `${Math.round(v * 100)}%`}
                      onChange={(v) => updateMod({ sizeMult: v })}
                    />
                    <SliderRow
                      label="폭"
                      value={displayedMods.widthMult}
                      min={0.7}
                      max={1.4}
                      step={0.01}
                      format={(v) => `${Math.round(v * 100)}%`}
                      onChange={(v) => updateMod({ widthMult: v })}
                    />
                    <SliderRow
                      label="두께"
                      value={displayedMods.thicknessMult}
                      min={0.5}
                      max={1.8}
                      step={0.01}
                      format={(v) => `${Math.round(v * 100)}%`}
                      onChange={(v) => updateMod({ thicknessMult: v })}
                    />
                    <SliderRow
                      label="각도"
                      value={displayedMods.rotation}
                      min={-30}
                      max={30}
                      step={0.5}
                      format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}°`}
                      onChange={(v) => updateMod({ rotation: v })}
                    />
                  </div>

                  {/* 색상 */}
                  <div className="p-5 border-b border-[#F0E6E0]">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] tracking-brow uppercase text-[#A88080]">색상</p>
                      <span className="text-[10px] text-[#8B7A7A]">
                        {COLOR_PRESETS.find(
                          (p) => p.color.r === browColor.r && p.color.g === browColor.g && p.color.b === browColor.b,
                        )?.name || '커스텀'}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {COLOR_PRESETS.map((p) => {
                        const active =
                          browColor.r === p.color.r && browColor.g === p.color.g && browColor.b === p.color.b;
                        return (
                          <button
                            key={p.name}
                            onClick={() => handleColorChange(p.color)}
                            aria-label={p.name}
                            title={p.name}
                            className={`aspect-square rounded-full border-2 transition ${
                              active ? 'border-[#8B4A4F] scale-110' : 'border-[#E8DCD7] hover:border-[#A88080]'
                            }`}
                            style={{ backgroundColor: `rgb(${p.color.r},${p.color.g},${p.color.b})` }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* 저장 / 처음부터 */}
                  <div className="p-5 flex flex-col gap-2">
                    <button
                      onClick={handleSave}
                      className="w-full flex items-center justify-center gap-2 bg-[#8B4A4F] text-[#F4ECE8] py-3 text-[11px] tracking-brow uppercase hover:bg-[#6E3A3F] transition"
                    >
                      <Save className="w-4 h-4" /> 결과 저장
                    </button>
                    <button
                      onClick={handleResetAll}
                      className="text-[10px] tracking-cta uppercase text-[#A88080] hover:text-[#8B4A4F] transition py-1"
                    >
                      처음부터 다시
                    </button>
                  </div>
                </>
              )}
            </aside>
          </div>
        )}
      </section>

      <div className="h-px bg-[#E8DCD7]" />

      <section className="container-narrow py-16 sm:py-20 text-center">
        <h3 className="font-serif text-2xl sm:text-3xl mb-3 text-[#3A2D2D] tracking-tight">
          결과를 정식으로 <em className="italic font-light text-[#8B4A4F]">상담받고 싶으신가요?</em>
        </h3>
        <p className="text-[#8B7A7A] text-sm mb-8 max-w-md mx-auto font-light">
          저장한 이미지를 카카오톡 채널로 보내주시면 시술 가능 여부와 일정을 1:1로 안내드립니다.
        </p>
        <a
          href={KAKAO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block border border-[#3A2D2D] text-[#3A2D2D] hover:bg-[#3A2D2D] hover:text-[#FFFFFF] px-10 py-4 text-[11px] tracking-eyebrow uppercase transition-colors duration-300"
        >
          카카오톡 상담
        </a>
      </section>
    </>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}

function SliderRow({ label, value, min, max, step, format, onChange }: SliderRowProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] tracking-brow uppercase text-[#A88080]">{label}</p>
        <span className="text-xs font-mono text-[#8B7A7A]">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[#8B4A4F]"
      />
    </div>
  );
}
