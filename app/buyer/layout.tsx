import Navbar from '@/components/common/Navbar';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="container-x py-8">{children}</main>
    </div>
  );
}
