import { isRight } from 'fp-ts/Either'
import * as t from 'io-ts'
import { of, race } from 'rxjs'
import { catchError, delay, map } from 'rxjs/operators'

import { Inject, Injectable, Scope } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import { ClientProxy } from '@nestjs/microservices'

import { Err, Ok, Result } from '@celo/base/lib/result'
import { MetadataError } from '@komenci/core'
import { appConfig, AppConfig } from '../config/app.config'
import { Session } from '../session/session.entity'
import { RelayerCmd, RelayerResponse } from '@komenci/relayer/dist/app.controller'
import { GetPhoneNumberSignatureDto } from '@komenci/relayer/dist/dto/GetPhoneNumberSignatureDto'
import { RelayerCommandDto } from '@komenci/relayer/dist/dto/RelayerCommandDto'
import { SignPersonalMessageDto } from '@komenci/relayer/dist/dto/SignPersonalMessageDto'
import { SubmitTransactionBatchDto } from '@komenci/relayer/dist/dto/SubmitTransactionBatchDto'
import { SubmitTransactionDto } from '@komenci/relayer/dist/dto/SubmitTransactionDto'


export enum RelayerErrorTypes {
  RelayerTimeout = "RelayerTimeout",
  RelayerCommunicationError = "RelayerCommunicationError",
  RelayerInternalError = "RelayerInternalError"
}

const InternalErrorPayload = t.type({
  errorType: t.string,
  message: t.string,
  metadata: t.unknown
})

type InternalErrorPayload = t.TypeOf<typeof InternalErrorPayload>


class RelayerTimeout extends MetadataError<RelayerErrorTypes.RelayerTimeout> {
  metadataProps = ['cmd']

  constructor(readonly cmd: string) {
    super(RelayerErrorTypes.RelayerTimeout)
  }
}

class RelayerCommunicationError extends MetadataError<RelayerErrorTypes.RelayerCommunicationError> {
  metadataProps = ['cmd']

  constructor(readonly message: string, readonly cmd: string) {
    super(RelayerErrorTypes.RelayerCommunicationError)
  }
}

class RelayerInternalError extends MetadataError<RelayerErrorTypes.RelayerInternalError> {
  metadataProps = ['internalError']

  constructor(readonly internalError: InternalErrorPayload) {
    super(RelayerErrorTypes.RelayerInternalError)
    this.message = `Relayer encountered an error`
  }
}

type RelayerError = RelayerTimeout | RelayerCommunicationError | RelayerInternalError
type RelayerResult<TResp> = Result<RelayerResponse<TResp>, RelayerError>

@Injectable({
  // RELAYER_SERVICE is request scoped
  scope: Scope.REQUEST
})
export class RelayerProxyService {
  constructor(
    @Inject('RELAYER_SERVICE') private client: ClientProxy,
    @Inject(appConfig.KEY) private cfg: AppConfig,
    @Inject(REQUEST) private req: Request & { id?: string, session?: Session }
  ) {}

  async signPersonalMessage(
    input: SignPersonalMessageDto
  ): Promise<RelayerResult<string>> {
    return this.execute(RelayerCmd.SignPersonalMessage, input)
  }

  async getPhoneNumberIdentifier(
    input: GetPhoneNumberSignatureDto
  ): Promise<RelayerResult<string>> {
    return this.execute(RelayerCmd.GetPhoneNumberIdentifier, input)
  }

  async submitTransaction(
    input: SubmitTransactionDto
  ): Promise<RelayerResult<string>> {
    return this.execute(RelayerCmd.SubmitTransaction, input)
  }


  async submitTransactionBatch(
    input: SubmitTransactionBatchDto
  ): Promise<RelayerResult<string>> {
    return this.execute(RelayerCmd.SubmitTransactionBatch, input)
  }

  private execute<TResp, TInput extends RelayerCommandDto>(
    cmd: RelayerCmd,
    input: TInput,
  ): Promise<RelayerResult<TResp>> {
    const inputWithContext: TInput = {
      ...input,
      context: this.context
    }

    return race<RelayerResult<TResp>>(
      of('timeout').pipe(
        delay(this.cfg.relayerRpcTimeoutMs),
        map(_ => Err(new RelayerTimeout(cmd)))
      ),
      this.client.send<RelayerResponse<TResp>>({cmd}, inputWithContext).pipe(
        map((resp) => Ok(resp)),
        catchError(err => {
          const res = InternalErrorPayload.decode(err)
          if (isRight(res)) {
            return of(Err(new RelayerInternalError(res.right)))
          } else {
            return of(Err(new RelayerCommunicationError(
              err.message,
              cmd
            )))

          }
        })
      )
    ).toPromise()
  }

  private get context() {
    return {
      traceId: this.req.id,
      labels: (
        this.req.session
          ? [
            {key: 'sessionId', value: this.req.session?.id},
            {key: 'externalAccount', value: this.req.session?.externalAccount},
          ]
          : []
      )
    }
  }

}

