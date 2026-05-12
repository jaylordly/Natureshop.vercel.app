export interface BrowColor {
  r: number;
  g: number;
  b: number;
}

export interface BrowTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
  color: BrowColor;
}

export interface Point {
  x: number;
  y: number;
}

export interface FaceLandmarks {
  leftEyebrow: Point[];
  rightEyebrow: Point[];
  leftEye?: Point[];
  rightEye?: Point[];
  jaw?: Point[];
}

export type EditTarget = 'left' | 'right' | 'both';
