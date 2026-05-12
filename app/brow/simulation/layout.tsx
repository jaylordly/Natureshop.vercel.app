import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Simulation',
  description:
    '본인 사진 위에 눈썹 스타일을 직접 합성해 보세요. 색감·크기·위치까지 조정한 결과를 저장할 수 있습니다.',
  alternates: { canonical: '/brow/simulation' },
  // 시뮬레이션은 카메라/사진 업로드를 다루므로 외부 캐싱·인덱싱 우선순위는 낮춤
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
};

export default function SimulationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
