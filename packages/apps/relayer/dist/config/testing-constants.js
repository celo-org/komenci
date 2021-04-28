"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bls_blinding_client_1 = require("@celo/identity/lib/odis/bls-blinding-client");
var phone_number_identifier_1 = require("@celo/identity/lib/odis/phone-number-identifier");
var address_1 = require("@celo/utils/lib/address");
var thresholdBls = require('blind-threshold-bls');
exports.ODIS_URL = 'https://us-central1-celo-phone-number-privacy-stg.cloudfunctions.net';
exports.PRIVATE_KEY = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
exports.ACCOUNT_ADDRESS = address_1.normalizeAddressWith0x(address_1.privateKeyToAddress(exports.PRIVATE_KEY));
exports.PRIVATE_KEY_NO_QUOTA = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890000000';
exports.ACCOUNT_ADDRESS_NO_QUOTA = address_1.privateKeyToAddress(exports.PRIVATE_KEY_NO_QUOTA);
exports.PHONE_NUMBER = '+14155550000';
exports.BLINDING_FACTOR = new Buffer('0IsBvRfkBrkKCIW6HV0/T1zrzjQSe8wRyU3PKojCnww=', 'base64');
var odisPubKey = '7FsWGsFnmVvRfMDpzz95Np76wf/1sPaK0Og9yiB+P8QbjiC8FV67NBans9hzZEkBaQMhiapzgMR6CkZIZPvgwQboAxl65JWRZecGe5V3XO4sdKeNemdAZ2TzQuWkuZoA';
var blsBlindingClient = new bls_blinding_client_1.WasmBlsBlindingClient(odisPubKey);
function getTestBlindedPhoneNumber() {
    return phone_number_identifier_1.getBlindedPhoneNumber(exports.PHONE_NUMBER, blsBlindingClient);
}
exports.getTestBlindedPhoneNumber = getTestBlindedPhoneNumber;
exports.MOCK_ODIS_RESPONSE = '0Uj+qoAu7ASMVvm6hvcUGx2eO/cmNdyEgGn0mSoZH8/dujrC1++SZ1N6IP6v2I8A';
