import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DiplomasService } from './diplomas.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import type { Response } from 'express'; // Keep this if previewDiploma is still needed, otherwise remove. The instruction implies replacing the whole controller.

@Controller('events')
export class DiplomasController {
  constructor(
    private readonly diplomasService: DiplomasService,
    private readonly prisma: PrismaService,
  ) {}

  @Post(':id/diplomas/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads', // Ensure this directory exists
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          return cb(
            new BadRequestException('Only PDF files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadDiplomaTemplate(
    @Param('id') eventId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
    }
    await this.diplomasService.saveTemplate(eventId, file);
    return { message: 'Template uploaded successfully' };
  }

  @Get(':id/diplomas/preview')
  async previewDiploma(@Param('id') eventId: string, @Res() res: Response) {
    const pdfBuffer = await this.diplomasService.getPreviewStream(eventId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename=preview.pdf',
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Post(':id/diplomas/send-batch')
  async sendBatch(@Param('id') eventId: string) {
    return this.diplomasService.sendBatch(eventId);
  }
}
