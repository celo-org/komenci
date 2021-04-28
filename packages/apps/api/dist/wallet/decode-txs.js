"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var base_1 = require("@celo/base");
var MetaTransactionWallet_1 = require("@celo/contractkit/lib/generated/MetaTransactionWallet");
var errors_1 = require("../wallet/errors");
var InputDataDecoder = require('ethereum-input-data-decoder');
var MetaTxWalletDecoder = new InputDataDecoder(MetaTransactionWallet_1.ABI);
var EXECUTE_TRANSACTIONS_INPUTS = 4;
var EXECUTE_META_TRANSACTION_INPUTS = 6;
exports.decodeExecuteMetaTransaction = function (tx) {
    var result = decode(tx, 'executeMetaTransaction', EXECUTE_META_TRANSACTION_INPUTS);
    if (result.ok === false) {
        return result;
    }
    var inputs = result.result;
    return base_1.Ok({
        destination: inputs[0],
        value: inputs[1].toString(),
        data: inputs[2].toString('hex')
    });
};
exports.decodeExecuteTransactions = function (tx) {
    var result = decode(tx, 'executeTransactions', EXECUTE_TRANSACTIONS_INPUTS);
    if (result.ok === false) {
        return result;
    }
    var inputs = result.result;
    var offset = 0;
    return base_1.Ok(inputs[3].map(function (dataLength, idx) {
        var data;
        if (dataLength === 0) {
            data = "";
        }
        else {
            data = inputs[2].slice(offset, offset + dataLength).toString('hex');
            offset += dataLength;
        }
        return {
            destination: inputs[0][idx],
            value: inputs[1][idx].toString(),
            data: data
        };
    }));
};
var decode = function (tx, method, expectedInputsLength) {
    var decodedData;
    try {
        decodedData = MetaTxWalletDecoder.decodeData(tx.data);
    }
    catch (e) {
        return base_1.Err(new errors_1.TransactionDecodeError(tx, e));
    }
    if (decodedData.method === null) {
        return base_1.Err(new errors_1.TransactionDecodeError(tx, new Error("Could not find method")));
    }
    if (decodedData.method !== method) {
        return base_1.Err(new errors_1.TransactionDecodeError(tx, new Error("Method does not match")));
    }
    if (decodedData.inputs.length !== expectedInputsLength) {
        return base_1.Err(new errors_1.TransactionDecodeError(tx, new Error('Invalid inputs length')));
    }
    return base_1.Ok(decodedData.inputs);
};
