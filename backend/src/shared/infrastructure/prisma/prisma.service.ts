import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

// Giữ client của giao dịch đang chạy theo từng request, để repository không phải truyền tx qua tham số
const currentTx = new AsyncLocalStorage<Prisma.TransactionClient>();

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  // Repository luôn dùng `prisma.db`: trong giao dịch là client của giao dịch, ngoài giao dịch là client thường
  get db(): Prisma.TransactionClient {
    return currentTx.getStore() ?? this;
  }

  async inTransaction<T>(work: () => Promise<T>): Promise<T> {
    // Đã ở trong giao dịch thì dùng tiếp, không mở lồng nhau
    if (currentTx.getStore()) return work();
    return this.$transaction((tx) => currentTx.run(tx, work), { timeout: 20000 });
  }
}
