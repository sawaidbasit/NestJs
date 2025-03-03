import { Controller, Get } from '@nestjs/common';

@Controller('home')
export class HomeController {
  @Get()
  getHome() {
    return {
      message: 'Welcome to Material Recognition API',
      features: ['Scan Object', 'Browse Materials', 'Save Favorites'],
    };
  }
}
