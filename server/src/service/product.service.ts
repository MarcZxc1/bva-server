import prisma from "../lib/prisma";

export async function getProductsByShop(shopId: string) {
  const products = await prisma.product.findMany({
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
