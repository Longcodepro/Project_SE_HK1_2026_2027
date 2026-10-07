import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [k, ...v] = trimmed.split('=');
      if (k && !process.env[k.trim()]) {
        let val = v.join('=').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[k.trim()] = val;
      }
    }
  }
}
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://brewlite:brewlite_dev@localhost:5432/brewlite';
}

const prisma = new PrismaClient();

async function main() {
  const products = [
    {
      id: 'prod-001',
      name: 'Cà phê sữa',
      price: 35000,
      imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=85',
      stock: 50,
    },
    {
      id: 'prod-002',
      name: 'Americano',
      price: 40000,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=85',
      stock: 30,
    },
    {
      id: 'prod-003',
      name: 'Cappuccino',
      price: 45000,
      imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=85',
      stock: 25,
    },
    {
      id: 'prod-004',
      name: 'Trà đào',
      price: 39000,
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=85',
      stock: 40,
    },
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
