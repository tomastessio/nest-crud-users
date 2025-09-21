import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let payload: any = {
      statusCode: status,
      error: 'Internal Server Error',
      message: 'Unexpected error',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      // response puede ser string o objeto
      if (typeof response === 'string') {
        payload = { statusCode: status, error: response };
      } else {
        payload = { statusCode: status, ...response };
      }
    } else if (exception instanceof Error) {
      payload = {
        statusCode: status,
        error: exception.name,
        message: exception.message,
      };
    }

    payload.timestamp = new Date().toISOString();
    payload.path = req.url;

    res.status(status).json(payload);
  }
}
