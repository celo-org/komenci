import { WasmBlsBlindingClient } from '@celo/identity/lib/odis/bls-blinding-client'
import { getBlindedPhoneNumber } from '@celo/identity/lib/odis/phone-number-identifier'

import {
  normalizeAddressWith0x,
  privateKeyToAddress
} from '@celo/utils/lib/address'

const thresholdBls = require('blind-threshold-bls')

export const ODIS_URL =
  'https://us-central1-celo-phone-number-privacy-stg.cloudfunctions.net'
export const PRIVATE_KEY =
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
// 0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb
export const ACCOUNT_ADDRESS = normalizeAddressWith0x(
  privateKeyToAddress(PRIVATE_KEY)
)

export const PRIVATE_KEY_NO_QUOTA =
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890000000'
export const ACCOUNT_ADDRESS_NO_QUOTA = privateKeyToAddress(
  PRIVATE_KEY_NO_QUOTA
)

export const PHONE_NUMBER = '+14155550000'
export const BLINDING_FACTOR = new Buffer(
  '0IsBvRfkBrkKCIW6HV0/T1zrzjQSe8wRyU3PKojCnww=',
  'base64'
)

const odisPubKey =
'7FsWGsFnmVvRfMDpzz95Np76wf/1sPaK0Og9yiB+P8QbjiC8FV67NBans9hzZEkBaQMhiapzgMR6CkZIZPvgwQboAxl65JWRZecGe5V3XO4sdKeNemdAZ2TzQuWkuZoA'
const blsBlindingClient = new WasmBlsBlindingClient(odisPubKey)
export function getTestBlindedPhoneNumber() {
  return getBlindedPhoneNumber(
      PHONE_NUMBER,
      blsBlindingClient
    )
  }

export const MOCK_ODIS_RESPONSE =
  '0Uj+qoAu7ASMVvm6hvcUGx2eO/cmNdyEgGn0mSoZH8/dujrC1++SZ1N6IP6v2I8A'
