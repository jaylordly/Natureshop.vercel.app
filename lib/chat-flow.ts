/**
 * 카카오 챗 위젯 정적 응답 트리.
 * NEXT_PUBLIC_KAKAO_CHAT_API가 설정되면 그 엔드포인트가 우선 사용됩니다.
 */

export interface ChatNode {
  id: string;
  message: string;
  options?: { label: string; next: string }[];
  cta?: { label: string; href: string };
}

export const CHAT_FLOW: Record<string, ChatNode> = {
  start: {
    id: 'start',
    message: '안녕하세요, The Nature Academy입니다. 어떤 도움이 필요하신가요?',
    options: [
      { label: '제품 문의', next: 'product' },
      { label: '시술 상담', next: 'treatment' },
      { label: '수강 등록 문의', next: 'class' },
    ],
  },
  product: {
    id: 'product',
    message: '제품 카테고리를 선택해 주세요.',
    options: [
      { label: '머신/엠보', next: 'product_machine' },
      { label: '색소', next: 'product_pigment' },
      { label: '케어/위생', next: 'product_care' },
    ],
  },
  product_machine: {
    id: 'product_machine',
    message: '머신과 엠보 제품은 상품 페이지에서 자세한 스펙을 확인하실 수 있어요.',
    cta: { label: '상품 보러가기', href: '/products?cat=머신' },
  },
  product_pigment: {
    id: 'product_pigment',
    message: '색소는 톤별로 모아두었습니다. 수강생 전용 라인은 로그인 후 확인 가능합니다.',
    cta: { label: '색소 보러가기', href: '/products?cat=색소' },
  },
  product_care: {
    id: 'product_care',
    message: '시술 후 케어 제품 모음입니다.',
    cta: { label: '케어 보러가기', href: '/products?cat=케어' },
  },
  treatment: {
    id: 'treatment',
    message: '눈썹 시뮬레이션을 먼저 해보시면 상담이 한결 수월합니다. 카카오톡 채널로 결과 이미지를 보내주세요.',
    cta: { label: '시뮬레이션 시작', href: '/brow/simulation' },
  },
  class: {
    id: 'class',
    message: '수강 안내는 카카오톡 채널 1:1 메시지로 도와드리고 있습니다.',
  },
};

export type ChatApiResponse =
  | { kind: 'message'; node: ChatNode }
  | { kind: 'end'; message: string };
