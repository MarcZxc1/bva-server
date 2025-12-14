// Add useSearchParams
import { useRouter, useSearchParams } from 'next/navigation';

// Inside the component:
const searchParams = useSearchParams();
const callbackUrl = searchParams.get('callbackUrl');

// Inside handleSubmit, replace the redirect logic with this:
if (callbackUrl) {
  router.push(callbackUrl); // Go back to the product!
} else if (user.role === 'SELLER') {
  router.push('/seller-dashboard');
} else {
  router.push('/');
}