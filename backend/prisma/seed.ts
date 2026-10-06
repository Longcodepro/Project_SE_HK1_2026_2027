import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = [
    { id: 'prod-001', name: 'Cà phê sữa', price: 35000, imageUrl: null, stock: 50 },
    { id: 'prod-002', name: 'Americano', price: 40000, imageUrl: null, stock: 30 },
    { id: 'prod-003', name: 'Cappuccino', price: 45000, imageUrl: null, stock: 25 },
    { id: 'prod-004', name: 'Trà đào', price: 39000, imageUrl: null, stock: 40 },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
  }
  console.log('Seed xong: 4 sản phẩm đã được thêm vào database');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
