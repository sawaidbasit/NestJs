import { Controller, Post, Get, Body, Query, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express'; // ✅ Import Express Request


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() body) {
    return this.authService.signup(body.name, body.email, body.password);
  }

  @Post('login')
  async login(@Body() body) {
    return this.authService.login(body.email, body.password);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body) {
    return this.authService.verifyEmail(body.email, body.otp);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  async resetPassword(
    @Req() request: Request, // ✅ Use Express Request
    @Body('newPassword') newPassword: string
  ) {
    // ✅ Explicitly cast query params
    const email = request.query['email'] as string;
    const token = request.query['token'] as string;

    return this.authService.resetPassword(email, token, newPassword);
  }


  @Get('verify-reset-token')
  async verifyResetToken(
  @Query('email') email: string, 
  @Query('token') token: string
  ) {
    return this.authService.verifyResetToken(email, token);
  }

  @Post('change-password')
  async changePassword(
    @Body('email') email: string,
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string
  ) {
    return this.authService.changePassword(email, oldPassword, newPassword);
  }

  @Post('resend-otp')
  async resendOtp(@Body('email') email: string) {
    return this.authService.resendOtp(email);
  }

}
