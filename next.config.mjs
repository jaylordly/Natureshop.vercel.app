/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
    // placehold.co가 SVG로 응답하므로 허용. 외부 SVG는 신뢰된 출처(placehold.co)에서만 옴.
    // CSP로 SVG 내부 스크립트 실행을 차단해 안전하게 사용.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    // lucide-react는 아이콘이 600+개라 전체를 import하면 번들이 커짐.
    // 실제 사용 아이콘만 트리 셰이킹 대상으로 변환해 번들/HMR 속도 개선.
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
