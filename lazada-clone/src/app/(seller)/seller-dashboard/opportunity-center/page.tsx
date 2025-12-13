import ComingSoon from '@/components/seller/ComingSoon';

export default function OpportunityCenterPage() {
  return (
    <ComingSoon
      title="Opportunity Center"
      description="Advanced business opportunity identification and growth recommendation system is under development to help you discover new revenue streams."
      breadcrumbs={[
        { label: 'Home', href: '/seller-dashboard' },
        { label: 'Products', href: '/seller-dashboard/manage-products' },
        { label: 'Opportunity Center' }
      ]}
      features={[
        'Market opportunity analysis',
        'Product recommendation engine',
        'Trend identification tools',
        'Competitive gap analysis',
        'Revenue optimization suggestions',
        'Growth strategy recommendations'
      ]}
    />
  );
}