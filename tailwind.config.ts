import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        beige: '#F6EFE6',
        cream: '#FBF7F0',
        ink: '#1F1A16',
        card: '#FFFDF9',
        divider: '#E7DDCD',
        espresso: '#7A6A55',
        gold: {
          DEFAULT: '#B5894A',
          dark: '#8C6633',
          soft: '#D6B07A',
        },
        'wine-dark': '#6E3A3F',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      boxShadow: {
        'gold-glow': '0 8px 30px -10px rgba(181, 137, 74, 0.45)',
        'gold-glow-soft': '0 6px 24px -10px rgba(181, 137, 74, 0.3)',
      },
      letterSpacing: {
        // 본문 라벨 (Shop 측) — Tailwind 기본 tracking-widest(0.1em)와 호환
        'shop': '0.1em',
        // CTA 버튼·강조 라벨 (Shop)
        'cta': '0.25em',
        // Brow Studio 라벨
        'brow': '0.3em',
        // Brow 페이지 eyebrow 텍스트 (가장 넓은 트래킹)
        'eyebrow': '0.4em',
      },
    },
  },
  plugins: [],
};

export default config;
