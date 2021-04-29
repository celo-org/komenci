import { ApiError } from '@komenci/core'
import { Injectable } from '@nestjs/common'
import { JwtService } from  '@nestjs/jwt'
import { Session } from '../session/session.entity'
import { SessionService } from '../session/session.service'
import { isLeft } from 'fp-ts/Either'
import * as t from 'io-ts'

export const TokenPayload = t.type({
  sessionId: t.string
})

export type TokenPayload = t.TypeOf<typeof TokenPayload>

export enum AuthErrorTypes {
  InvalidToken = "InvalidToken",
  SessionUnavailable = "SessionUnavailable"
}

export class InvalidToken extends ApiError<AuthErrorTypes.InvalidToken> {
  statusCode = 401
  metadataProps = []

  constructor() {
    super(AuthErrorTypes.InvalidToken)
    this.message = 'Invalid or outdated token'
  }
}

export class SessionUnavailable extends ApiError<AuthErrorTypes.SessionUnavailable> {
  statusCode = 401
  metadataProps = ['sessionId']

  constructor(readonly sessionId: string) {
    super(AuthErrorTypes.SessionUnavailable)
    this.message = 'Session no longer available'
  }
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService
  ) {}

  public async startSession(externalAccount: string): Promise<{ sessionId: string, token: string }> {
    const session = await this.sessionService.findOrCreateForAccount(externalAccount)
    const payload: TokenPayload = {
      sessionId: session.id
    }
    return {
      sessionId: session.id,
      token: this.jwtService.sign(payload)
    }
  }

  public async recoverSession(tokenPayload: unknown): Promise<Session> {
    const result = TokenPayload.decode(tokenPayload)
    if (isLeft(result)) {
      throw new InvalidToken()
    }
    const payload = result.right
    const session = await this.sessionService.findOne(payload.sessionId)
    if (session) {
      return session
    } else {
      throw new SessionUnavailable(payload.sessionId)
    }
  }
}