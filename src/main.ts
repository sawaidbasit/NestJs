import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as cors from 'cors';
import { webcrypto } from 'crypto'; 

Object.defineProperty(globalThis, 'crypto', {
  value: webcrypto,
  configurable: false,
  enumerable: false,
  writable: false,
});

async function bootstrap() {
  dotenv.config(); 
  const app = await NestFactory.create(AppModule);
  app.use(cors({ origin: '*' })); 
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
