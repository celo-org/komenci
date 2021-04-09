import { throwIfError } from '@celo/base'
import { NetworkConfig, networkConfig } from '@komenci/core'
import {
  Body,
  Controller,
  Inject,
  Post,
  Scope,
  Session,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { DeployWalletDto } from '../dto/DeployWalletDto'
import { Session as SessionEntity } from '../session/session.entity'
import { WalletErrorType } from '../wallet/errors'
import { WalletProxyType, WalletService } from '../wallet/wallet.service'

import { appConfig } from '../config/app.config'

interface DeployWalletInProgress {
  status: 'in-progress'
  txHash: string
  deployerAddress: string
}

interface DeployWalletDeployed {
  status: 'deployed'
  walletAddress: string
}

type DeployWalletResp = DeployWalletInProgress | DeployWalletDeployed

@Controller({
  path: "v2",
  // RelayerProxyService & WalletService are Request scoped
  scope: Scope.REQUEST
})
export class V2AppController {
  constructor(
    private readonly walletService: WalletService,
    @Inject(networkConfig.KEY)
    private readonly networkCfg: NetworkConfig,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('deployWallet')
  async deployWallet(
    @Body() deployWalletDto: DeployWalletDto,
    @Session() session: SessionEntity
  ): Promise<DeployWalletResp> {
    const getResp = await this.walletService.getWallet(
      session,
      deployWalletDto.implementationAddress
    )

    if (getResp.ok === true) {
      return {
        status: 'deployed',
        walletAddress: getResp.result
      }
    }

    if (getResp.error.errorType !== WalletErrorType.NotDeployed) {
      throw getResp.error
    }

    const { 
      txHash,
      deployerAddress 
    } = throwIfError(await this.walletService.deployWallet(
      session,
      deployWalletDto.implementationAddress,
      WalletProxyType.EIP1167
    ))

    return {
      status: 'in-progress',
      txHash,
      deployerAddress
    }
  }
}
