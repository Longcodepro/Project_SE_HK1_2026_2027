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
      endpoints: {
        health: '/health',
        products: '/products',
        auth: {
          register: 'POST /auth/register',
          login: 'POST /auth/login',
          me: 'GET /auth/me',
        },
        orders: '/orders',
        payments: '/payments',
      },
    };
  }

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
