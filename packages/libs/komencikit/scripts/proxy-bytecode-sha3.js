const Proxy = require('@komenci/contracts/artefacts/Proxy.json')
const InitializableProxy = require('@komenci/contracts/artefacts/InitializableProxy.json')
const Web3 = require('web3')

console.log('Constructing stripped bytecode SHA3 for the Proxy contract')
const proxyBytecode = Proxy.deployedBytecode.split('a265627a7a72315820')[0]
console.log('Bytecode hash:', Web3.utils.soliditySha3(proxyBytecode))

console.log('Constructing stripped bytecode SHA3 for the Initializable contract')
const initProxyBytecode = InitializableProxy.deployedBytecode.split('a265627a7a72315820')[0]
console.log('Bytecode hash:', Web3.utils.soliditySha3(initProxyBytecode))
