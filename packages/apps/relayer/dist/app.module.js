"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var blockchain_1 = require("@komenci/blockchain");
var node_config_1 = require("@komenci/blockchain/dist/config/node.config");
var wallet_config_1 = require("@komenci/blockchain/dist/config/wallet.config");
var logger_1 = require("@komenci/logger");
var rpc_error_filter_1 = require("@komenci/logger/dist/filters/rpc-error.filter");
var core_1 = require("@komenci/core");
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var balance_service_1 = require("./chain/balance.service");
var logger_config_factory_1 = require("./logger-config.factory");
var odis_service_1 = require("./odis/odis.service");
var app_controller_1 = require("./app.controller");
var transaction_service_1 = require("./chain/transaction.service");
var app_config_1 = require("./config/app.config");
var MetaTransactionWallet_contract_1 = require("./contracts/MetaTransactionWallet.contract");
var AppModule = (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        common_1.Module({
            imports: [
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    load: [app_config_1.appConfig, core_1.networkConfig, wallet_config_1.walletConfig],
                    envFilePath: [
                        'apps/relayer/.env.local',
                        'apps/relayer/.env',
                    ]
                }),
                blockchain_1.BlockchainModule.forRootAsync({
                    inject: [config_1.ConfigService],
                    useFactory: function (config) {
                        var networkCfg = config.get('network');
                        return {
                            node: {
                                providerType: node_config_1.NodeProviderType.HTTP,
                                url: networkCfg.fornoURL
                            },
                            wallet: config.get('wallet'),
                        };
                    }
                }),
                blockchain_1.ContractsModule.forRootAsync({
                    inject: [config_1.ConfigService],
                    useFactory: function (config) {
                        var wallet = config.get('wallet');
                        var network = config.get('network');
                        return {
                            deployerAddress: network.contracts.MetaTransactionWalletDeployer,
                            walletAddress: wallet.address
                        };
                    }
                }),
                logger_1.KomenciLoggerModule.forRootAsync({
                    providers: [config_1.ConfigService],
                    inject: [config_1.ConfigService],
                    useFactory: logger_config_factory_1.loggerConfigFactory
                }),
                common_1.HttpModule
            ],
            controllers: [app_controller_1.AppController],
            providers: [
                rpc_error_filter_1.RpcErrorFilter,
                odis_service_1.OdisService,
                transaction_service_1.TransactionService,
                balance_service_1.BalanceService,
                MetaTransactionWallet_contract_1.metaTransactionWalletProvider,
            ]
        })
    ], AppModule);
    return AppModule;
}());
exports.AppModule = AppModule;
