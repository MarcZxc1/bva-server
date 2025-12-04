"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductsByShop = getProductsByShop;
const prisma_1 = __importDefault(require("../lib/prisma"));
async function getProductsByShop(shopId) {
    const products = await prisma_1.default.product.findMany({
        where: { shopId },
        include: {
            inventories: {
                take: 1,
                orderBy: {
                    updatedAt: "desc",
                },
            },
        },
        orderBy: {
            name: "asc",
        },
    });
    return products.map((product) => ({
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        price: product.price,
        cost: product.cost,
        quantity: product.inventories[0]?.quantity || 0,
        expiryDate: product.expiryDate,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    }));
}
//# sourceMappingURL=product.service.js.map