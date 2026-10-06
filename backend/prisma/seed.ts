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
  const toppings = [
    { id: 'top-001', name: 'Trân châu đen', price: 7000 },
    { id: 'top-002', name: 'Thạch dừa', price: 6000 },
    { id: 'top-003', name: 'Kem phô mai', price: 10000 },
    { id: 'top-004', name: 'Shot espresso', price: 12000 },
  ];

  for (const topping of toppings) {
    await prisma.topping.upsert({
      where: { id: topping.id },
      update: topping,
      create: topping,
    });
  }

  console.log('Seed xong: 4 sản phẩm và 4 topping đã được thêm vào database');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
