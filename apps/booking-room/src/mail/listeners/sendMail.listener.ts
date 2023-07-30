import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { sendMailEvent } from '../events/sendMail.event';
import { MailEventEnum } from '../mail.enum';
import { MailService } from '../mail.service';

@Injectable()
export class SendMailListener {
  constructor(private readonly mailService: MailService) {}

  @OnEvent(MailEventEnum.sendMailListener)
  async handleSendEmailEvent(event: sendMailEvent) {
    await this.mailService.callMailMicroservices(event);
  }
}
