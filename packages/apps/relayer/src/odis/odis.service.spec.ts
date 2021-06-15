import { ContractKit } from '@celo/contractkit'
import { WrapperCache } from '@celo/contractkit/lib/contract-cache'
import { OdisUtils } from '@celo/identity'
import { DistributedBlindedPepperDto } from '@komenci/api/dist/dto/DistributedBlindedPepperDto'
import { walletConfig, WalletConfig } from '@komenci/blockchain/dist/config/wallet.config'
import { networkConfig, NetworkConfig } from '@komenci/core'
import { KomenciLoggerModule } from '@komenci/logger'
import { Test } from '@nestjs/testing'
import Web3 from 'web3'
import { appConfig, AppConfig } from '../config/app.config'
import { getTestBlindedPhoneNumber } from '../config/testing-constants'
import { OdisQueryErrorTypes, OdisService } from './odis.service'

jest.mock('@celo/phone-number-privacy-common/lib/test/utils', () => {
  return {
    replenishQuota: jest.fn()
  }
})
jest.mock('@celo/contractkit')
jest.mock('@celo/contractkit/lib/wrappers/GoldTokenWrapper')
jest.mock('@celo/contractkit/lib/contract-cache')

describe('OdisService', () => {
  // @ts-ignore
  const contractKit = new ContractKit()
  // @ts-ignore
  const celoTxObject = {
    sendAndWaitForReceipt: jest.fn()
  }
  // @ts-ignore
  contractKit.contracts = new WrapperCache()
  const goldToken = {
    transfer: () => celoTxObject
  }
  jest.spyOn(contractKit.contracts, 'getGoldToken').mockResolvedValue(goldToken as any)

  const setupService = async (
    testAppConfig: Partial<AppConfig>,
    testWalletConfig: Partial<WalletConfig>,
    testNetworkConfig: Partial<NetworkConfig>
  ): Promise<OdisService>  => {
    const appConfigValue: Partial<AppConfig> = {
      ...testAppConfig
    }

    const networkConfigValue: Partial<NetworkConfig> = {
      odis: {
        url: '',
        publicKey: ''
      },
      ...testNetworkConfig
    }

    const walletConfigValue: Partial<WalletConfig> = {
      ...testWalletConfig
    }

    const module = await Test.createTestingModule({
      imports: [
        KomenciLoggerModule.forRoot()
      ],
      providers: [
        OdisService,
        { provide: ContractKit, useValue: contractKit },
        { provide: walletConfig.KEY, useValue: walletConfigValue },
        { provide: appConfig.KEY, useValue: appConfigValue },
        { provide: networkConfig.KEY, useValue: networkConfigValue }
      ]
    }).compile()

    return module.get<OdisService>(OdisService)
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('#getPhoneNumberIdentifier', () => {
    const combinedSignature = Web3.utils.randomHex(10)
    
    const odisErrorUnknown = new Error("unknown")
    const odisErrorOutOfQuota = new Error("odisQuotaError")
    const odisRetryError = new Error("odisRetryError")

    it('queries ODIS for the phone number identifier', async () => {
      const getBlindedPhoneNumberSignature = jest.spyOn(
        OdisUtils.PhoneNumberIdentifier,
        'getBlindedPhoneNumberSignature'
      ).mockResolvedValue(combinedSignature)


      const blindedPhoneNumber = await getTestBlindedPhoneNumber()
      const input: DistributedBlindedPepperDto = {
        blindedPhoneNumber: blindedPhoneNumber,
        clientVersion: "1"
      }
      
      const svc = await setupService({}, {}, {})
      const res = await svc.getPhoneNumberSignature(input)
      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(getBlindedPhoneNumberSignature).toHaveBeenCalled()
        expect(res.result).toBe(combinedSignature)
      }
    })

    describe('when the relayer is out of quota', () => {
      it('throws an error after trying two times', async () => {
        const getBlindedPhoneNumberSignature = jest.spyOn(
          OdisUtils.PhoneNumberIdentifier,
          'getBlindedPhoneNumberSignature'
        ).mockRejectedValue(odisErrorOutOfQuota)

        const blindedPhoneNumber = await getTestBlindedPhoneNumber()
        const input: DistributedBlindedPepperDto = {
          blindedPhoneNumber: blindedPhoneNumber,
          clientVersion: "1"
        }

        const svc = await setupService({}, {}, {})
        const res = await svc.getPhoneNumberSignature(input)
        expect(res.ok).toBe(false)
        if (res.ok === false) {
          expect(res.error.errorType).toBe(OdisQueryErrorTypes.OutOfQuota)
        }
        // Cody TODO: Reinstate once merge with mono is ready
        // expect(replenishQuota).toHaveBeenCalled()
        expect(getBlindedPhoneNumberSignature).toHaveBeenCalledTimes(2)
      })

      it('works if the 2nd call succeeds', async () => {
        let callCount = 0
        const getBlindedPhoneNumberSignature = jest.spyOn(
          OdisUtils.PhoneNumberIdentifier,
          'getBlindedPhoneNumberSignature'
        ).mockImplementation(() => {
          if (callCount++ === 0) {
            return Promise.reject(odisErrorOutOfQuota)
          } else {
            return Promise.resolve(combinedSignature)
          }
        })

        const blindedPhoneNumber = await getTestBlindedPhoneNumber()
        const input: DistributedBlindedPepperDto = {
          blindedPhoneNumber: blindedPhoneNumber,
          clientVersion: "1"
        }

        const svc = await setupService({}, {}, {})
        const res = await svc.getPhoneNumberSignature(input)
        expect(res.ok).toBe(true)
        if (res.ok) {
          expect(getBlindedPhoneNumberSignature).toHaveBeenCalled()
          expect(res.result).toBe(combinedSignature)
        }
        // Cody TODO: Reinstate once merge with mono is ready
        // expect(replenishQuota).toHaveBeenCalled()
        expect(getBlindedPhoneNumberSignature).toHaveBeenCalledTimes(2)
      })

    describe('when un unhandled error occurs', () => {
      it('wraps and returns the error', async () => {
        const getBlindedPhoneNumberSignature = jest.spyOn(
          OdisUtils.PhoneNumberIdentifier,
          'getBlindedPhoneNumberSignature'
        ).mockRejectedValue(odisErrorUnknown)

        const blindedPhoneNumber = await getTestBlindedPhoneNumber()
        const input: DistributedBlindedPepperDto = {
          blindedPhoneNumber: blindedPhoneNumber,
          clientVersion: "1"
        }

        const svc = await setupService({}, {}, {})
        const res = await svc.getPhoneNumberSignature(input)
        expect(res.ok).toBe(false)
        if (res.ok === false) {
          expect(res.error.errorType).toBe(OdisQueryErrorTypes.Unknown)
          if (res.error.errorType === OdisQueryErrorTypes.Unknown) {
            expect(res.error.odisError).toBe(odisErrorUnknown)
          }
        }
        expect(getBlindedPhoneNumberSignature).toHaveBeenCalledTimes(1)
      })
    })

    describe("when fail more than two times", ()=> {
      it('retry more than two times fail', async() => {
        const getBlindedPhoneNumberSignature = jest.spyOn(
          OdisUtils.PhoneNumberIdentifier,
          'getBlindedPhoneNumberSignature'
        ).mockRejectedValueOnce(odisErrorOutOfQuota)
        .mockRejectedValueOnce(odisErrorOutOfQuota)
        .mockRejectedValue(odisRetryError)
          await expect(getBlindedPhoneNumberSignature).rejects.toEqual(odisErrorOutOfQuota)
          await expect(getBlindedPhoneNumberSignature).rejects.toEqual(odisErrorOutOfQuota)
          await expect(getBlindedPhoneNumberSignature).rejects.toEqual(odisRetryError)
          expect(getBlindedPhoneNumberSignature).toHaveBeenCalledTimes(3)
        })
    })
  })
})
})
