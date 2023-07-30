import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { v2 as cloudinary } from 'cloudinary';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({
    credentials: true,
    methods: 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS',
    origin: process.env.CLIENT_HOST,
  });
  app.use(cookieParser());

  cloudinary.config({
    cloud_name: configService.get('CLOUD_NAME'),
    api_key: configService.get('API_KEY'),
    api_secret: configService.get('API_SECRET'),
  });

  const config = new DocumentBuilder()
    .setTitle('Intern Project - Booking-room-2')
    .setDescription('Nestjs - Prisma - Postgresql')
    .setVersion('1.0')
    .addBearerAuth({
      description: `[just text field] Please enter token in following format: Bearer <JWT>`,
      name: 'Authorization',
      bearerFormat: 'Bearer',
      scheme: 'Bearer',
      type: 'http',
      in: 'Header',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(configService.get<string>('PORT'));
}
bootstrap();
