import {
  ArgumentsHost,
  Catch,
  HttpServer,
  Inject,
} from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'
import { KomenciLoggerService } from '../komenci-logger.service'
import { throwError as _throw } from 'rxjs'

@Catch()
export class AllExceptionFilter extends BaseExceptionFilter {
  @Inject()
  protected readonly logger: KomenciLoggerService

  catch(exception: unknown, host: ArgumentsHost) {
    this.logger.error(exception)
    super.catch(exception, host);
  }
}

