import { RootError } from '@celo/base/lib/result'

export abstract class ApiError<TError, TMetadata = never> extends RootError<TError> {
  // Can not use instanceof with classes that extend Error
  static isApiError(obj: any): boolean {
    return obj._apiError === true
      && typeof(obj.toJSON) === 'function'
  }

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
