import { RootError } from '@celo/base/lib/result'

export abstract class ApiError<TError, TMetadata = never> extends RootError<TError> {
  _apiError: boolean = true
  abstract statusCode: number
  metadata?: TMetadata

  protected constructor(
    errorType: TError,
  ) {
    super(errorType)
  }

  toJSON = () => {
    return {
      statusCode: this.statusCode,
      errorType: this.errorType,
      message: this.message,
      ...(this.metadata ? {metadata: this.metadata} : {})
    }
  }
}
