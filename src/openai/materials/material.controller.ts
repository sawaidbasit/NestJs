import { Controller, Get, Query, Param } from '@nestjs/common';
import { MaterialsService } from './material.service';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  async getMaterials(@Query('category') category?: string) { 
    if (!category) {
      return this.materialsService.getAllMaterials();
    }
    return this.materialsService.getMaterialsByCategory(category);
  }

  @Get('search')
  async searchMaterials(@Query('query') query: string) {
    return this.materialsService.searchMaterials(query);
  }

  @Get(':id')
  async getMaterialDetails(@Param('id') id: string) {
    return this.materialsService.getMaterialDetails(id);
  }
}
