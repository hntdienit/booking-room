import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { sendMailEvent } from './events/sendMail.event';
import { MailCallMicroservices, MailServiceMicroservices } from './mail.enum';
@Injectable()
export class MailService {
  constructor(
    @Inject(MailServiceMicroservices.mailServiceMicroservices)
    private clientMail: ClientProxy,
  ) {}

  private readonly logger = new Logger(MailService.name);

  async callMailMicroservices(event: sendMailEvent) {
    try {
      this.clientMail.emit<number>(
        MailCallMicroservices.mailCallMicroservices,
        event,
      );
    } catch (err) {
      this.logger.warn('Email sent error: ' + err);
    }
  }
}
