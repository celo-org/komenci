import { hasProperty } from '@celo/contractkit/lib/utils/provider-utils'
import { LocalWallet } from '@celo/contractkit/lib/wallets/local-wallet'
import { ReadOnlyWallet } from '@celo/contractkit/lib/wallets/wallet'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ApplicationConfig } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { DistributedBlindedPepperDto } from 'apps/onboarding/src/dto/DistributedBlindedPepperDto'
import fetch from 'cross-fetch'
import { AppController } from './app.controller'
import appConfig, { AppConfig } from './config/app.config'
import { ACCOUNT_ADDRESS, ODIS_URL, PHONE_NUMBER, PRIVATE_KEY } from './config/testing-constants'
import { RelayerService } from './relayer.service'
import { ContractKitManager } from './wallet/contractkit-manager'

// Jest.mock('./wallet/contractkit-manager.ts')
const mockContractKitManagerWallet = jest.fn()
ContractKitManager.prototype.getWallet = mockContractKitManagerWallet
const mockWallet: LocalWallet = new LocalWallet()
mockWallet.addAccount(PRIVATE_KEY)
mockContractKitManagerWallet.mockReturnValue(mockWallet)
ContractKitManager.prototype.init = jest.fn()

// Override the relayer address
process.env.ADDRESS = ACCOUNT_ADDRESS
const odisURL = ODIS_URL + "/getBlindedMessageSig"

describe('AppController', () => {
  let appController: AppController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [appConfig],
          envFilePath: ['apps/onboarding/.env.local'],
        })],
      controllers: [AppController],
      providers: [RelayerService, ConfigService],
    }).compile()

    appController = app.get<AppController>(AppController)
  })

  describe('root', () => {
    xit('should return "Hello World!"', () => {
      // Expect(appController.getHello()).toBe('Hello World!');
    })
  })

  describe('getPhoneNumberIdentifier', () => {
    afterEach(() => {
      fetchMock.reset()
    })

    xit('should return 400 when input is improperly formatted', () => {
      const input: DistributedBlindedPepperDto = undefined
      expect(appController.getPhoneNumberIdentifier(input)).toThrowError("BadRequestException")
    })
    
    xit('should retry after increasing quota when out of quota error is hit', () => {
      // TODO
    })

    it('should return the identifier when input is correct', async () => {
      console.log(odisURL)
      fetchMock.post("https://us-central1-celo-phone-number-privacy-stg.cloudfunctions.net/getBlindedMessageSig", {
        success: true,
        combinedSignature: '0Uj+qoAu7ASMVvm6hvcUGx2eO/cmNdyEgGn0mSoZH8/dujrC1++SZ1N6IP6v2I8A',
      })

      // WORKS
      const res = await fetch(odisURL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: "hjkl",
      })
      const response = await res.json()
      const input: DistributedBlindedPepperDto = {
        e164Number: PHONE_NUMBER,
        clientVersion: "v1.0.0"
      }
      appController.getPhoneNumberIdentifier(input)
    })
  })
})
