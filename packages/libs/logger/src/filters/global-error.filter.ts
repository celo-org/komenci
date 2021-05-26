
import { ArgumentsHost, Catch, ExceptionFilter,  HttpException, Inject } from '@nestjs/common'
import { throwError as _throw } from 'rxjs'
import { KomenciLoggerService } from '../komenci-logger.service'

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  @Inject()
  protected readonly logger: KomenciLoggerService

  catch(exception: unknown, host: ArgumentsHost) {
    this.logger.log(exception)
    // super.catch(exception, host)
  }
}

