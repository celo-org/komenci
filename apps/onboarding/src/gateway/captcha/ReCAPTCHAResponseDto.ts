export enum ErrorCode {
  MissingInputSecret = "missing-input-secret",
  InvalidInputSecret = "invalid-input-secret",
  MissingInputResponse = "missing-input-response",
  InvalidInputResponse = "invalid-input-response",
  BadRequest = "bad-request",
  TimeoutOrDuplicate = "timeout-or-duplicate"
}

export interface ReCAPTCHAResponseDto {
  success: boolean
  challenge_ts: string
  hostname?: string
  action?: string
  apk_package_name?: string
  'error-codes': ErrorCode[]
}