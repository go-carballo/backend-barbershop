import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { NotificationType } from '../notifications/entities/notification.entity';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private transport: Transporter | null = null;
  private readonly smtpHost: string | undefined;
  private readonly smtpPort: number | undefined;
  private readonly smtpUser: string | undefined;
  private readonly smtpPass: string | undefined;
  private readonly from: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.smtpHost = this.configService.get('SMTP_HOST');
    this.smtpPort = this.configService.get('SMTP_PORT')
      ? parseInt(this.configService.get('SMTP_PORT')!, 10)
      : undefined;
    this.smtpUser = this.configService.get('SMTP_USER');
    this.smtpPass = this.configService.get('SMTP_PASS');
    this.from = this.configService.get('SMTP_FROM');
  }

  private getTransport(): Transporter | null {
    if (this.transport) return this.transport;
    if (!this.smtpHost) return null;

    this.transport = createTransport({
      host: this.smtpHost,
      port: this.smtpPort ?? 587,
      secure: this.smtpPort === 465,
      auth:
        this.smtpUser || this.smtpPass
          ? { user: this.smtpUser, pass: this.smtpPass }
          : undefined,
    });

    return this.transport;
  }

  private getFromAddress(): string {
    return this.from ?? 'BarberShop <noreply@barbershop.app>';
  }

  async send(data: EmailData): Promise<void> {
    if (this.isDevEnvironment()) {
      // In dev, log instead of send
      console.log(`[EMAIL DEV] To: ${data.to} | Subject: ${data.subject} | HTML: ${data.html}`);
      return;
    }

    const transport = this.getTransport();
    if (!transport) {
      // No SMTP configured: silently drop in production
      console.warn('[EMAIL] SMTP not configured, dropping email to:', data.to);
      return;
    }

    try {
      await transport.sendMail({
        from: this.getFromAddress(),
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text,
      });
      console.log(`[EMAIL] Sent to: ${data.to}`);
    } catch (err) {
      console.error(`[EMAIL] Failed to send to ${data.to}:`, err);
      throw new Error(`Failed to send email to ${data.to}`);
    }
  }

  isDevEnvironment(): boolean {
    return this.configService.get('NODE_ENV') !== 'production';
  }
}