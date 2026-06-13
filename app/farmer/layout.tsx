import FarmerNav from '@/components/common/FarmerNav';

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <FarmerNav />
      <main className="container-x py-8">{children}</main>
    </div>
  );
}
