import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export default class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = exception.message.replace(/\n/g, '');

    let status = 200;
    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        response.status(status).json({
          statusCode: status,
          message,
        });
        break;
      case 'P2025':
        status = HttpStatus.BAD_REQUEST;
        response.status(status).json({
          statusCode: status,
          message,
        });
        break;
      case 'P2000':
        status = HttpStatus.BAD_REQUEST;
        response.status(status).json({
          statusCode: status,
          message,
        });
        break;
      default:
        // default 500 error code
        super.catch(exception, host);
        break;
    }
  }
}