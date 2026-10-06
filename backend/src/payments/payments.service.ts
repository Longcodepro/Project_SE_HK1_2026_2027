import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

// Tỉ lệ thanh toán thành công của cổng giả lập
const SUCCESS_RATE = 0.8;

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async pay(userId: string, idempotencyKey: string, dto: CreatePaymentDto) {
    if (!idempotencyKey) {
      throw new BadRequestException('Thiếu header Idempotency-Key');
    }

    // Gửi lại đúng key cũ thì trả về kết quả cũ, không trừ tiền lần nữa
    const previous = await this.prisma.payment.findUnique({
      where: { idempotencyKey },
    });
    if (previous) {
      return this.toResponse(previous);
    }

    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }
    if (order.status === 'PAID') {
      throw new ConflictException('Đơn hàng đã được thanh toán');
    }
    if (order.status !== 'PENDING' && order.status !== 'PAYMENT_FAILED') {
      throw new ConflictException('Đơn hàng không ở trạng thái chờ thanh toán');
    }
    if (dto.amount !== order.total) {
      throw new BadRequestException('Số tiền không khớp với giá trị đơn hàng');
    }

    const success = Math.random() < SUCCESS_RATE;
    const status = success ? 'PAID' : 'PAYMENT_FAILED';

    // Ghi payment và đổi trạng thái đơn cùng lúc để hai bên không lệch nhau
    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          orderId: order.id,
          idempotencyKey,
          amount: dto.amount,
          method: dto.method,
          status,
        },
      });

      await tx.order.update({ where: { id: order.id }, data: { status } });

      // Thanh toán thành công thì cộng điểm loyalty: 10000 đồng được 1 điểm
      if (success) {
        await tx.user.update({
          where: { id: userId },
          data: { loyaltyPoints: { increment: Math.floor(order.total / 10000) } },
        });
      }

      return created;
    });

    return this.toResponse(payment);
  }

  private toResponse(payment: {
    id: string;
    orderId: string;
    amount: number;
    method: string;
    status: string;
  }) {
    return {
      id: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
    };
  }
}
