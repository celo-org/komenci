import { RootError } from '@celo/base/lib/result'

export const errorTypeSymbol = Symbol('errorType')
export const apiErrorSymbol = Symbol('ApiError')
export const metadataErrorSymbol = Symbol('MetadataError')

export abstract class MetadataError<TError, TMetadata extends object = {}> extends RootError<TError> {
  [errorTypeSymbol] = metadataErrorSymbol

  protected constructor(
    errorType: TError,
    public readonly metadata: TMetadata
  ) {
    super(errorType)
  }
}

export abstract class ApiError<TError, TMetadata extends object = {}> extends MetadataError<TError, TMetadata> {
  [errorTypeSymbol] = apiErrorSymbol
  abstract statusCode: number

  protected constructor(
    errorType: TError,
    metadata?: TMetadata
  ) {
    super(errorType, metadata)
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

export const isRootError = (error: any) => {
  return error.errorType !== undefined
}

export const isMetadataError = (error: any) => {
  return error[errorTypeSymbol] === metadataErrorSymbol
}

export const isApiError = (error: any) => {
  return error[errorTypeSymbol] === apiErrorSymbol
}
