"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var core_1 = require("@nestjs/core");
var microservices_1 = require("@nestjs/microservices");
var throttler_1 = require("@nestjs/throttler");
var typeorm_1 = require("@nestjs/typeorm");
var blockchain_1 = require("@komenci/blockchain");
var node_config_1 = require("@komenci/blockchain/dist/config/node.config");
var logger_1 = require("@komenci/logger");
var api_error_filter_1 = require("@komenci/logger/dist/filters/api-error.filter");
var core_2 = require("@komenci/core");
var logger_config_factory_1 = require("./logger-config.factory");
var subsidy_service_1 = require("./subsidy/subsidy.service");
var tx_parser_service_1 = require("./wallet/tx-parser.service");
var wallet_service_1 = require("./wallet/wallet.service");
var relayer_proxy_service_1 = require("./relayer/relayer_proxy.service");
var session_service_1 = require("./session/session.service");
var app_controller_1 = require("./app.controller");
var auth_module_1 = require("./auth/auth.module");
var app_config_1 = require("./config/app.config");
var database_config_1 = require("./config/database.config");
var quota_config_1 = require("./config/quota.config");
var relayer_config_1 = require("./config/relayer.config");
var rules_config_1 = require("./config/rules.config");
var third_party_config_1 = require("./config/third-party.config");
var throttle_config_1 = require("./config/throttle.config");
var gateway_module_1 = require("./gateway/gateway.module");
var session_module_1 = require("./session/session.module");
var AppModule = (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        common_1.Module({
            controllers: [app_controller_1.AppController],
            imports: [
                throttler_1.ThrottlerModule.forRootAsync({
                    inject: [config_1.ConfigService],
                    useFactory: function (config) {
                        return config.get('throttle');
                    }
                }),
                auth_module_1.AuthModule,
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    load: [
                        relayer_config_1.relayerConfig, app_config_1.appConfig, third_party_config_1.thirdPartyConfig,
                        database_config_1.databaseConfig, rules_config_1.rulesConfig, core_2.networkConfig,
                        quota_config_1.quotaConfig, throttle_config_1.throttleConfig,
                    ],
                    envFilePath: ['apps/onboarding/.env.local', 'apps/onboarding/.env']
                }),
                logger_1.KomenciLoggerModule.forRootAsync({
                    providers: [config_1.ConfigService],
                    inject: [config_1.ConfigService],
                    useFactory: logger_config_factory_1.loggerConfigFactory
                }),
                gateway_module_1.GatewayModule,
                common_1.HttpModule,
                session_module_1.SessionModule,
                typeorm_1.TypeOrmModule.forRootAsync({
                    inject: [config_1.ConfigService],
                    useFactory: function (config) {
                        return config.get('database');
                    }
                }),
                blockchain_1.BlockchainModule.forRootAsync({
                    inject: [config_1.ConfigService],
                    useFactory: function (config) {
                        var networkCfg = config.get('network');
                        return {
                            node: {
                                providerType: node_config_1.NodeProviderType.HTTP,
                                url: networkCfg.fornoURL
                            }
                        };
                    }
                }),
                blockchain_1.ContractsModule.forRootAsync({
                    inject: [config_1.ConfigService],
                    useFactory: function (config) {
                        var network = config.get('network');
                        return {
                            deployerAddress: network.contracts.MetaTransactionWalletDeployer,
                        };
                    },
                }),
            ],
            providers: [
                subsidy_service_1.SubsidyService,
                wallet_service_1.WalletService,
                tx_parser_service_1.TxParserService,
                session_service_1.SessionService,
                relayer_proxy_service_1.RelayerProxyService,
                {
                    scope: common_1.Scope.REQUEST,
                    provide: 'RELAYER_SERVICE',
                    inject: [config_1.ConfigService, logger_1.KomenciLoggerService],
                    useFactory: function (configService, logger) {
                        var relayerSvcOptions = configService.get('relayer');
                        return microservices_1.ClientProxyFactory.create(relayerSvcOptions);
                    }
                },
                {
                    provide: core_1.APP_FILTER,
                    useClass: api_error_filter_1.ApiErrorFilter
                }
            ]
        })
    ], AppModule);
    return AppModule;
}());
exports.AppModule = AppModule;
