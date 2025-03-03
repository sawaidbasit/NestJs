import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './app.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() body) {
    console.log('Received Body:', body); // 🛠 Debugging ke liye
    return this.authService.signup(body.name, body.email, body.password);
  }

  @Post('login')
  login(@Body() body) {
    return this.authService.login(body.email, body.password);
  }
}
