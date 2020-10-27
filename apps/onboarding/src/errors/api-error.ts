import { RootError } from '@celo/base/lib/result'

export class ApiError<T> {
  constructor(public message: string, public errorType: T, public status: number = 500) { }

  toJSON() {
    return {
      status: this.status,
      errorType: this.errorType,
      message: this.message,
    }
  }
}
