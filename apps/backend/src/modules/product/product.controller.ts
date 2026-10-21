import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  create(
    @CurrentUser('userId') sellerId: string,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productService.create(sellerId, createProductDto);
  }

  @Get()
  findAllBySeller(@Query('sellerId') sellerId: string) {
    return this.productService.findAllBySeller(sellerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  update(
    @Param('id') id: string,
    @CurrentUser('userId') sellerId: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, sellerId, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  remove(
    @Param('id') id: string,
    @CurrentUser('userId') sellerId: string,
  ) {
    return this.productService.remove(id, sellerId);
  }
}
