import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    const smtpHost = process.env.SMTP_HOST ?? "";
    const smtpPort = parseInt(process.env.SMTP_PORT ?? "2525", 10); 
    const smtpUser = process.env.SMTP_USER ?? "";
    const smtpPass = process.env.SMTP_PASS ?? "";

    if (!smtpHost || !smtpUser || !smtpPass) {
      throw new Error("Missing SMTP environment variables!");
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  async sendOtpEmail(to: string, otp: string) {
    console.log(`Sending OTP to ${to}`);

    try {
      const mailOptions = {
        from: '"Your App" <no-reply@example.com>',
        to,
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully');
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }

  async sendResetPasswordEmail(email: string, resetLink: string) {
    await this.transporter.sendMail({
      to: email,
      subject: 'Password Reset Request',
      text: `Click the following link to reset your password: ${resetLink}`,
    });
  }
}
