import ComingSoon from '@/components/seller/ComingSoon';

export default function FulfilmentByLazadaPage() {
  return (
    <ComingSoon
      title="Fulfilment By Lazada"
      description="Lazada's comprehensive fulfillment service is being enhanced to provide you with seamless inventory management and order processing capabilities."
      breadcrumbs={[
        { label: 'Home', href: '/seller-dashboard' },
        { label: 'Products', href: '/seller-dashboard/manage-products' },
        { label: 'Fulfilment By Lazada' }
      ]}
      features={[
        'Automated inventory management',
        'Fast and reliable shipping',
        'Customer service support',
        'Returns and refunds handling',
        'Multi-warehouse distribution',
        'Real-time inventory tracking'
      ]}
    />
  );
}