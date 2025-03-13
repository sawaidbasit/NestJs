import { Controller, Get } from '@nestjs/common';
import { HomeService } from './home.service';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {} 
  
  @Get()
  getHome() {
    return {
      message: 'Welcome to Material Recognition API',
      features: ['Scan Object', 'Browse Materials', 'Save Favorites'],
    };
  }

  @Get('materials/random')
  async getRandomMaterials() {
    return this.homeService.getRandomMaterials();
  }
}
