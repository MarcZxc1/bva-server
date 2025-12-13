import ComingSoon from '@/components/seller/ComingSoon';

export default function PromotionsPage() {
  return (
    <ComingSoon
      title="Promotions"
      description="Advanced promotional campaign management and discount tools are being developed to help you create compelling offers and boost sales."
      breadcrumbs={[
        { label: 'Home', href: '/seller-dashboard' },
        { label: 'Promotions' }
      ]}
      features={[
        'Flash sale management',
        'Discount code generation',
        'Bundle deal creation',
        'Seasonal campaign tools',
        'Performance tracking',
        'A/B testing capabilities'
      ]}
    />
  );
}