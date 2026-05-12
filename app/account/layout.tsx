import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminBar from '@/components/AdminBar';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminBar />
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
