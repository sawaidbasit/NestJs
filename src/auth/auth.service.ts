import { Injectable, Logger, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Request } from 'express'; // ✅ Import Express Request

// import * as randomstring from 'randomstring';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private generateRandomString(length: number, charset: string): string {
    const characters = charset;
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

  constructor(private prisma: PrismaService, private emailService: EmailService) {}
  @Cron(CronExpression.EVERY_MINUTE)
  async removeExpiredOtps() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const currentTime = new Date();

    const expiredUsers = await this.prisma.user.findMany({
        where: {
            otp: { not: null },
            otpCreatedAt: { lte: fiveMinutesAgo },
        },
    });

    for (const user of expiredUsers) {
        if (!user.otpCreatedAt) {
            continue;
        }

        const otpExpirationTime = new Date(user.otpCreatedAt.getTime() + 5 * 60 * 1000);

        if (currentTime > otpExpirationTime) {

            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    otp: null,
                    otpCreatedAt: null,
                },
            });

        }
    }
}

  @Cron(CronExpression.EVERY_MINUTE)
  async removeExpiredResetTokens() {
    const currentTime = new Date();

    const expiredUsers = await this.prisma.user.findMany({
      where: {
        resetPasswordToken: { not: null },
        resetPasswordExpires: { lte: currentTime },
      },
    });

    for (const user of expiredUsers) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });

    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async userLimitExceeded() {
    const currentTime = new Date();

    const users = await this.prisma.user.findMany({
      where: {
        trialEndDate: {
          lte: currentTime,
        },
        isTrialLimitExceeded: false,
      },
    });

    for (const user of users) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isTrialLimitExceeded: true },
      });
      console.log(`Trial expired for user ${user.email}`);
    }
  }

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

    const otp = this.generateRandomString(6, '0123456789');
    const accessToken = randomBytes(32).toString('hex');
    const refreshAccessToken = randomBytes(32).toString('hex');


    const accessTokenExpiredTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    // const trialEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const trialEndDate = new Date(Date.now() + 2 * 60 * 1000);
    const otpCreatedAt = new Date();
    const trialStartDate = new Date();

    await this.prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            accessToken,
            refreshAccessToken,
            accessTokenExpiredTime,
            otp,
            otpCreatedAt,
            isVerified: false,
            trialStartDate,
            trialEndDate,
            isTrialLimitExceeded: false,
        },
    });

    await this.emailService.sendOtpEmail(email, otp);
    return { message: 'OTP sent to your email. Please verify your account within 5 minutes.' };
}

  async verifyEmail(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    await this.removeExpiredOtps();

    if (!user) {
        throw new BadRequestException('User not found');
    }
    if (user.isVerified) {
        throw new BadRequestException('User already verified');
    }

    if (!user.otp || !user.otpCreatedAt) {
        throw new BadRequestException('OTP has expired. Request a new oness.');
    }

    const otpExpirationTime = new Date(user.otpCreatedAt.getTime() + 5 * 60 * 1000);
    const currentTime = new Date();

    if (currentTime > otpExpirationTime) {
        throw new BadRequestException(`OTP has expired. Request a new one. ${currentTime} ${otpExpirationTime}`);
    }

    if (user.otp !== otp) {
        throw new BadRequestException('Invalid OTP');
    }

    await this.prisma.user.update({
        where: { email },
        data: {
            isVerified: true,
            otp: null,
            otpCreatedAt: null,
        },
    });

    return { message: 'Email verified successfully!' };
  }

  async validateAccessToken(accessToken: string) {

    const user = await this.prisma.user.findFirst({ where: { accessToken } });

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    if (!user.accessTokenExpiredTime || new Date() > new Date(user.accessTokenExpiredTime)) {
      throw new UnauthorizedException('Token expired, please refresh your access token');
    }

    return true;
  }

  async refreshAccessToken(refreshToken: string) {
    const user = await this.prisma.user.findFirst({
      where: { refreshAccessToken: refreshToken },
    });

    if (!user) {
      throw new BadRequestException('Invalid refresh token');
    }

    const newAccessToken = randomBytes(32).toString('hex');
    const newAccessTokenExpiredTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { email: user.email },
      data: {
        accessToken: newAccessToken,
        accessTokenExpiredTime: newAccessTokenExpiredTime,
      },
    });

    return {
      accessToken: newAccessToken,
      accessTokenExpiredTime: newAccessTokenExpiredTime,
    };
  }

  async login(email: string, password: string) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
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
    const resetToken = this.generateRandomString(32, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');

    // const resetToken = randomstring.generate({ length: 32, charset: 'alphanumeric' });

    const hashedToken = await bcrypt.hash(resetToken, 10);
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 1);

    await this.prisma.user.update({
      where: { email },
      data: { resetPasswordToken: hashedToken, resetPasswordExpires: expiryDate },
    });

    await this.emailService.sendResetPasswordEmail(email, resetToken);
    return { message: 'Password reset link sent to your email.' };
  }

  async resetPassword(email: string, token: string, newPassword: string) {

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.resetPasswordToken) {
      throw new BadRequestException('Invalid reset token');
    }

    const isTokenValid = await bcrypt.compare(token, user.resetPasswordToken);
    if (!isTokenValid) {
      throw new BadRequestException('Invalid reset token');
    }

    const currentTime = new Date();

    if (!user.resetPasswordExpires || new Date(user.resetPasswordExpires) < currentTime) {
      throw new BadRequestException('Reset token expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { message: 'Password reset successful' };
}

  async verifyResetToken(email: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    if (new Date() > user.resetPasswordExpires) {
      throw new BadRequestException(`Reset token has expired ${new Date()} ${user.resetPasswordExpires}`);
    }

    const isTokenValid = await bcrypt.compare(token, user.resetPasswordToken);
    if (!isTokenValid) {
      throw new BadRequestException('Invalid reset token');
    }

    return { message: 'Valid reset token' };
}

  async changePassword(email: string, newPassword: string) {
    if (!email || !newPassword) {
      throw new BadRequestException('All fields are required');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
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

  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.isVerified) {
      throw new BadRequestException('User already verified');
    }

    // const newOtp = randomstring.generate({ length: 6, charset: 'numeric' });
    const newOtp = this.generateRandomString(6, '0123456789');

    await this.prisma.user.update({
      where: { email },
      data: { otp: newOtp, otpCreatedAt: new Date() },
    });

    await this.emailService.sendOtpEmail(email, newOtp);

    return { message: 'New OTP sent to your email.' };
}

  async saveAppleUser(name: string, email: string, appleId: string) {
    return this.prisma.user.upsert({
      where: { email },
      update: { name, appleId },
      create: { name, email, appleId, password: null, isVerified: true },
    });
  }

  async saveGoogleUser(name: string, email: string, googleId: string) {
  return this.prisma.user.upsert({
    where: {email},
    update: {name, googleId},
    create: {name, email, googleId, password: null, isVerified: true}
  })
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidPassword(password: string): boolean {
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
  }
}
