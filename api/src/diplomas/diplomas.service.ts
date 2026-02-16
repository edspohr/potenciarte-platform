import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email.service';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DiplomasService {
  private readonly logger = new Logger(DiplomasService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async saveTemplate(eventId: string, file: Express.Multer.File) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'diplomas');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${eventId}-${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, file.buffer);

    return this.prisma.event.update({
      where: { id: eventId },
      data: { diplomaTemplateUrl: filePath },
    });
  }

  async generateDiploma(templatePath: string, name: string): Promise<Buffer> {
    const existingPdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 30;
    const textWidth = font.widthOfTextAtSize(name, fontSize);

    // Center the name. Adjust Y as needed (currently centered vertically)
    // You might want to make this configurable in the future
    firstPage.drawText(name, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  async getPreviewStream(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event || !event.diplomaTemplateUrl) {
      throw new NotFoundException('Event or diploma template not found');
    }

    const pdfBuffer = await this.generateDiploma(
      event.diplomaTemplateUrl,
      'John Doe',
    );
    return pdfBuffer;
  }

  async sendBatch(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event || !event.diplomaTemplateUrl) {
      throw new NotFoundException('Event or diploma template not found');
    }

    const attendees = await this.prisma.attendee.findMany({
      where: {
        eventId,
        checkedIn: true,
        diplomaSent: false,
      },
    });

    this.logger.log(`Found ${attendees.length} attendees to send diplomas to.`);

    let sentCount = 0;
    for (const attendee of attendees) {
      try {
        const pdfBuffer = await this.generateDiploma(
          event.diplomaTemplateUrl,
          attendee.name,
        );
        const sent = await this.emailService.sendDiploma(
          attendee.email,
          attendee.name,
          event.name,
          pdfBuffer,
        );

        if (sent) {
          await this.prisma.attendee.update({
            where: { id: attendee.id },
            data: { diplomaSent: true },
          });
          sentCount++;
        }
      } catch (error) {
        this.logger.error(
          `Failed to process diploma for ${attendee.email}`,
          error,
        );
      }
    }

    return {
      message: `Diplomas sending process completed. Sent: ${sentCount}/${attendees.length}`,
    };
  }
}
