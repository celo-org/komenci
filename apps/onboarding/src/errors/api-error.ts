import { RootError } from '@celo/base/lib/result'

export class ApiError<T> extends RootError<T> {
  // Can not use instanceof with classes that extend Error
  static isApiError(obj: any): boolean {
    return obj._apiError === true
      && typeof(obj.toJSON) === 'function'
  }

  _apiError: boolean = true

  constructor(
    errorType: T,
    public readonly message: string,
    public readonly status: number = 500
  ) {
    super(errorType)
  }

  toJSON = () => {
    return {
      statusCode: this.status,
      errorType: this.errorType,
      message: this.message,
    }

  }
}
