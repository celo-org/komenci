import { WALLET, WEB3_PROVIDER } from '@app/blockchain/blockchain.providers'
import { networkConfig, NetworkConfig } from '../../../libs/utils/src/config/network.config'
import { INestApplication } from '@nestjs/common'
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices'
import { Test, TestingModule } from '@nestjs/testing'
import Web3 from 'web3'
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit/lib/kit'
import { LocalWallet } from '@celo/contractkit/lib/wallets/local-wallet'
import { BlockchainModule, ContractsModule } from '@app/blockchain'
import * as metaTxWalletDeployer from '../../../libs/celo/packages/protocol/build/contracts/MetaTransactionWalletDeployer.json'
import * as metaTxWallet from '../../../libs/celo/packages/protocol/build/contracts/MetaTransactionWallet.json'
import { AppController, RelayerCmd } from '../src/app.controller'
import { WalletConfig, walletConfig, WalletType } from '@app/blockchain/config/wallet.config'
import { SignPersonalMessageDto } from '../src/dto/SignPersonalMessageDto'
import { KomenciLoggerModule, KomenciLoggerService } from '@app/komenci-logger'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AppConfig, appConfig } from '../src/config/app.config'
import { NodeConfig, nodeConfig } from '@app/blockchain/config/node.config'
import { OdisService } from '../src/odis/odis.service'
import { ACCOUNT_ADDRESS, PRIVATE_KEY } from '../src/config/testing-constants'
import { MetaTransactionWalletWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { TransactionService } from '../src/chain/transaction.service'
import { BalanceService } from '../src/chain/balance.service'
import { BlockchainService } from '@app/blockchain/blockchain.service'
import { AppModule } from '../src/app.module'


describe('relayer', () => {

  let app: INestApplication
  let client: ClientProxy
  let networkCfg: NetworkConfig
  // let contractAddress: string
  let web3
  let kit: any
  let metaTxWalletVersion: { [key: string]: string; } = {};
  metaTxWalletVersion[metaTxWallet.networks[1101].address] = "1.0.0"
  let controller: AppController

  networkCfg = {
    relayers: [ {
      externalAccount: "0xa7d74cb4fca9458757cfc8b90d9b38a126f68b47",
      metaTransactionWallet: ""
    }
    ],
    contracts: {
      MetaTransactionWalletDeployer: metaTxWalletDeployer.networks[1101].address,
      MetaTransactionWalletVersions: metaTxWalletVersion
    },
    fornoURL: "'http://localhost:8545",
    odis: {
      publicKey: "",
      url: ""
    }
  }

  beforeAll(async () => {
    web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
    
    const mockWallet: LocalWallet = new LocalWallet()
    mockWallet.addAccount(PRIVATE_KEY)


    const accounts = await web3.eth.getAccounts()
    networkCfg.relayers[0].metaTransactionWallet= metaTxWallet.networks[1101].address
    // networkCfg.relayers[0].externalAccount= accounts[0]


    kit = new ContractKit(
      new Web3(new Web3.providers.HttpProvider(process.env.NODE_URL)),
      mockWallet
    )
    const appConfigValue: Partial<AppConfig> = {
      maxGasPrice: "3000000000",
      gasPriceMultiplier: 5,
      gasPriceFallback: "1000000000",
    }

    const walletDeployer = new web3.eth.Contract(metaTxWalletDeployer.abi, metaTxWalletDeployer.networks[1101].address)

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        // ConfigModule.forRoot({
        //   isGlobal: true,
        //   load: [appConfig, walletConfig, nodeConfig],
        //   envFilePath: ['apps/relayer/.env.local']
        // }),
        // BlockchainModule.forRootAsync({
        //   inject: [ConfigService],
        //   useFactory: (config: ConfigService) => {
        //     return {
        //       node: config.get<NodeConfig>('node'),
        //       wallet: {
        //         type: WalletType.Local,
        //         address: ACCOUNT_ADDRESS,
        //         privateKey: PRIVATE_KEY
        //       },
        //     }
        //   }
        // }),        
        // ContractsModule,
        ClientsModule.register([
          { name: 'RELAYER_SERVICE', transport: Transport.TCP },
        ]),
        // KomenciLoggerModule.forRoot({
        //   pinoHttp: {
        //     prettyPrint: true
        //   }
        // })
      ],
      // controllers: [AppController],
      // providers: [
      //   OdisService,
      //   ConfigService,
      //   { 
      //     provide: networkConfig.KEY, 
      //     useValue: networkCfg 
      //   },
      //   {
      //     provide: WALLET,
      //     useValue: mockWallet
      //   },
      //   {
      //     provide: ContractKit,
      //     useValue: kit
      //   },
      //   {
      //     provide: MetaTransactionWalletWrapper,
      //     useValue: walletDeployer
      //   },
      //   TransactionService,
      //   BalanceService,
      //   KomenciLoggerService
      // ]
    })
    .overrideProvider(networkConfig.KEY).useValue(networkCfg)
    .overrideProvider(walletConfig).useValue(mockWallet)
    .overrideProvider(appConfig).useValue(appConfigValue)
    .overrideProvider(WEB3_PROVIDER).useValue('http://localhost:8545').compile()


    app = moduleFixture.createNestApplication()
    app.connectMicroservice({
      transport: Transport.TCP,
    })

    await app.startAllMicroservicesAsync()
    await app.init()

    client = app.get('RELAYER_SERVICE')
    controller = moduleFixture.get<AppController>(AppController)

    await client.connect()
  })

  afterAll(async () => {
    await app.close()
    client.close()
  })


  describe('AppController (e2e)', () => {

    it('Sign a personal message', async() => {
      expect(client).toBeDefined()
      expect(app).toBeDefined()


      const s: SignPersonalMessageDto = { data: 'test' }
      console.log(await controller.signPersonalMessage(s))

      // Call method without wrappers
      // const walletDeployer = new web3.eth.Contract(metaTxWalletDeployer.abi, metaTxWalletDeployer.networks[1101].address)
      // const wallet = new web3.eth.Contract(metaTxWallet.abi, metaTxWallet.networks[1101].address)
      // const method = walletDeployer.methods["deploy"]
      // const methodInstance = method(networkCfg.relayers[0].externalAccount,
      //   metaTxWallet.networks[1101].address,
      //   wallet.methods.initialize(networkCfg.relayers[0].externalAccount).encodeABI())

      // const from = networkCfg.relayers[0].externalAccount
      // const gas = await methodInstance.estimateGas(networkCfg.relayers[0].externalAccount,
      //   metaTxWallet.networks[1101].address,
      //   wallet.methods.initialize(networkCfg.relayers[0].externalAccount).encodeABI(), {
      //     from
      // })
      // const tx = await methodInstance.send({
      //     from,
      //     gas
      // })
      // console.log(tx)


    })
  })

})


