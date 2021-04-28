"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolsModule = void 0;
const blockchain_1 = require("@app/blockchain");
const node_config_1 = require("@app/blockchain/config/node.config");
const funding_service_1 = require("@app/blockchain/funding.service");
const network_config_1 = require("@app/utils/config/network.config");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const deployer_command_1 = require("apps/tools/src/deployer.command");
const fund_config_1 = require("apps/tools/src/fund.config");
const nestjs_console_1 = require("nestjs-console");
const nestjs_pino_1 = require("nestjs-pino");
const fund_command_1 = require("./fund.command");
let ToolsModule = class ToolsModule {
};
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
                load: [network_config_1.networkConfig, fund_config_1.fundConfig],
                envFilePath: [
                    'apps/tools/.env.local',
                    'apps/tools/.env',
                ]
            }),
            blockchain_1.BlockchainModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const networkCfg = config.get('network');
                    const fundCfg = config.get('fund');
                    return {
                        node: {
                            providerType: node_config_1.NodeProviderType.HTTP,
                            url: networkCfg.fornoURL
                        },
                        wallet: fundCfg
                    };
                }
            }),
            blockchain_1.ContractsModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const networkCfg = config.get('network');
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
exports.ToolsModule = ToolsModule;
//# sourceMappingURL=tools.module.js.map