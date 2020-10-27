import { StartSessionDto } from '@app/onboarding/dto/StartSessionDto'
import { ensureLeading0x } from '@celo/base'
import { Err, Ok, RootError } from '@celo/base/lib/result'
import { buildLoginTypedData } from '@celo/komencikit/lib/login'
import { generateTypedDataHash } from '@celo/utils/lib/sign-typed-data-utils'
import { parseSignatureWithoutPrefix } from '@celo/utils/lib/signatureUtils'
import { Injectable } from '@nestjs/common'
import { Rule, RuleID } from './rule'

export enum SignatureErrorTypes {
  InvalidSignature = 'InvalidSignature'
}

export class InvalidSignature extends RootError<SignatureErrorTypes> {
  constructor(public readonly error: Error) {
    super(SignatureErrorTypes.InvalidSignature)
  }
}

@Injectable()
export class SignatureRule implements Rule<{}, InvalidSignature> {
  getID() {
    return RuleID.Signature
  }

  async verify(startSessionDto: StartSessionDto, config, context) {
    const loginTypedData = buildLoginTypedData(
      startSessionDto.externalAccount,
      startSessionDto.captchaResponseToken
    )
    const messageHash = ensureLeading0x(generateTypedDataHash(loginTypedData).toString('hex'))
    const signature = startSessionDto.signature
    const signer = startSessionDto.externalAccount

    try {
      const parsedSig = parseSignatureWithoutPrefix(messageHash, signature, signer)
    } catch (e) {
      return Err(new InvalidSignature(e))
    }

    return Ok(true)
  }

  validateConfig(config?: string): {} {
    return {}
  }

  defaultConfig(): {} {
    return {}
  }
}
