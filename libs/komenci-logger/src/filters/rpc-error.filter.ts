import { KomenciLoggerService } from '@app/komenci-logger'
import {
  ArgumentsHost,
  Catch,
  Inject,
} from '@nestjs/common'
import { BaseRpcExceptionFilter } from '@nestjs/microservices'
import { Observable } from 'rxjs'

@Catch()
export class RpcErrorFilter extends BaseRpcExceptionFilter {
  @Inject()
  protected readonly logger: KomenciLoggerService

  catch(exception: any, host: ArgumentsHost): Observable<any> {
    this.logger.error(exception)
    return super.catch(exception, host)
  }
}
