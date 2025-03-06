import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { randomInt } from 'crypto';
import { EmailService } from '../email/email.service';
import { randomBytes } from 'crypto';


@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private emailService: EmailService) {}

  async signup(name: string, email: string, password: string) {
    if (!name || !email || !password) {
      throw new BadRequestException('All fields are required');
    }

    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email format');
    }

    if (!this.isValidPassword(password)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long and include at least one uppercase letter, one number, and one special character'
      );
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = randomInt(100000, 999999).toString();

    await this.prisma.user.create({
      data: { name, email, password: hashedPassword, otp, isVerified: false },
    });

    await this.emailService.sendOtpEmail(email, otp);
    return { message: 'OTP sent to your email. Please verify your account.' };
  }

  async verifyEmail(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.isVerified) {
      throw new BadRequestException('User already verified');
    }
    if (user.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.prisma.user.update({
      where: { email },
      data: { isVerified: true, otp: null },
    });

    return { message: 'Email verified successfully!' };
  }

  async login(email: string, password: string) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    console.log(user?.password)
    if (!user) {
      throw new BadRequestException('User does not exist');
    }

    if (!user.isVerified) {
      throw new BadRequestException('Please verify your email before logging in');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new BadRequestException('Incorrect password');
    }

    return { message: 'Login successful', user };
  }

  async forgotPassword(email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resetToken = randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1);

    await this.prisma.user.update({
      where: { email },
      data: { resetPasswordToken: hashedToken, resetPasswordExpires: expiryDate },
    });

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}&email=${email}`;
    await this.emailService.sendResetPasswordEmail(email, resetLink);
    return { message: 'Password reset link sent to your email.' };
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
      throw new NotFoundException('Invalid or expired reset token');
    }
    if (new Date() > user.resetPasswordExpires) {
      throw new BadRequestException('Reset token has expired');
    }
    const isTokenValid = await bcrypt.compare(token, user.resetPasswordToken);
    if (!isTokenValid) {
      throw new BadRequestException('Invalid reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword, resetPasswordToken: null, resetPasswordExpires: null },
    });

    return { message: 'Password reset successful. You can now log in.' };
  }

  async changePassword(email: string, oldPassword: string, newPassword: string) {
    if (!email || !oldPassword || !newPassword) {
      throw new BadRequestException('All fields are required');
    }
  
    const user = await this.prisma.user.findUnique({ where: { email } });
  
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Incorrect old password');
    }
  
    if (!this.isValidPassword(newPassword)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long and include at least one uppercase letter, one number, and one special character'
      );
    }
  
    const hashedPassword = await bcrypt.hash(newPassword, 10);
  
    await this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
  
    return { message: 'Password changed successfully' };
  }  

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidPassword(password: string): boolean {
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
  }
}
