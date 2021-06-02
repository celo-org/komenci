
import { ArgumentsHost, Catch, ExceptionFilter,  HttpException, Inject } from '@nestjs/common'
import { KomenciLoggerService } from '../komenci-logger.service'

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  @Inject()
  protected readonly logger: KomenciLoggerService

  catch(exception: unknown, host: ArgumentsHost) {
    this.logger.error(exception)
  }
}

