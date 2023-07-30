import { NestFactory } from '@nestjs/core';
import { MailModule } from './mail.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MailModule,
    {
      transport: Transport.TCP,
    },
  );
  await app.listen();
}
bootstrap();
