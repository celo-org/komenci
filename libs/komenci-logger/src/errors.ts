import { RootError } from '@celo/base/lib/result'

export const errorTypeSymbol = Symbol('errorType')
export const apiErrorSymbol = Symbol('ApiError')
export const metadataErrorSymbol = Symbol('MetadataError')
const errMetadataPropsKey = Symbol('MetadataError:props')

export abstract class MetadataError<TError> extends RootError<TError> {
  [errorTypeSymbol] = metadataErrorSymbol
  abstract metadataProps: string[]

  protected constructor(
    errorType: TError,
  ) {
    super(errorType)
  }

  getMetadata = (): object => {
    return this.metadataProps.reduce((metadata, key) => {
      if (key in this) {
        metadata[key] = this[key]
      }
      return metadata
    }, {})
  }
}

export abstract class ApiError<TError, TMetadata extends object = any> extends MetadataError<TError> {
  [errorTypeSymbol] = apiErrorSymbol
  abstract statusCode: number

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
      metadata: this.getMetadata()
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

