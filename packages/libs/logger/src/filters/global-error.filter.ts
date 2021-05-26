import {
  ArgumentsHost,
  Catch,
  Inject,
} from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'
import { throwError as _throw } from 'rxjs'
import { KomenciLoggerService } from '../komenci-logger.service'

@Catch()
export class AllExceptionFilter extends BaseExceptionFilter {
  @Inject()
  protected readonly logger: KomenciLoggerService

  catch(exception: unknown, host: ArgumentsHost) {
    this.logger.error(exception)
    super.catch(exception, host)
  }
}

