import { Controller, Get, Query, Param } from '@nestjs/common';
import { MaterialsService } from './material.service';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  // ✅ Get all materials
  @Get()
  async getAllMaterials() {
    return this.materialsService.getAllMaterials();
  }

  // ✅ Search materials
  @Get('search')
  async searchMaterials(@Query('query') query: string) {
    return this.materialsService.searchMaterials(query);
  }

  // ✅ Get material details
  @Get(':id')
  async getMaterialDetails(@Param('id') id: string) {
    return this.materialsService.getMaterialDetails(id);
  }
}
