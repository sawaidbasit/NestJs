import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signup(name: string, email: string, password: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
  
    if (existingUser) {
      return { message: 'Email already registered' };
    }
  
    const newUser = await this.prisma.user.create({
      data: { name, email, password },
    });
  
    console.log('User Registered:', newUser);
    return { message: 'User registered successfully', user: newUser };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.password !== password) {
      console.log('Invalid credentials');
      return { message: 'Invalid credentials' };
    }

    return { message: 'Login successful', user };
  }
}
