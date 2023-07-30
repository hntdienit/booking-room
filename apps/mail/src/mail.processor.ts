import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { MailQueueEnum } from './mail.enum';
import { MailService } from './mail.service';

@Processor(MailQueueEnum.sendMailQueue)
export class MailProcessor {
  constructor(private mailService: MailService) {}

  private readonly logger = new Logger(MailProcessor.name);

  @Process(MailQueueEnum.sendMailQueue)
  async handleSendMail(job: Job) {
    try {
      await this.mailService.sendToMail({
        email: job.data.email,
        subject: job.data.subject,
        template: job.data.template,
        context: job.data.context,
      });
    } catch (err) {
      this.logger.error(err);
    }
  }
}
