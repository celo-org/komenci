import { RootError } from '@celo/base/lib/result';
import { AxiosError } from 'axios';

export enum HttpErrorTypes {
  RequestError = "RequestError"
}

export class HttpRequestError extends RootError<HttpErrorTypes> {
  constructor(error: AxiosError) {
    super(HttpErrorTypes.RequestError);
  }
}
