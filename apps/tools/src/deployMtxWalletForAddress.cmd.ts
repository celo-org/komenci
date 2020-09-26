import { WEB3 } from '@app/blockchain';
import { WalletConfig } from '@app/blockchain/config/wallet.config';
import { INestApplication } from '@nestjs/common';
import MTWContract from '@celo/protocol/build/contracts/MetaTransactionWallet.json'
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import Web3 from 'web3';

export const deployMtxWalletForAddress = async (app: INestApplication) => {
  const web3: Web3 = app.get<Web3>(WEB3)
  const config: ConfigService = app.get(ConfigService)
  const logger: Logger = app.get<Logger>(Logger)
  const walletConfig = config.get<WalletConfig>('wallet')

  try {
    const contract = await new web3.eth.Contract(MTWContract.abi as any)
    const impl = await contract.deploy({
      data: MTWContract.bytecode,
      arguments: []
    }).send({
      from: walletConfig.address
    })
    const resp = await impl.methods.initialize(walletConfig.address).send({
      from: walletConfig.address
    })
    logger.log(`Deployed MetaTransactionWallet deployed to: ${impl.options.address}`)
  } catch (e) {
    logger.log(e)
  }
}
