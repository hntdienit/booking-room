import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { BullModule } from '@nestjs/bull';
import { MailQueueEnum } from './mail.enum';
import { MailProcessor } from './mail.processor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MailerModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('MAIL_HOST'),
          port: configService.get('MAIL_PORT'),
          auth: {
            user: configService.get('MAIL_USER'),
            pass: configService.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: '"No Reply" <noreply@example.com>',
        },
        template: {
          dir: join(__dirname, '..', '..', 'apps/mail/templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        redis: {
          tls: true,
          enableTLSForSentinelMode: false,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        } as any,
        url: configService.get<string>('DATABASE_REDIS_URL'),
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: MailQueueEnum.sendMailQueue,
    }),
  ],
  controllers: [MailController],
  providers: [MailService, MailProcessor],
})
export class MailModule {}
