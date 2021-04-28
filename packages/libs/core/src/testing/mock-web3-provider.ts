import Web3 from 'web3'
import { JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers'

export type ResultForPayload = (payload: JsonRpcPayload) => [Error | null, JsonRpcResponse?]
export const buildMockWeb3Provider = (
  resultForPayload: ResultForPayload,
  overrides: any = {}
) => {
  const sendMock = jest.fn().mockImplementation((
    payload: JsonRpcPayload,
    callback: (error: Error | null, result?: JsonRpcResponse) => void
  ) => {
    const [err, result] = payload.params[0].to === '0x000000000000000000000000000000000000ce10'
      ? [null,  Web3.utils.padLeft(Web3.utils.randomHex(20), 64)]
      : resultForPayload(payload)

    callback(err, {
      jsonrpc: payload.jsonrpc,
      id: parseInt(payload.id as any, 10),
      result,
    })
  })

  return {
    host: 'mock-web3-host',
    connected: true,
    send: sendMock,
    supportsSubscriptions: () => true,
    disconnect: () => true,
    ...overrides
  }
}

