import { BlockchainModule, WALLET } from '@app/blockchain'
import { nodeConfig, NodeConfig } from '@app/blockchain/config/node.config'
import { walletConfig, WalletType } from '@app/blockchain/config/wallet.config'
import { DistributedBlindedPepperDto } from '@app/onboarding/dto/DistributedBlindedPepperDto'
import { ContractKit, OdisUtils } from '@celo/contractkit'
import { LocalWallet } from '@celo/contractkit/lib/wallets/local-wallet'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import Web3 from 'web3'

import { AppController } from './app.controller'
import { appConfig } from './config/app.config'
import { ACCOUNT_ADDRESS, MOCK_ODIS_RESPONSE, ODIS_URL, PHONE_NUMBER, PRIVATE_KEY } from './config/testing-constants'
import { RelayerService } from './relayer.service'

const mockWallet: LocalWallet = new LocalWallet()
mockWallet.addAccount(PRIVATE_KEY)

jest.mock('@celo/contractkit/lib/identity/odis/bls-blinding-client', () => {
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
  new Web3(new Web3.providers.HttpProvider(process.env.NODE_URL)),
  mockWallet
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
        RelayerService,
        ConfigService,
        {
          provide: WALLET,
          useValue: mockWallet
        },
        {
          provide: ContractKit,
          useValue: mockContractKit
        }
      ]
    }).compile()

    appController = app.get<AppController>(AppController)
  })

  describe('getPhoneNumberIdentifier', () => {
    afterEach(() => {
      fetchMock.reset()
    })

    xit('should retry after increasing quota when out of quota error is hit', async () => {
      fetchMock.post(odisUrl, 403)

      const getPhoneNumberIdentifierSpy = jest.spyOn(
        OdisUtils.PhoneNumberIdentifier,
        'getPhoneNumberIdentifier'
      )

      const input: DistributedBlindedPepperDto = {
        e164Number: PHONE_NUMBER,
        clientVersion: 'v1.0.0'
      }

      await expect(
        appController.getPhoneNumberIdentifier(input)
      ).rejects.toThrow('Unable to query ODIS due to out of quota error')

      expect(getPhoneNumberIdentifierSpy).toBeCalledTimes(2)
    })

    xit('should return the identifier when input is correct', async () => {
      fetchMock.post(odisUrl, {
        success: true,
        combinedSignature: MOCK_ODIS_RESPONSE
      })

      const input: DistributedBlindedPepperDto = {
        e164Number: PHONE_NUMBER,
        clientVersion: 'v1.0.0'
      }
      const result = await appController.getPhoneNumberIdentifier(input)
      expect(result.identifier).toBe(
        '0xf3ddadd1f488cdd42b9fa10354fdcae67c303ce182e71b30855733b50dce8301'
      )
    })
  })
})
