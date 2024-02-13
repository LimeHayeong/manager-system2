import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
} from '@nestjs/common'

import { ApiError } from './types/api.response'
import { Response } from 'express'

@Catch(HttpException)
  export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
      const ctx = host.switchToHttp()
      const response = ctx.getResponse<Response>()
      const status = exception.getStatus()
      const err = exception.getResponse() as
        | { message: any; statusCode: number; error: string }
        | { message: string[]; statusCode: 400; error: string[] }
  
      // console.log('httpExceptionFilter');

      const errorResponse: ApiError = {
        success: false,
        statusCode: status,
        message: err.message,
      }
  
      if (typeof err !== 'string' && err.statusCode === 400) {
        // class-validator 에러
        return response.status(status).json(errorResponse)
      }
      response.status(status).json(errorResponse)
    }
  }
  