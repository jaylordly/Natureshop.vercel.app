/**
 * 배송 캐리어 + 송장 조회 URL.
 * 관리자가 송장 등록 시 사용하고, 고객 주문 상세에 "배송조회" 링크로 노출한다.
 */
export interface Carrier {
  code: string;
  name: string;
  trackingUrl: (trackingNo: string) => string;
}

export const CARRIERS: Carrier[] = [
  { code: 'cj', name: 'CJ대한통운', trackingUrl: (n) => `https://trace.cjlogistics.com/next/tracking.html?wblNo=${n}` },
  { code: 'epost', name: '우체국택배', trackingUrl: (n) => `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${n}` },
  { code: 'hanjin', name: '한진택배', trackingUrl: (n) => `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${n}` },
  { code: 'lotte', name: '롯데택배', trackingUrl: (n) => `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${n}` },
  { code: 'logen', name: '로젠택배', trackingUrl: (n) => `https://www.ilogen.com/web/personal/trace/${n}` },
];

export function getCarrier(code?: string | null): Carrier | undefined {
  return CARRIERS.find((c) => c.code === code);
}

export function carrierName(code?: string | null): string {
  return getCarrier(code)?.name ?? code ?? '';
}

export function trackingUrl(code?: string | null, trackingNo?: string | null): string | null {
  const c = getCarrier(code);
  if (!c || !trackingNo) return null;
  return c.trackingUrl(trackingNo);
}
