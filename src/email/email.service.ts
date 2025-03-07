import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as dotenv from 'dotenv';

dotenv.config(); 

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendOtpEmail(email: string, otp: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
      html: `
        <p style="font-size: 16px;">Your OTP code is: <strong>${otp}</strong>.</p>
        <p style="color: red;">It will expire in 5 minutes.</p>
      `,
    });
  }

    async sendResetPasswordEmail(email: string, resetToken: string) {
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
    
      const resetLink = `${appUrl}/auth/verify-reset-token?token=${resetToken}&email=${email}`;
    
      await this.mailerService.sendMail({
        to: email,
        subject: 'Password Reset Request',
        text: `You have requested to reset your password. Click the link below to proceed: ${resetLink}`,
        html: `
          <p style="font-size: 16px;">You have requested to reset your password.</p>
          <p>Click the button below to proceed:</p>
          <p>
            <a href="${resetLink}" 
              style="display: inline-block; padding: 10px 20px; color: white; background-color: #007bff; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
          </p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      });
    }
  
  
}
