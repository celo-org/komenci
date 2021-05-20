import { TransactionResult } from '@celo/connect'
import { Address, ContractKit } from '@celo/contractkit'
import { RelayerAccounts } from '@komenci/core'
import { Inject, Injectable } from '@nestjs/common'
import BigNumber from 'bignumber.js'

export interface Balance {
  celo: BigNumber,
  cUSD: BigNumber,
}

export interface RelayerWithBalance extends RelayerAccounts, Balance {}

export type BalanceSummary = Record<Address, Balance>

export interface RelayerDisbursement {
  celo: TransactionResult
  cUSD: TransactionResult
}

export type DisbursementSummary = Record<Address, RelayerDisbursement>


@Injectable()
export class FundingService {
  constructor(
    @Inject(ContractKit)
    private readonly contractKit: ContractKit,
  ) {}

  public async getRelayerBalances(relayers: RelayerAccounts[]): Promise<BalanceSummary> {
    const cUSD = await this.contractKit.contracts.getStableToken()
    const celo = await this.contractKit.contracts.getGoldToken()

    const balances = await Promise.all(
      relayers.map(async (r) => {
        return Promise.all([
          celo.balanceOf(r.externalAccount),
          cUSD.balanceOf(r.metaTransactionWallet),
        ])
      })
    )

    return balances.reduce((summary, [celoBalance, cUSDBalance], idx) => {
      const relayer = relayers[idx]
      summary[relayer.externalAccount] = {
        celoBalance,
        cUSDBalance,
      }
      return summary
    }, {})
  }

  public async getRelayerBalanceList(relayers: RelayerAccounts[]): Promise<RelayerWithBalance[]> {
    const cUSD = await this.contractKit.contracts.getStableToken()
    const celo = await this.contractKit.contracts.getGoldToken()

    return Promise.all(
      relayers.map(async (r) => {
        return {
          externalAccount: r.externalAccount,
          metaTransactionWallet: r.metaTransactionWallet,
          celo: await celo.balanceOf(r.externalAccount),
          cUSD: await cUSD.balanceOf(r.metaTransactionWallet),
        }
      })
    )
  }

  public async disburseFunds(
    fund: Address,
    relayers: RelayerAccounts[],
    cUSDAmount: number,
    celoAmount: number
  ): Promise<DisbursementSummary> {
    const cUSD = await this.contractKit.contracts.getStableToken()
    const celo = await this.contractKit.contracts.getGoldToken()

    const exp = new BigNumber(10).pow(18)
    const cUSDAmountSubunit = new BigNumber(cUSDAmount).times(exp)
    const celoAmountSubunit = new BigNumber(celoAmount).times(exp)

    if (!await this.fundHasEnoughBalance(
      fund,
      cUSDAmountSubunit,
      celoAmountSubunit,
      relayers.length)
    ) {
      throw(new Error("Fund balance to low to top-up relayers"))
    }

    const relayerTxs = await Promise.all(
      relayers.map(async (relayer, idx) => {
        // @ts-ignore
        const cUSDTx = cUSD.transfer(relayer.metaTransactionWallet, cUSDAmountSubunit.toFixed()).send({
          from: fund,
        })
        // @ts-ignore
        const celoTx = celo.transfer(relayer.externalAccount, celoAmountSubunit.toFixed()).send({
          from: fund,
        })


        return Promise.all([cUSDTx, celoTx])
      })
    )

    return relayers.reduce((summary, relayer, idx) => {
      summary[relayer.externalAccount] = {
        cUSD: relayerTxs[idx][0],
        celo: relayerTxs[idx][1],
      }
      return summary
    }, {})
  }

  public async getFundBalance(fund: Address): Promise<Balance> {
    const cUSD = await this.contractKit.contracts.getStableToken()
    const celo = await this.contractKit.contracts.getGoldToken()

    const [celoBalance, cUSDBalance] = await Promise.all([
      celo.balanceOf(fund),
      cUSD.balanceOf(fund),
    ])
    return {
      celo: celoBalance,
      cUSD: cUSDBalance
    }
  }

  private async fundHasEnoughBalance(
    fund: Address,
    cUSDAmount: BigNumber,
    celoAmount: BigNumber,
    relayerCount: number
  ): Promise<boolean> {
    const balances = await this.getFundBalance(fund)
    const cUSDNeeded = cUSDAmount.times(relayerCount)
    const celoNeeded = celoAmount.times(relayerCount)

    if (balances.celo.isLessThan(celoNeeded)) {
      return false
    }

    if (balances.cUSD.isLessThan(cUSDNeeded)) {
      return false
    }

    return true
  }
}