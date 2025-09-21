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
  // Punto de entrada del filtro: normalizo la respuesta de error a un JSON consistente
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    // Por defecto, si no reconozco el tipo, respondo 500
    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    // Payload base (luego lo voy enriqueciendo según el tipo de error)
    let payload: any = {
      statusCode: status,
      error: 'Internal Server Error',
      message: 'Unexpected error',
    };

    // Si es una HttpException (throw new BadRequestException(), ConflictException, etc.)
    if (exception instanceof HttpException) {
      status = exception.getStatus();

      // getResponse() puede ser string (mensaje simple) o un objeto (custom payload)
      const response = exception.getResponse();

      if (typeof response === 'string') {
        // Caso simple: solo mensaje → lo mapeo como "error"
        payload = { statusCode: status, error: response };
      } else {
        // Caso custom: mergeo todo para respetar { error, message, field, ... }
        payload = { statusCode: status, ...response };
      }
    }
    // Si es un Error genérico de JS/TS (no HttpException), devuelvo 500 con nombre y message
    else if (exception instanceof Error) {
      payload = {
        statusCode: status,
        error: exception.name,     // ej: TypeError, PrismaClientKnownRequestError, etc.
        message: exception.message,
      };
    }

    // Metadatos comunes para trazabilidad
    payload.timestamp = new Date().toISOString();
    payload.path = req.url;

    // Respuesta final unificada
    res.status(status).json(payload);
  }
}
