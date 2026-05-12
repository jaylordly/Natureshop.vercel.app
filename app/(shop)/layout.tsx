import Header from '@/components/Header';
import Footer from '@/components/Footer';
import KakaoChatButton from '@/components/KakaoChatButton';
import AdminBar from '@/components/AdminBar';
import NoticeBanner from '@/components/NoticeBanner';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminBar />
      <NoticeBanner />
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <KakaoChatButton />
    </>
  );
}
