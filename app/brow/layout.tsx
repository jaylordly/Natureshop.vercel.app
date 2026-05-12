import type { Metadata } from 'next';
import BrowHeader from '@/components/brow/BrowHeader';
import BrowFooter from '@/components/brow/BrowFooter';
import KakaoChatButton from '@/components/KakaoChatButton';

export const metadata: Metadata = {
  title: {
    default: 'Brow Studio',
    template: '%s · Brow | The Nature Academy',
  },
  description: '섬세한 라인, 우아한 형태 — Brow Studio의 시술 사례와 스타일 시뮬레이션.',
};

export default function BrowLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#F4ECE8] text-[#3A2D2D] min-h-screen flex flex-col">
      <BrowHeader />
      <main className="flex-1">{children}</main>
      <BrowFooter />
      <KakaoChatButton />
    </div>
  );
}
