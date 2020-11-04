import { walletConfig, WalletConfig } from '@app/blockchain/config/wallet.config'
import { DistributedBlindedPepperDto } from '@app/onboarding/dto/DistributedBlindedPepperDto'
import { networkConfig, NetworkConfig } from '@app/utils/config/network.config'
import { ContractKit, OdisUtils } from '@celo/contractkit'
import { replenishQuota } from '@celo/phone-number-privacy-common/lib/test/utils'
import { Test } from '@nestjs/testing'
import { appConfig, AppConfig } from 'apps/relayer/src/config/app.config'
import { OdisQueryErrorTypes, OdisService } from 'apps/relayer/src/odis/odis.service'
import Web3 from 'web3'
import { getTestBlindedPhoneNumber } from '../config/testing-constants'

jest.mock('@celo/phone-number-privacy-common/lib/test/utils', () => {
  return {
    replenishQuota: jest.fn()
  }
})

describe('OdisService', () => {
  const contractKit = jest.fn()
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
      imports: [],
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
      const res = await svc.getPhoneNumberIdentifier(input)
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
        const res = await svc.getPhoneNumberIdentifier(input)
        expect(res.ok).toBe(false)
        if (res.ok === false) {
          expect(res.error.errorType).toBe(OdisQueryErrorTypes.OutOfQuota)
        }
        expect(replenishQuota).toHaveBeenCalled()
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
        const res = await svc.getPhoneNumberIdentifier(input)
        expect(res.ok).toBe(true)
        if (res.ok) {
          expect(getBlindedPhoneNumberSignature).toHaveBeenCalled()
          expect(res.result).toBe(combinedSignature)
        }
        expect(replenishQuota).toHaveBeenCalled()
        expect(getBlindedPhoneNumberSignature).toHaveBeenCalledTimes(2)
      })
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
        const res = await svc.getPhoneNumberIdentifier(input)
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
  })
})
