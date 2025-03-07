import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth/auth.service'; // ✅ Correct Import

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {} // ✅ Use AuthService

  @Post('signup')
  signup(@Body() body) {
    console.log('Received Body:', body); // 🛠 Debugging ke liye
    return this.authService.signup(body.name, body.email, body.password); // ✅ Correct Call
  }

  @Post('login')
  login(@Body() body) {
    return this.authService.login(body.email, body.password); // ✅ Correct Call
  }

}
@Controller('openai')
export class OpenAiController {
  constructor(private authService: AuthService) {} // ✅ Use AuthService

  
}
