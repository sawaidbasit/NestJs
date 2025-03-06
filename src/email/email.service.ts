import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendOtpEmail(email: string, otp: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
      html: `<p>Your OTP code is: <strong>${otp}</strong>. It will expire in 5 minutes.</p>`,
    });
  }

  async sendResetPasswordEmail(email: string, resetToken: string) {
    const resetLink = `https://yourapp.com/reset-password?token=${resetToken}`;
    
    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Reset Request',
      text: `Click the link below to reset your password: ${resetLink}`,
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    });
  }
}
