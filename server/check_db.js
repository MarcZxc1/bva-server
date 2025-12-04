"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("./src/generated/prisma");
const prisma = new prisma_1.PrismaClient();
async function main() {
    const products = await prisma.product.findMany({
        include: {
            inventories: true
        }
    });
    console.log(`Total products: ${products.length}`);
    if (products.length > 0) {
        console.log('Sample product:', JSON.stringify(products[0], null, 2));
        const validProducts = products.filter((p) => p.price > 0 && (p.cost || 0) > 0);
        console.log(`Valid products (price > 0 && cost > 0): ${validProducts.length}`);
        const shops = [...new Set(products.map((p) => p.shopId))];
        console.log('Shop IDs with products:', shops);
    }
    else {
        console.log('No products found.');
    }
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=check_db.js.map