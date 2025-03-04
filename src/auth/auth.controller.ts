import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

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
    @Body('email') email: string,
    @Body('token') token: string,
    @Body('newPassword') newPassword: string
  ) {
    return this.authService.resetPassword(email, token, newPassword);
  }

  @Post('change-password')
  async changePassword(
    @Body('email') email: string,
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string
  ) {
    return this.authService.changePassword(email, oldPassword, newPassword);
  }
}
