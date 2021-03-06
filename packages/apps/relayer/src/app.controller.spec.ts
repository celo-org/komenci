import { Connection } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import { OdisUtils } from '@celo/identity'
import { LocalWallet } from '@celo/wallet-local'
import { DistributedBlindedPepperDto } from '@komenci/api/dist/dto/DistributedBlindedPepperDto'
import { BlockchainModule } from '@komenci/blockchain'
import { WALLET } from '@komenci/blockchain/dist/blockchain.providers'
import { nodeConfig, NodeConfig } from '@komenci/blockchain/dist/config/node.config'
import { walletConfig, WalletType } from '@komenci/blockchain/dist/config/wallet.config'
import { KomenciLoggerService } from '@komenci/logger'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import 'jest-fetch-mock'
import Web3 from 'web3'
import { OdisService } from './odis/odis.service'

import { AppController } from './app.controller'
import { appConfig } from './config/app.config'
import { ACCOUNT_ADDRESS, getTestBlindedPhoneNumber, MOCK_ODIS_RESPONSE, ODIS_URL, PRIVATE_KEY } from './config/testing-constants'

const mockWallet: LocalWallet = new LocalWallet()
mockWallet.addAccount(PRIVATE_KEY)

jest.mock('@komenci/logger')
jest.mock('@celo/identity/lib/odis/bls-blinding-client', () => {
  class WasmBlsBlindingClient {
    blindMessage = (m: string) => m
    unblindAndVerifyMessage = (m: string) => m
  }
  return {
    WasmBlsBlindingClient
  }
})

// Override the relayer address
const odisUrl = ODIS_URL + '/getBlindedMessageSig'

const mockContractKit = new ContractKit(
  new Connection(
    new Web3(new Web3.providers.HttpProvider(process.env.NODE_URL)),
    mockWallet
  )
)


describe('AppController', () => {
  let appController: AppController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfig, walletConfig, nodeConfig],
          envFilePath: ['apps/relayer/.env.local']
        }),
        BlockchainModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
            return {
              node: config.get<NodeConfig>('node'),
              wallet: {
                type: WalletType.Local,
                address: ACCOUNT_ADDRESS,
                privateKey: PRIVATE_KEY
              },
            }
          }
        }),
      ],
      controllers: [AppController],
      providers: [
        OdisService,
        ConfigService,
        {
          provide: WALLET,
          useValue: mockWallet
        },
        {
          provide: ContractKit,
          useValue: mockContractKit
        },
        KomenciLoggerService
      ]
    }).compile()

    appController = app.get<AppController>(AppController)
  })

  xdescribe('getPhoneNumberIdentifier', () => {
    afterEach(() => {
      fetchMock.resetMocks()
    })

    it('should retry after increasing quota when out of quota error is hit', async () => {
      fetchMock.mockIf(odisUrl, () => {
        return Promise.resolve({
          status: 403,
          body: 'Unauthorised',
        })
      })

      const getPhoneNumberIdentifierSpy = jest.spyOn(
        OdisUtils.PhoneNumberIdentifier,
        'getPhoneNumberIdentifier'
      )

      const input: DistributedBlindedPepperDto = {
        blindedPhoneNumber: await getTestBlindedPhoneNumber(),
        clientVersion: 'v1.0.0'
      }

      await expect(
        appController.getPhoneNumberIdentifier(input)
      ).rejects.toThrow('Unable to query ODIS due to out of quota error')

      expect(getPhoneNumberIdentifierSpy).toBeCalledTimes(2)
    })

    it('should return the identifier when input is correct', async () => {
      fetchMock.mockIf(odisUrl, () => {
        return Promise.resolve({
          status: 200,
          body: JSON.stringify({
            success: true,
            combinedSignature: MOCK_ODIS_RESPONSE
          })
        })
      })

      const input: DistributedBlindedPepperDto = {
        blindedPhoneNumber: await getTestBlindedPhoneNumber(),
        clientVersion: 'v1.0.0'
      }
      const result = await appController.getPhoneNumberIdentifier(input)
      expect(result.payload).toBe(
        '0xf3ddadd1f488cdd42b9fa10354fdcae67c303ce182e71b30855733b50dce8301'
      )
    })
  })
})
