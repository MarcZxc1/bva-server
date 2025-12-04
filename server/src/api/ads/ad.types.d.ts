export interface AdRequest {
    product_name: string;
    playbook: "Flash Sale" | "New Arrival" | "Best Seller Spotlight" | "Bundle Up!";
    discount?: string;
}
export interface AdResponse {
    playbookUsed: string;
    product_name: string;
    generated_ad_copy: string;
}
//# sourceMappingURL=ad.types.d.ts.map