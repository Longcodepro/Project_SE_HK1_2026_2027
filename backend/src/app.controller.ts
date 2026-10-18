import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot() {
    return {
      message: 'BrewLite Backend API is running successfully!',
      status: 'ok',
      timestamp: new Date().toISOString(),
      docs: '/api',
      endpoints: {
        health: '/health',
        auth: '/auth/*',
        users: '/users/me, /users/me/points',
        menu: '/categories, /products',
        orders: '/orders, /orders/me, /orders/:id',
        payments: '/payments',
        promotions: '/promotions/validate, /promotions/mine',
        wallet: '/wallet, /wallet/withdrawals',
        admin: '/admin/* (nhân viên và quản lý)',
      },
    };
  }

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
