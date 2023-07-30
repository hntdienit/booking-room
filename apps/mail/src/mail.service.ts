import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}
  private readonly logger = new Logger(MailService.name);

  async sendToMail(args: {
    email: string;
    subject: string;
    template: string;
    context: object;
  }) {
    const mailOptions = {
      from: this.configService.get('MAIL_USER'),
      to: args.email,
      subject: args.subject,
      template: args.template,
      context: args.context,
    };
    try {
      const result = await this.mailerService.sendMail(mailOptions);
      this.logger.warn('Email sent: ' + result.response);
    } catch (err) {
      this.logger.warn('Email sent error: ' + err);
    }
  }
}
