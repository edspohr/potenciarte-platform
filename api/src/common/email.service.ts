import { Injectable, Logger } from '@nestjs/common';
import sgMail from '@sendgrid/mail';
import * as QRCode from 'qrcode';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    } else {
      this.logger.warn('SENDGRID_API_KEY not found');
    }
  }

  async sendInvitation(
    email: string,
    name: string,
    attendeeId: string,
    eventName: string,
  ) {
    if (!process.env.SENDGRID_API_KEY) {
      this.logger.warn(`Skipping email to ${email} (No API Key)`);
      return false;
    }

    try {
      const qrCodeDataUrl = await QRCode.toDataURL(attendeeId);
      const base64Data = qrCodeDataUrl.split(';base64,').pop() || '';

      const msg = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@potenciarte.com', // Override in .env
        subject: `Tu entrada para ${eventName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>¡Hola ${name}!</h2>
            <p>Estás invitado a <strong>${eventName}</strong>.</p>
            <p>Tu código de acceso es el siguiente QR. Por favor preséntalo al ingreso.</p>
            <div style="text-align: center; margin: 20px 0;">
              <img src="cid:qrcode" alt="QR Code" style="width: 200px; height: 200px;" />
            </div>
            <p>ID: ${attendeeId}</p>
          </div>
        `,
        attachments: [
          {
            content: base64Data,
            filename: 'qrcode.png',
            type: 'image/png',
            disposition: 'inline',
            content_id: 'qrcode',
          },
        ],
      };

      await sgMail.send(msg);
      this.logger.log(`Email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending email to ${email}:`, error);
      return false;
    }
  }
}
