import { WEB3_PROVIDER } from '@app/blockchain/blockchain.module'
import { Test, TestingModule } from '@nestjs/testing'
import Web3 from 'web3'
import { BlockchainErrorTypes, BlockchainService } from './blockchain.service'

jest.mock('web3')

describe('BlockchainService', () => {
  let service: BlockchainService
  const web3Provider = new Web3.providers.HttpProvider('')

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainService,
        {
          provide: WEB3_PROVIDER,
          useValue: web3Provider,
        }
      ],
    }).compile()

    service = module.get<BlockchainService>(BlockchainService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  const mockSend = (error: Error | null, payload?: any): jest.SpyInstance => {
    return jest.spyOn(web3Provider, 'send').mockImplementation(
      (params, callback) => {
        callback(error, {
          jsonrpc: params.jsonrpc,
          id: 1,
          result: payload
        })
      }
    )
  }

  describe("#getPendingTxPool", () => {
    describe('when send results in an error', () => {
      it('returns a NodeRPCError', async () => {
        const send = mockSend(new Error("test-error"))
        const resp = await service.getPendingTxPool()
        expect(resp.ok).toBe(false)
        if (resp.ok === false) {
          expect(resp.error.errorType).toBe(BlockchainErrorTypes.NodeRPC)
          if (resp.error.errorType === BlockchainErrorTypes.NodeRPC) {
            expect(resp.error.error.message).toMatch(/test-error/)
          }
        }
      })
    })

    describe('when send results in an unexpected payload', () => {
      it('returns a DecodeError', async () => {
        const send = mockSend(null, {'not': 'correct'})
        const resp = await service.getPendingTxPool()
        expect(resp.ok).toBe(false)
        if (resp.ok === false) {
          expect(resp.error.errorType).toBe(BlockchainErrorTypes.Decode)
        }
      })
    })

    describe('when send results in a correct payload', () => {
      it('returns the response', async () => {
        const payload = {
          "pending": {
            "0xeD8E4260dF93Fbbb4E4FBDa0225591a47E7c2C6c": {
              "154": {
                "blockHash":null,
                "blockNumber":null,
                "from":"0x47176f3ba4722657dbc27f8dbc32bd9dfefe90d5",
                "gas":"0x61a80",
                "gasPrice":"0x2cb41780",
                "feeCurrency":null,
                "gatewayFeeRecipient":null,
                "gatewayFee":"0x0",
                "hash":"0x37800114b91f3e1a5a2584121dc750ebdfdc5b48dff64c5648a606202d65ad4a",
                "input":"0x580d747a00000000000000000000000087614ed7af361a563c6a3624ccadd52e165f67c200000000000000000000000000000000000000000000000006f05b59d3b2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005edfce0bad47e24e30625c275457f5b4bb619241",
                "nonce":"0x3",
                "to":"0x1c3edf937cfc2f6f51784d20deb1af1f9a8655fa",
                "transactionIndex":null,
                "value":"0x0",
                "v":"0x15e09",
                "r":"0x55269138a02cd64289ad595719f71a3c67e1a2285db99842209d93fe52dd0cb7",
                "s":"0x552af6007a72f5337478693cf3a8db03091de84c4e4648339afc96aa24c4c497"
              }
            }
          },
          "queued": {
            "0xeD8E4260dF93Fbbb4E4FBDa0225591a47E7c2C6c": {
              "153": {
                "blockHash":null,
                "blockNumber":null,
                "from":"0x47176f3ba4722657dbc27f8dbc32bd9dfefe90d5",
                "gas":"0x61a80",
                "gasPrice":"0x2cb41780",
                "feeCurrency":null,
                "gatewayFeeRecipient":null,
                "gatewayFee":"0x0",
                "hash":"0x37800114b91f3e1a5a2584121dc750ebdfdc5b48dff64c5648a606202d65ad4a",
                "input":"0x580d747a00000000000000000000000087614ed7af361a563c6a3624ccadd52e165f67c200000000000000000000000000000000000000000000000006f05b59d3b2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005edfce0bad47e24e30625c275457f5b4bb619241",
                "nonce":"0x3",
                "to":"0x1c3edf937cfc2f6f51784d20deb1af1f9a8655fa",
                "transactionIndex":null,
                "value":"0x0",
                "v":"0x15e09",
                "r":"0x55269138a02cd64289ad595719f71a3c67e1a2285db99842209d93fe52dd0cb7",
                "s":"0x552af6007a72f5337478693cf3a8db03091de84c4e4648339afc96aa24c4c497"
              }
            }
          }

        }
        const send = mockSend(null, payload)
        const resp = await service.getPendingTxPool()
        if (resp.ok === true) {
          expect(resp.result).toMatchObject(payload)
        } else {
          console.log(resp.error)
        }
      })
    })
  })
})
