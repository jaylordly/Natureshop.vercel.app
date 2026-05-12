import type { FaceLandmarks } from './types';

/**
 * 얼굴 랜드마크 검출 — 클라이언트 사이드.
 *
 * 1순위: @vladmandic/face-api (tiny face detector + 68-point landmark model)
 *   - 모델은 /public/models 에서 로드 (~550KB, 첫 로드시만 다운로드)
 *   - 68 landmark 중 17~21번이 우측, 22~26번이 좌측 눈썹 (사진 기준)
 *
 * 2순위: 비례 기반 휴리스틱
 *   - face-api가 실패하거나 얼굴을 못 찾을 때 사용
 *   - 정면 얼굴 가정으로 눈썹을 사진 상단 36% 부근에 배치
 */

const MODEL_URL = '/models';

// face-api는 무겁기 때문에 lazy import — 시뮬레이션 페이지에서만 번들 로딩
type FaceApi = typeof import('@vladmandic/face-api');
let faceApiPromise: Promise<FaceApi> | null = null;
let modelsLoadedPromise: Promise<boolean> | null = null;

async function loadFaceApi(): Promise<FaceApi> {
  if (!faceApiPromise) {
    faceApiPromise = import('@vladmandic/face-api');
  }
  return faceApiPromise;
}

async function ensureModels(): Promise<boolean> {
  if (modelsLoadedPromise) return modelsLoadedPromise;
  modelsLoadedPromise = (async () => {
    try {
      const faceapi = await loadFaceApi();
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      ]);
      return true;
    } catch (err) {
      console.warn('[faceDetection] 모델 로딩 실패 — 휴리스틱으로 fallback:', err);
      return false;
    }
  })();
  return modelsLoadedPromise;
}

/** 시뮬레이션 페이지 마운트 시점에 미리 호출하면 첫 검출 지연을 줄일 수 있습니다. */
export function preloadFaceModels(): void {
  void ensureModels();
}

async function detectWithFaceApi(img: HTMLImageElement): Promise<FaceLandmarks | null> {
  const ok = await ensureModels();
  if (!ok) return null;

  const faceapi = await loadFaceApi();
  const detection = await faceapi
    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 }))
    .withFaceLandmarks();

  if (!detection) return null;

  const lm = detection.landmarks;
  const toPoints = (pts: { x: number; y: number }[]) => pts.map((p) => ({ x: p.x, y: p.y }));

  return {
    leftEyebrow: toPoints(lm.getLeftEyeBrow()),
    rightEyebrow: toPoints(lm.getRightEyeBrow()),
    leftEye: toPoints(lm.getLeftEye()),
    rightEye: toPoints(lm.getRightEye()),
    jaw: toPoints(lm.getJawOutline()),
  };
}

function heuristicLandmarks(img: HTMLImageElement): FaceLandmarks {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const browY = h * 0.36;
  const browWidth = w * 0.22;

  const samplePoints = (cx: number, cy: number, ww: number) =>
    Array.from({ length: 6 }).map((_, i) => ({
      x: cx - ww / 2 + (ww * i) / 5,
      y: cy + Math.sin((i / 5) * Math.PI) * (ww * 0.05) - ww * 0.02,
    }));

  return {
    leftEyebrow: samplePoints(w * 0.65, browY, browWidth),
    rightEyebrow: samplePoints(w * 0.35, browY, browWidth),
  };
}

export async function detectFaceLandmarks(img: HTMLImageElement): Promise<FaceLandmarks | null> {
  if (!img.naturalWidth || !img.naturalHeight) return null;

  try {
    const result = await detectWithFaceApi(img);
    if (result) return result;
  } catch (err) {
    console.warn('[faceDetection] face-api 검출 실패:', err);
  }

  // face-api가 얼굴을 못 찾았거나 에러 — 비례 추정으로 fallback
  return heuristicLandmarks(img);
}
