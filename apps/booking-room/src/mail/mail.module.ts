import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { SendMailListener } from './listeners/sendMail.listener';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MailServiceMicroservices } from './mail.enum';
@Module({
  imports: [
    ClientsModule.register([
      {
        name: MailServiceMicroservices.mailServiceMicroservices,
        transport: Transport.TCP,
      },
    ]),
  ],
  providers: [MailService, SendMailListener],
  exports: [MailService],
})
export class MailModule {}
