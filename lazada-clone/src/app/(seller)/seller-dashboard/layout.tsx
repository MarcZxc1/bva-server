import SellerDashboardNavbar from '@/components/seller/seller-dashboard-navbar';

export default function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <SellerDashboardNavbar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
