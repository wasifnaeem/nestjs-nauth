import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import {
  NAuthHttpExceptionFilter,
  NAuthValidationPipe,
} from '@nauth-toolkit/nestjs';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';

// load environment variables before importing appmodule
dotenv.config();

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, new ExpressAdapter());

  // required for cookie-based token delivery
  app.use(cookieParser());

  app.useGlobalFilters(new NAuthHttpExceptionFilter());
  app.useGlobalPipes(new NAuthValidationPipe());

  // adjust origins for your frontend — required for credential-bearing cross-origin requests
  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Device-Id',
      'x-csrf-token',
      'x-device-token',
    ],
  });

  await app.listen(3000);
}
void bootstrap();
