import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

const allowedMime = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

@Controller('uploads')
export class UploadsController {
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, cb) => {
          const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          cb(null, `${unique}${extname(file.originalname || '')}`);
        },
      }),
      fileFilter: (_, file, cb) => {
        cb(null, allowedMime.has(file.mimetype));
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadImage(
    @UploadedFile()
    file?: { filename: string },
  ) {
    if (!file) {
      throw new BadRequestException('Нужно загрузить изображение (jpg/png/webp/gif)');
    }

    return { url: `/uploads/${file.filename}` };
  }

  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, cb) => {
          const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          cb(null, `${unique}${extname(file.originalname || '')}`);
        },
      }),
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  uploadFile(
    @UploadedFile()
    file?: { filename: string; originalname?: string; mimetype?: string; size?: number },
  ) {
    if (!file) {
      throw new BadRequestException('Нужно загрузить файл');
    }
    return {
      url: `/uploads/${file.filename}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
