import { walletConfig, WalletConfig } from '@app/blockchain/config/wallet.config'
import { DistributedBlindedPepperDto } from '@app/onboarding/dto/DistributedBlindedPepperDto'
import { ContractKit, OdisUtils } from '@celo/contractkit'
import { replenishQuota } from '@celo/phone-number-privacy-common/lib/test/utils'
import { Test } from '@nestjs/testing'
import { appConfig, AppConfig } from 'apps/relayer/src/config/app.config'
import { OdisQueryErrorTypes, OdisService } from 'apps/relayer/src/odis/odis.service'
import Web3 from 'web3'

jest.mock('@celo/phone-number-privacy-common/lib/test/utils', () => {
  return {
    replenishQuota: jest.fn()
  }
})

describe('OdisService', () => {
  const contractKit = jest.fn()
  const setupService = async (
    testAppConfig: Partial<AppConfig>,
    testWalletConfig: Partial<WalletConfig>
  ): Promise<OdisService>  => {
    const appConfigValue: Partial<AppConfig> = {
      networkConfig: {
        fullNodeUrl: '',
        odisPubKey: '',
        odisUrl: '',
      },
      ...testAppConfig
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
        { provide: appConfig.KEY, useValue: appConfigValue }
      ]
    }).compile()

    return module.get<OdisService>(OdisService)
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('#getPhoneNumberIdentifier', () => {
    const e164Number = '+40723331265'
    const odisResponseOk = {
      phoneHash: Web3.utils.randomHex(10),
      pepper: Web3.utils.randomHex(10),
      e164Number,
    }
    const odisErrorUnknown = new Error("unknown")
    const odisErrorOutOfQuota = new Error("odisQuotaError")
    const input: DistributedBlindedPepperDto = {
      e164Number,
      clientVersion: "1"
    }

    it('queries ODIS for the phone number identifier', async () => {
      const getPhoneNumberIdentifier = jest.spyOn(
        OdisUtils.PhoneNumberIdentifier,
        'getPhoneNumberIdentifier'
      ).mockResolvedValue(odisResponseOk)

      const svc = await setupService({}, {})
      const res = await svc.getPhoneNumberIdentifier(input)
      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(getPhoneNumberIdentifier).toHaveBeenCalled()
        expect(res.result.identifier).toBe(odisResponseOk.phoneHash)
      }
    })

    describe('when the relayer is out of quota', () => {
      it('throws an error after trying two times', async () => {
        const getPhoneNumberIdentifier = jest.spyOn(
          OdisUtils.PhoneNumberIdentifier,
          'getPhoneNumberIdentifier'
        ).mockRejectedValue(odisErrorOutOfQuota)

        const svc = await setupService({}, {})
        const res = await svc.getPhoneNumberIdentifier(input)
        expect(res.ok).toBe(false)
        if (res.ok === false) {
          expect(res.error.errorType).toBe(OdisQueryErrorTypes.OutOfQuota)
        }
        expect(replenishQuota).toHaveBeenCalled()
        expect(getPhoneNumberIdentifier).toHaveBeenCalledTimes(2)
      })

      it('works if the 2nd call succeeds', async () => {
        let callCount = 0
        const getPhoneNumberIdentifier = jest.spyOn(
          OdisUtils.PhoneNumberIdentifier,
          'getPhoneNumberIdentifier'
        ).mockImplementation(() => {
          if (callCount++ === 0) {
            return Promise.reject(odisErrorOutOfQuota)
          } else {
            return Promise.resolve(odisResponseOk)
          }
        })

        const svc = await setupService({}, {})
        const res = await svc.getPhoneNumberIdentifier(input)
        expect(res.ok).toBe(true)
        if (res.ok) {
          expect(getPhoneNumberIdentifier).toHaveBeenCalled()
          expect(res.result.identifier).toBe(odisResponseOk.phoneHash)
        }
        expect(replenishQuota).toHaveBeenCalled()
        expect(getPhoneNumberIdentifier).toHaveBeenCalledTimes(2)
      })
    })

    describe('when un unhandled error occurs', () => {
      it('wraps and returns the error', async () => {
        const getPhoneNumberIdentifier = jest.spyOn(
          OdisUtils.PhoneNumberIdentifier,
          'getPhoneNumberIdentifier'
        ).mockRejectedValue(odisErrorUnknown)

        const svc = await setupService({}, {})
        const res = await svc.getPhoneNumberIdentifier(input)
        expect(res.ok).toBe(false)
        if (res.ok === false) {
          expect(res.error.errorType).toBe(OdisQueryErrorTypes.Unknown)
          if (res.error.errorType === OdisQueryErrorTypes.Unknown) {
            expect(res.error.odisError).toBe(odisErrorUnknown)
          }
        }
        expect(getPhoneNumberIdentifier).toHaveBeenCalledTimes(1)
      })
    })
  })
})
