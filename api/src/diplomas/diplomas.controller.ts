import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DiplomasService } from './diplomas.service';
import type { Response } from 'express';

@Controller('events/:id/diplomas')
export class DiplomasController {
  constructor(private readonly diplomasService: DiplomasService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTemplate(
    @Param('id') eventId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
    }
    await this.diplomasService.saveTemplate(eventId, file);
    return { message: 'Template uploaded successfully' };
  }

  @Get('preview')
  async previewDiploma(@Param('id') eventId: string, @Res() res: Response) {
    const pdfBuffer = await this.diplomasService.getPreviewStream(eventId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename=preview.pdf',
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Post('send-batch')
  async sendBatch(@Param('id') eventId: string) {
    return this.diplomasService.sendBatch(eventId);
  }
}
