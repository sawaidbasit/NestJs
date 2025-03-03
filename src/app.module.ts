import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { HomeController } from './home/home.controller'; // ✅ Import HomeController

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [HomeController], // ✅ Add HomeController here
})
export class AppModule {}
