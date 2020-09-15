
import { getBlindedPhoneNumber } from '@celo/phone-number-privacy-common/lib/test/utils'
import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'

const thresholdBls = require('blind-threshold-bls')

export const ODIS_URL = 'https://us-central1-celo-phone-number-privacy-stg.cloudfunctions.net'
export const PRIVATE_KEY = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
// 0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb
export const ACCOUNT_ADDRESS = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY)) 

export const PRIVATE_KEY_NO_QUOTA =
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890000000'
export const ACCOUNT_ADDRESS_NO_QUOTA = privateKeyToAddress(PRIVATE_KEY_NO_QUOTA)

export const PHONE_NUMBER = '+14155550000'
export const BLINDING_FACTOR = new Buffer('0IsBvRfkBrkKCIW6HV0/T1zrzjQSe8wRyU3PKojCnww=', 'base64')
export const BLINDED_PHONE_NUMBER = getBlindedPhoneNumber(PHONE_NUMBER, BLINDING_FACTOR)

export const MOCK_ODIS_RESPONSE = '0Uj+qoAu7ASMVvm6hvcUGx2eO/cmNdyEgGn0mSoZH8/dujrC1++SZ1N6IP6v2I8A'
