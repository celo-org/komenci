"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@komenci/core");
const common_1 = require("@nestjs/common");
const fund_config_1 = require("./fund.config");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const nestjs_console_1 = require("nestjs-console");
let FundCommand = class FundCommand {
    constructor(networkCfg, fundCfg, fundingSvc, logger) {
        this.networkCfg = networkCfg;
        this.fundCfg = fundCfg;
        this.fundingSvc = fundingSvc;
        this.logger = logger;
    }
    disburse(cmd) {
        return __awaiter(this, void 0, void 0, function* () {
            const opts = cmd.opts();
            const spin = nestjs_console_1.createSpinner();
            const fund = this.fundCfg.address;
            spin.start(`Disbursing funds`);
            let relayers = [];
            if (opts.relayer.length > 0) {
                opts.relayer.forEach(r => {
                    const relayer = this.networkCfg.relayers.find(pr => pr.externalAccount === r);
                    if (relayer) {
                        relayers.push(relayer);
                    }
                    else {
                        spin.warn(`Skipping ${r}: relayer not found in config`);
                    }
                });
            }
            else {
                relayers = this.networkCfg.relayers;
            }
            if (relayers.length === 0) {
                spin.fail("No relayers to fund");
                process.exit(1);
            }
            spin.info(`Funding relayers: `);
            relayers.forEach(r => {
                spin.info(`   - ${r.externalAccount}`);
            });
            let summary;
            try {
                summary = yield this.fundingSvc.disburseFunds(fund, relayers, opts.cusdAmount, opts.celoAmount);
            }
            catch (e) {
                spin.fail(e.message);
                process.exit(1);
            }
            spin.succeed('Funding transactions submitted');
            spin.start(`Funding relayers`);
            const receipts = [];
            const results = yield Promise.all(Object.keys(summary).map((relayer) => __awaiter(this, void 0, void 0, function* () {
                const celoTxHash = yield summary[relayer].celo.getHash();
                spin.info(`-celo-> Relayer#${relayer}`);
                spin.info(`        ${celoTxHash}`);
                const cUSDTxHash = yield summary[relayer].cUSD.getHash();
                spin.info(`-cUSD-> Relayer#${relayer}`);
                spin.info(`        ${cUSDTxHash}`);
                return Promise.all([
                    summary[relayer].celo.waitReceipt(),
                    summary[relayer].cUSD.waitReceipt()
                ]);
            })));
            let failedTxs = 0;
            results.forEach((relayerReceipts) => {
                relayerReceipts.forEach((receipt) => {
                    if (receipt.status === true) {
                        spin.succeed(`Tx:${receipt.transactionHash} [OK]`);
                    }
                    else {
                        spin.warn(`Tx:${receipt.transactionHash} [REVERT]`);
                        failedTxs += 1;
                    }
                });
            });
            if (failedTxs > 0) {
                spin.fail(`${failedTxs}/${results.length * 2} failed txs. Check summary`);
            }
            else {
                spin.succeed('All transfers completed successfully!');
            }
        });
    }
    getFundBalance(cmd) {
        return __awaiter(this, void 0, void 0, function* () {
            const spin = nestjs_console_1.createSpinner();
            const wallet = this.fundCfg.address;
            this.logger.log({ fund: wallet });
            spin.start('Getting fund balances');
            const balances = yield this.fundingSvc.getFundBalance(wallet);
            spin.succeed('Done loading balances');
            const exp = new bignumber_js_1.default(10).pow(18);
            this.logger.log({
                [wallet]: {
                    "celo": balances.celo.div(exp).toFixed(),
                    "cUSD": balances.cUSD.div(exp).toFixed()
                }
            });
        });
    }
    getBalance(cmd) {
        return __awaiter(this, void 0, void 0, function* () {
            const flags = cmd.opts();
            this.logger.log(this.networkCfg.relayers);
            const spin = nestjs_console_1.createSpinner();
            spin.start('Collecting relayer balances');
            const balanceSummary = yield this.fundingSvc.getRelayerBalances(this.networkCfg.relayers);
            spin.start('Done loading balances');
            const exp = new bignumber_js_1.default(10).pow(18);
            const resp = this.networkCfg.relayers.reduce((acc, r, idx) => {
                acc[r.externalAccount] = {
                    "celo": balanceSummary[r.externalAccount].celoBalance.div(exp).toFixed(),
                    [r.metaTransactionWallet]: {
                        "cUSD": balanceSummary[r.externalAccount].cUSDBalance.div(exp).toFixed()
                    }
                };
                return acc;
            }, {});
            this.logger.log(resp);
        });
    }
};
__decorate([
    nestjs_console_1.Command({
        command: 'disburse',
        description: 'Disburse funds to the relayers and their meta-tx wallets',
        options: [
            {
                flags: '-co, --celo-amount <celoValue>',
                required: false,
                defaultValue: 1,
                fn: (v) => parseFloat(v),
                description: 'The amount of Celo to transfer to each relayer'
            },
            {
                flags: '-cu, --cusd-amount <cUSDValue>',
                required: false,
                defaultValue: 2,
                fn: (v) => parseFloat(v),
                description: 'The amount of cUSD to transfer to each relayer meta-tx wallet'
            },
            {
                flags: '-r, --relayer <relayer>',
                required: false,
                defaultValue: [],
                fn: (r, list) => list.concat([r]),
                description: 'Which relayer to fund (repetable), if non provided will fund all'
            }
        ]
    })
], FundCommand.prototype, "disburse", null);
__decorate([
    nestjs_console_1.Command({
        command: 'getFundBalance',
        description: 'Check fund balance',
    })
], FundCommand.prototype, "getFundBalance", null);
__decorate([
    nestjs_console_1.Command({
        command: 'getRelayerBalance',
        description: 'Check relayer balances',
    })
], FundCommand.prototype, "getBalance", null);
FundCommand = __decorate([
    nestjs_console_1.Console({
        name: 'fund',
        description: 'Manage the fund and relayers',
    }),
    __param(0, common_1.Inject(core_1.networkConfig.KEY)),
    __param(1, common_1.Inject(fund_config_1.fundConfig.KEY))
], FundCommand);
exports.FundCommand = FundCommand;
