export interface AdRequest {
  product_name: string;
  playbook:
    | "Flash Sale"
    | "New Arrival"
    | "Best Seller Spotlight"
    | "Bundle Up!";
  discount?: string;
  product_image_url?: string; // Optional: Product image URL for image-based ad copy generation
}

export interface AdResponse {
  playbookUsed: string;
  product_name: string;
  generated_ad_copy: string;
}
