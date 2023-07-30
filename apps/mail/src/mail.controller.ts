import { Controller } from '@nestjs/common';
import { MailService } from './mail.service';
import { EventPattern } from '@nestjs/microservices';
import { MailCallMicroservices, MailQueueEnum } from './mail.enum';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Controller()
export class MailController {
  constructor(
    private readonly mailService: MailService,
    @InjectQueue(MailQueueEnum.sendMailQueue) private readonly mailQueue: Queue,
  ) {}

  @EventPattern(MailCallMicroservices.mailCallMicroservices)
  async handleUserCreated(data: any) {
    await this.mailQueue.add(MailQueueEnum.sendMailQueue, data);
  }
}
