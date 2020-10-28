import { normalizeAddress, trimLeading0x } from '@celo/base'

// The method id (or method selector) is the first 4 bytes
// of the calldata => the first 8 chars in hex
export const extractMethodId = (calldata: string): string => {
  return trimLeading0x(calldata).slice(0, 8).toLocaleLowerCase()
}

export const normalizeMethodId = (methodId: string): string => {
  return trimLeading0x(methodId).toLocaleLowerCase()
}