import { ContractKit, newKitFromWeb3 } from '@celo/contractkit';
import { AzureHSMWallet } from '@celo/contractkit/lib/wallets/azure-hsm-wallet';
import { ReadOnlyWallet } from '@celo/contractkit/lib/wallets/wallet';
import { ConfigType } from '@nestjs/config';
import net from 'net';
import Web3 from 'web3';
import appConfig from '../config/app.config';

export class ContractKitManager {
  private _nodeUrl: string;
  private _azureVaultName: string;
  private _web3: Web3 | null = null;
  private _kit: ContractKit | null = null;
  private _wallet: ReadOnlyWallet;
  private _initialized = false;

  constructor(config: ConfigType<typeof appConfig>) {
    this._nodeUrl = config.networkConfig.fullNodeUrl;
    this._azureVaultName = config.azureVaultName;
  }

  async init() {
    if (!this._initialized) {
      const akvWallet = new AzureHSMWallet(this._azureVaultName);
      await akvWallet.init();
      this._wallet = akvWallet;
      this._initialized = true;
    }
  }

  get web3(): Web3 {
    if (!this._web3) {
      this._web3 =
        this._nodeUrl && this._nodeUrl.endsWith('.ipc')
          ? new Web3(new Web3.providers.IpcProvider(this._nodeUrl, net))
          : new Web3(this._nodeUrl);
    }
    return this._web3;
  }

  get kit(): ContractKit {
    if (!this._kit) {
      this._kit = newKitFromWeb3(this.web3, this.getWallet());
    }
    return this._kit;
  }

  /**
   * Provide an instance of ReadOnlyWallet
   * Mock with a local-wallet for testing
   */
  getWallet(): ReadOnlyWallet {
    if (!this._initialized) {
      throw new Error('Must initialize the contract kit before use');
    }
    return this._wallet;
  }
}
