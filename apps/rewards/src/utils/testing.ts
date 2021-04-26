import { EventLog, Transaction } from 'web3-core'

export const partialTransaction = (tx: Partial<Transaction>): Transaction => ({
  hash: '123',
  nonce: 0,
  blockHash: '0x123',
  blockNumber: 123,
  transactionIndex: 0,
  from: '0x123',
  to: '0x123',
  value: '123',
  gasPrice: '123',
  gas: 123,
  input: '123',
  ...tx
})

export const partialEventLog = (overrides: Partial<EventLog>): EventLog => ({
  event: 'test',
  address: '0x123',
  logIndex: 0,
  transactionIndex: 0,
  blockHash: '0x123',
  transactionHash: '0x123',
  blockNumber: 1234,
  returnValues: {},
  ...overrides
})
