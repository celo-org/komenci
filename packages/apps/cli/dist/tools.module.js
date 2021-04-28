"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var blockchain_module_1 = require("@komenci/blockchain/dist/blockchain.module");
var contracts_module_1 = require("@komenci/blockchain/dist/contracts.module");
var node_config_1 = require("@komenci/blockchain/dist/config/node.config");
var funding_service_1 = require("@komenci/blockchain/dist/funding.service");
var core_1 = require("@komenci/core");
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var deployer_command_1 = require("./deployer.command");
var fund_config_1 = require("./fund.config");
var nestjs_console_1 = require("nestjs-console");
var nestjs_pino_1 = require("nestjs-pino");
var fund_command_1 = require("./fund.command");
var ToolsModule = (function () {
    function ToolsModule() {
    }
    ToolsModule = __decorate([
        common_1.Module({
            imports: [
                nestjs_console_1.ConsoleModule,
                nestjs_pino_1.LoggerModule.forRoot({
                    pinoHttp: {
                        prettyPrint: true
                    }
                }),
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    load: [core_1.networkConfig, fund_config_1.fundConfig],
                    envFilePath: [
                        './.env.local',
                        './.env',
                    ]
                }),
                blockchain_module_1.BlockchainModule.forRootAsync({
                    inject: [config_1.ConfigService],
                    useFactory: function (config) {
                        var networkCfg = config.get('network');
                        var fundCfg = config.get('fund');
                        return {
                            node: {
                                providerType: node_config_1.NodeProviderType.HTTP,
                                url: networkCfg.fornoURL
                            },
                            wallet: fundCfg
                        };
                    }
                }),
                contracts_module_1.ContractsModule.forRootAsync({
                    inject: [config_1.ConfigService],
                    useFactory: function (config) {
                        var networkCfg = config.get('network');
                        return {
                            deployerAddress: networkCfg.contracts.MetaTransactionWalletDeployer,
                        };
                    },
                }),
            ],
            providers: [
                funding_service_1.FundingService,
                fund_command_1.FundCommand,
                deployer_command_1.DeployerCommand,
            ],
        })
    ], ToolsModule);
    return ToolsModule;
}());
exports.ToolsModule = ToolsModule;
