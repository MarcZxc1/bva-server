import ComingSoon from '@/components/seller/ComingSoon';

export default function AssortmentGrowthCenterPage() {
  return (
    <ComingSoon
      title="Assortment Growth Center"
      description="Intelligent product assortment optimization and expansion tools are being developed to help you build a winning product portfolio."
      breadcrumbs={[
        { label: 'Home', href: '/seller-dashboard' },
        { label: 'Products', href: '/seller-dashboard/manage-products' },
        { label: 'Assortment Growth Center' }
      ]}
      features={[
        'Product portfolio analysis',
        'Assortment gap identification',
        'Category expansion recommendations',
        'Performance benchmarking',
        'Inventory optimization',
        'Cross-selling opportunities'
      ]}
    />
  );
}