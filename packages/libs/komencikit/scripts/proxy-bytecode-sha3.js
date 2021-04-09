const Proxy = require('@celo/protocol/build/contracts/Proxy.json')
const ProxyV2 = require('@celo/protocol/build/contracts/ProxyV2.json')
const Web3 = require('web3')

console.log('Constructing stripped bytecode SHA3 for the Proxy contract')
const proxyBytecode = Proxy.deployedBytecode.split('a265627a7a72315820')[0]
console.log('Bytecode hash:', Web3.utils.soliditySha3(proxyBytecode))

console.log('Constructing stripped bytecode SHA3 for the ProxyV2 contract')
const proxyV2Bytecode = ProxyV2.deployedBytecode.split('a265627a7a72315820')[0]
console.log('Bytecode hash:', Web3.utils.soliditySha3(proxyV2Bytecode))
