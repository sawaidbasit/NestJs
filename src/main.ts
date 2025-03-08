import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as cors from 'cors';
global.crypto = require('crypto');

async function bootstrap() {
  dotenv.config(); // Load .env variables
  const app = await NestFactory.create(AppModule);
  app.use(cors({ origin: '*' })); 
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
