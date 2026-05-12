import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'The Nature Academy — 프로페셔널 반영구 제품';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FBF7F0 0%, #F6EFE6 45%, #D6B07A 100%)',
          color: '#1F1A16',
          padding: '80px',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        {/* 골드 라인 + 영문 라벨 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '40px',
            color: '#B5894A',
            fontSize: '20px',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
          }}
        >
          <div style={{ display: 'flex', width: '60px', height: '1px', background: '#B5894A' }} />
          <div style={{ display: 'flex' }}>The Nature Academy</div>
          <div style={{ display: 'flex', width: '60px', height: '1px', background: '#B5894A' }} />
        </div>

        {/* 헤드라인 1행 */}
        <div
          style={{
            display: 'flex',
            fontSize: '88px',
            lineHeight: 1.05,
            fontWeight: 700,
            marginBottom: '8px',
          }}
        >
          섬세한 도구,
        </div>

        {/* 헤드라인 2행 — 이탤릭 + 골드 */}
        <div
          style={{
            display: 'flex',
            fontSize: '88px',
            lineHeight: 1.05,
            fontStyle: 'italic',
            color: '#8C6633',
            fontWeight: 400,
            marginBottom: '32px',
          }}
        >
          완성된 시술
        </div>

        {/* 서브 카피 */}
        <div
          style={{
            display: 'flex',
            fontSize: '24px',
            color: '#7A6A55',
            textAlign: 'center',
            maxWidth: '780px',
            lineHeight: 1.5,
          }}
        >
          반영구 시술 전문가를 위한 엄선된 컬렉션
        </div>

        {/* 우측 하단 카테고리 */}
        <div
          style={{
            position: 'absolute',
            bottom: '52px',
            right: '80px',
            fontSize: '14px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#7A6A55',
            display: 'flex',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex' }}>머신</div>
          <div style={{ display: 'flex' }}>·</div>
          <div style={{ display: 'flex' }}>엠보</div>
          <div style={{ display: 'flex' }}>·</div>
          <div style={{ display: 'flex' }}>색소</div>
          <div style={{ display: 'flex' }}>·</div>
          <div style={{ display: 'flex' }}>케어</div>
        </div>
      </div>
    ),
    size,
  );
}
