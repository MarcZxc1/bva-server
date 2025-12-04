export declare function getProductsByShop(shopId: string): Promise<{
    id: string;
    sku: string;
    name: string;
    description: string | null;
    price: number;
    cost: number | null;
    quantity: number;
    expiryDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
}[]>;
//# sourceMappingURL=product.service.d.ts.map