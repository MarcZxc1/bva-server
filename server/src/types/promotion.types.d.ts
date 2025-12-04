export interface CalendarEvent {
    id: string;
    date: string;
    title: string;
    audience?: string;
    event_type?: string;
}
export interface NearExpiryItem {
    product_id: string;
    name: string;
    expiry_date: string;
    quantity: number;
    price: number;
    categories?: string[];
}
export interface PromotionPreferences {
    discount_max_pct?: number;
    min_margin_pct?: number;
    max_promo_duration_days?: number;
}
export interface PromotionRequest {
    shop_id: string;
    items: NearExpiryItem[];
    calendar_events: CalendarEvent[];
    preferences?: PromotionPreferences;
}
export interface GeneratedPromotion {
    event_id: string;
    event_title: string;
    product_id: string;
    product_name: string;
    suggested_discount_pct: number;
    promo_copy: string;
    start_date: string;
    end_date: string;
    expected_clear_days: number;
    projected_sales_lift: number;
    confidence: string;
    reasoning: string;
}
export interface PromotionResponse {
    promotions: GeneratedPromotion[];
    meta: {
        shop_id: string;
        total_items: number;
        total_events: number;
        promotions_generated: number;
        analysis_date: string;
    };
}
//# sourceMappingURL=promotion.types.d.ts.map