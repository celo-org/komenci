import { RootError } from '@celo/base/lib/result'

export const errorTypeSymbol = Symbol('errorType')
export const apiErrorSymbol = Symbol('ApiError')
export const metadataErrorSymbol = Symbol('MetadataError')

export abstract class MetadataError<TError, TMetadata = object> extends RootError<TError> {
  [errorTypeSymbol] = metadataErrorSymbol

  public abstract readonly metadata: TMetadata

  protected constructor(
    errorType: TError,
  ) {
    super(errorType)
  }
}

export abstract class ApiError<TError, TMetadata extends object = any> extends MetadataError<TError, TMetadata> {
  [errorTypeSymbol] = apiErrorSymbol
  abstract statusCode: number
  public readonly metadata: TMetadata

  protected constructor(
    errorType: TError,
    metadata?: TMetadata
  ) {
    super(errorType)
    this.metadata = metadata
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

export const isRootError = (error: any): error is RootError<any> => {
  return error.errorType !== undefined
}

export const isMetadataError = (error: any): error is MetadataError<any> => {
  return error[errorTypeSymbol] === metadataErrorSymbol
}

export const isApiError = (error: any): error is ApiError<any, any> => {
  return error[errorTypeSymbol] === apiErrorSymbol
}

