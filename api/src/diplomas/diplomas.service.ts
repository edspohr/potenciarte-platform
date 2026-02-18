import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EmailService } from '../common/email.service';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as admin from 'firebase-admin';

@Injectable()
export class DiplomasService {
  private readonly logger = new Logger(DiplomasService.name);
  private db: admin.firestore.Firestore;
  private storage: admin.storage.Storage;

  constructor(private emailService: EmailService) {
    this.db = admin.firestore();
    this.storage = admin.storage();
  }

  async saveTemplate(eventId: string, file: Express.Multer.File) {
    const bucket = this.storage.bucket();
    const filename = `diploma-templates/${eventId}-${Date.now()}.pdf`;
    const fileRef = bucket.file(filename);

    await fileRef.save(file.buffer, {
      contentType: 'application/pdf',
      public: true, // Optional: depending on needs
    });

    // We store the storage path or public URL
    // For internal use, storage path or name is enough.
    // Let's store the full gs:// path or just the filename if we stick to one bucket.
    // Simpler: Store the public URL or media link if possible, or just the filename/path.
    // Let's store the cloud path.

    await this.db.collection('events').doc(eventId).update({
      diplomaTemplatePath: filename,
      updatedAt: new Date().toISOString(),
    });

    return { message: 'Template uploaded successfully', path: filename };
  }

  async generateDiploma(templatePath: string, name: string): Promise<Buffer> {
    const bucket = this.storage.bucket();
    const fileRef = bucket.file(templatePath);
    const [fileBuffer] = await fileRef.download();

    const pdfDoc = await PDFDocument.load(fileBuffer);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 30;
    const textWidth = font.widthOfTextAtSize(name, fontSize);

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
    const eventDoc = await this.db.collection('events').doc(eventId).get();

    if (!eventDoc.exists) {
      throw new NotFoundException('Event not found');
    }
    const eventData = eventDoc.data();

    if (!eventData?.diplomaTemplatePath) {
      throw new NotFoundException('Diploma template not found');
    }

    const pdfBuffer = await this.generateDiploma(
      eventData.diplomaTemplatePath as string,
      'John Doe',
    );
    return pdfBuffer;
  }

  async sendBatch(eventId: string) {
    const eventRef = this.db.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      throw new NotFoundException('Event not found');
    }
    const eventData = eventDoc.data();

    if (!eventData?.diplomaTemplatePath) {
      throw new NotFoundException('Diploma template not found');
    }

    const attendeesSnapshot = await eventRef
      .collection('attendees')
      .where('checkedIn', '==', true)
      .where('diplomaSent', '==', false)
      .get();

    this.logger.log(
      `Found ${attendeesSnapshot.size} attendees to send diplomas to.`,
    );

    let sentCount = 0;
    let batch = this.db.batch();
    let batchCount = 0;

    for (const doc of attendeesSnapshot.docs) {
      const attendee = doc.data();
      try {
        const pdfBuffer = await this.generateDiploma(
          eventData.diplomaTemplatePath as string,
          attendee.name as string,
        );
        const sent = await this.emailService.sendDiploma(
          attendee.email as string,
          attendee.name as string,
          eventData.name as string,
          pdfBuffer,
        );
        if (sent) {
          batch.update(doc.ref, {
            diplomaSent: true,
            diplomaSentAt: new Date().toISOString(),
          });
          batchCount++;
          sentCount++;
        }
      } catch (error) {
        this.logger.error(`Failed to send diploma to ${attendee.email}`, error);
      }

      if (batchCount >= 400) {
        await batch.commit();
        batch = this.db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    return {
      message: `Sent ${sentCount} diplomas`,
      total: attendeesSnapshot.size,
    };
  }
}
