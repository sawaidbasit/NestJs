// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import * as dotenv from 'dotenv';
// import * as cors from 'cors';
// import { webcrypto } from 'crypto'; 

// Object.defineProperty(globalThis, 'crypto', {
//   value: webcrypto,
//   configurable: false,
//   enumerable: false,
//   writable: false,
// });

// async function bootstrap() {
//   dotenv.config(); 
//   const app = await NestFactory.create(AppModule);
//   app.use(cors({ origin: '*' })); 
//   await app.listen(process.env.PORT ?? 3000);
// }
// bootstrap();


import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as cors from 'cors';
import { webcrypto } from 'crypto';
import * as bodyParser from 'body-parser';

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
  
  // ✅ Increase Payload Limit to 10MB (Adjust as needed)
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();

