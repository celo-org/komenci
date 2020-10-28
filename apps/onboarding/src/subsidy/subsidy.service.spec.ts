import { appConfig, AppConfig } from '@app/onboarding/config/app.config'
import { RequestAttestationsDto } from '@app/onboarding/dto/RequestAttestationsDto'
import { SubsidyService } from '@app/onboarding/subsidy/subsidy.service'
import { WalletService } from '@app/onboarding/wallet/wallet.service'
import { ContractKit } from '@celo/contractkit'
import { WrapperCache } from '@celo/contractkit/lib/contract-cache'
import { AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { Test, TestingModule } from '@nestjs/testing'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'

jest.mock('@celo/contractkit')
jest.mock('@celo/contractkit/lib/wrappers/Attestations')
jest.mock('@celo/contractkit/lib/wrappers/StableTokenWrapper')
jest.mock('@celo/contractkit/lib/contract-cache')
jest.mock('@app/onboarding/wallet/wallet.service')

// @ts-ignore
const contractKit = new ContractKit()
// @ts-ignore
contractKit.contracts = new WrapperCache()
const attestations = {
  getAttestationStat: jest.fn(),
  requireNAttestationsRequested: jest.fn(),
  getAttestationFeeRequired: jest.fn(),
}
const stableToken = {
  transfer: jest.fn()
}


describe('SubsidyService', () => {
  const buildTestingModule = async (cfg: Partial<AppConfig>) => {
    return Test.createTestingModule({
      providers: [
        SubsidyService,
        ContractKit,
        WalletService,
        {
          provide: appConfig.KEY,
          useValue: cfg
        },
      ]
    }).overrideProvider(ContractKit).useValue(contractKit).compile()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const walletAddress = Web3.utils.randomHex(20)

  describe('#buildTransactionBatch', () => {
    const input: RequestAttestationsDto = {
      identifier: Web3.utils.randomHex(10),
      attestationsRequested: 3,
      walletAddress,
      transactions: {
        approve: {
          destination: walletAddress,
          data: 'approve',
          value: "0",
        },
        request: {
          destination: walletAddress,
          data: 'request',
          value: "0",
        },
      }
    }

    let getAttestationStat: jest.SpyInstance
    let requireNAttestations: jest.SpyInstance
    let getAttestationFee: jest.SpyInstance
    let transfer : jest.SpyInstance
    const currentAttestations = 3

    beforeEach(() => {
      jest.spyOn(contractKit.contracts, 'getAttestations').mockResolvedValue(attestations as any)
      jest.spyOn(contractKit.contracts, 'getStableToken').mockResolvedValue(stableToken as any)
      getAttestationStat = jest.spyOn(
        attestations,
        'getAttestationStat'
      ).mockResolvedValue({
        total: currentAttestations,
        completed: 2
      })

      requireNAttestations = jest.spyOn(
        attestations,
        'requireNAttestationsRequested'
      ).mockImplementation((identifier, account, count): any => {
        return {
          txo: {
            destination: 'attestations',
            data: { identifier, account, count },
            value: "0"
          }
        }
      })

      getAttestationFee = jest.spyOn(
        attestations,
        'getAttestationFeeRequired'
      ).mockImplementation((count) => {
        return Promise.resolve(new BigNumber(100).times(count))
      })

      transfer = jest.spyOn(
        stableToken,
        'transfer'
      ).mockImplementation((to, amount): any => {
        return {
          txo: {
            destination: 'cUSD',
            data: { to, amount },
            value: "0"
          }
        }
      })
    })

    describe('when guards are active', () => {
      let service: SubsidyService

      beforeEach(async () => {
        const module = await buildTestingModule({useAttestationGuards: true})
        service = module.get<SubsidyService>(SubsidyService)
      })

      it('outputs 5 transactions', async () => {
        const batch = await service.buildTransactionBatch(input)
        expect(batch.length).toEqual(5)

        expect(getAttestationStat).toHaveBeenCalled()
        expect(transfer).toHaveBeenCalledWith(input.walletAddress, new BigNumber(100 * input.attestationsRequested).toFixed())
        expect(getAttestationFee).toHaveBeenCalledWith(input.attestationsRequested)
        expect(requireNAttestations).toHaveBeenCalledWith(
          input.identifier,
          input.walletAddress,
          currentAttestations
        )
        expect(requireNAttestations).toHaveBeenCalledWith(
          input.identifier,
          input.walletAddress,
          currentAttestations + input.attestationsRequested
        )
      })
    })

    describe('when guards are not active', () => {
      let service: SubsidyService

      beforeEach(async () => {
        const module = await buildTestingModule({useAttestationGuards: false})
        service = module.get<SubsidyService>(SubsidyService)
      })

      it('outputs 3 transactions', async () => {
        const batch = await service.buildTransactionBatch(input)
        expect(batch.length).toEqual(3)

        expect(getAttestationStat).not.toHaveBeenCalled()
        expect(transfer).toHaveBeenCalledWith(input.walletAddress, new BigNumber(100 * input.attestationsRequested).toFixed())
        expect(getAttestationFee).toHaveBeenCalledWith(input.attestationsRequested)
        expect(requireNAttestations).not.toHaveBeenCalled()
      })
    })
  })
})