import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductEntity } from '../database/entities/product.entity';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('categories')
  findCategories() {
    return this.productsService.findCategories();
  }

  @Post('categories')
  createCategory(@Body() body: { name?: string }) {
    return this.productsService.createCategory(body);
  }

  @Get()
  findAll(
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
    @Query('all') allRaw?: string,
  ) {
    const limit = limitRaw !== undefined ? Number(limitRaw) : undefined;
    const offset = offsetRaw !== undefined ? Number(offsetRaw) : undefined;
    const all = allRaw === '1' || allRaw === 'true';
    return this.productsService.findAll(limit, offset, all);
  }

  @Post()
  create(@Body() body: Partial<ProductEntity>) {
    return this.productsService.create(body);
  }

  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = new Set([
          'text/csv',
          'application/csv',
          'text/plain',
          'application/vnd.ms-excel',
        ]);
        cb(null, allowed.has(file.mimetype) || file.originalname.endsWith('.csv'));
      },
    }),
  )
  importProducts(
    @UploadedFile()
    file?: { buffer: Buffer; originalname?: string },
    @Body() body?: { branchName?: string },
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Нужно загрузить CSV файл');
    }
    return this.productsService.importFromCsvBuffer(file.buffer, {
      branchName: body?.branchName,
      fileName: file.originalname,
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<ProductEntity>) {
    return this.productsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
