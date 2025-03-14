import { Controller, Post, Get, Body, Query, Req, BadRequestException, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express'; // ✅ Import Express Request


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

  // @Post('reset-password')
  // async resetPassword(
  //   @Req() request: Request, 
  //   @Body('newPassword') newPassword: string
  // ) {
    
  //   const email = request.query['email'] as string;
  //   const token = request.query['token'] as string;

  //   return this.authService.resetPassword(email, token, newPassword);
  // }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Get('reset-password-form')
  resetPasswordForm(
    @Res({ passthrough: true }) res: Response,
    @Query('token') token?: string,
    @Query('email') email?: string
  ) {
  
    if (!token || !email) {
      throw new BadRequestException('Missing required fields');
    }
  
    const htmlForm = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
          form { display: inline-block; text-align: left; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
          label { display: block; margin-top: 10px; }
          input { width: 100%; padding: 8px; margin-top: 5px; }
          .toggle-password { cursor: pointer; font-size: 14px; color: #007bff; margin-left: 5px; }
        </style>
      </head>
      <body>
        <h2>Reset Your Password</h2>
        <form method="POST" action="/auth/reset-password">
          <input type="hidden" name="email" value="${email}" />
          <input type="hidden" name="token" value="${token}" />
  
          <label>New Password:</label>
          <input type="password" id="newPassword" name="newPassword" required />
          <span class="toggle-password" onclick="togglePassword('newPassword')">Show</span>
  
          <label>Confirm Password:</label>
          <input type="password" id="confirmPassword" required />
          <span class="toggle-password" onclick="togglePassword('confirmPassword')">Show</span>
  
          <button type="submit" onclick="return validatePasswords()">Reset Password</button>
        </form>
  
        <script>
          function togglePassword(id) {
            const input = document.getElementById(id);
            input.type = input.type === 'password' ? 'text' : 'password';
          }
  
          function validatePasswords() {
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            if (newPassword !== confirmPassword) {
              alert('Passwords do not match!');
              return false;
            }
            return true;
          }
        </script>
      </body>
      </html>
    `;
  
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlForm);
  }
  


  @Post('reset-password')
  async resetPassword(
    @Body('email') email: string,
    @Body('token') token: string,
    @Body('newPassword') newPassword: string
  ) {

    if (!email || !token || !newPassword) {
      throw new BadRequestException('Missing required fields');
    }

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

  @Post('apple-signin')
  async appleSignin(@Body() body: { name: string; email: string; appleId: string }) {
    try {
      const user = await this.authService.saveAppleUser(body.name, body.email, body.appleId);

      return {
        message: `Apple Sign-In Successful: ${user.appleId}`,
        name: user.name,
        email: user.email,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('google-signin')
  async googleSignIn(@Body() body: { name: string; email: string; googleId: string; idToken: string; picture?: string }) {
    const user = await this.authService.saveGoogleUser(body.name, body.email, body.googleId);

    return {
      message: "Google Sign-In Success",
        "User": user.name,
        "Email": user.email,
        "ID Token": user.googleId,
    };
  }

}
