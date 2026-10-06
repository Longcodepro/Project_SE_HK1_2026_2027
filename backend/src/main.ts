import * as fs from 'fs';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

function loadEnv() {
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
loadEnv();
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://brewlite:brewlite_dev@localhost:5432/brewlite';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'brewlite-super-secret-key-for-jwt-tokens-2026';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('BrewLite API')
    .setDescription('API đặt cà phê không dùng tiền mặt cho sinh viên')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, swaggerDocument);

  await app.listen(3001);
  console.log('BrewLite backend chạy tại http://localhost:3001');
  console.log('Swagger docs tại http://localhost:3001/api');
}
bootstrap();
