import { StartSessionDto } from '@app/onboarding/dto/StartSessionDto'
import { Err, Ok, RootError } from '@celo/base/lib/result'
import { recoverMessageSigner } from '@celo/contractkit/lib/utils/signing-utils'
import { hashMessage } from '@celo/utils/lib/signatureUtils'
import { Injectable } from '@nestjs/common'
import { Rule, RuleID } from './rule'

export enum SignatureErrorTypes {
  InvalidSignature = 'InvalidSignature'
}

export class InvalidSignature extends RootError<SignatureErrorTypes> {
  constructor() {
    super(SignatureErrorTypes.InvalidSignature)
  }
}

@Injectable()
export class SignatureRule implements Rule<{}, InvalidSignature> {
  getID() {
    return RuleID.Signature
  }

  async verify(startSessionDto: StartSessionDto, config, context) {
    const signature = startSessionDto.signature
    const account = startSessionDto.externalAccount
    const message = hashMessage(`komenci:login:${account}`)
    const signer = recoverMessageSigner(message, signature)

    if (signer.toLocaleLowerCase() !== account.toLocaleLowerCase()) {
      return Err(new InvalidSignature())
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
