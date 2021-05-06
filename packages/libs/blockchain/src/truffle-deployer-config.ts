// This file loads the decrypted mnemonics from .env.mnemonic.deployer
// These accounts linked to them are used for contract deployment on
// all environments but are also used as Fund sources for all
// environments APART FROM MAINNET (RC1)
//
// This file is used in:
// - truffle-config.js - for contract deployment
// - apps/tools/src/fund.config.ts - for relayer funding
import * as dotenv from 'dotenv'
const findWorkspaceRoot = require('find-yarn-workspace-root')
import { join } from 'path'

const workspaceRoot = findWorkspaceRoot()

const deployerMnemonicConfig = dotenv.config({
  path: join(workspaceRoot, '.env.mnemonic.deployer')
})

const getDeployerMnemonic = (env: string) => {
  if (deployerMnemonicConfig.error) {
    console.warn("Could not parse .env.mnemonic.deployer did you run `yarn secrets:decrypt`")
    return ""
  }

  return deployerMnemonicConfig.parsed["FUND_"+env+"_MNEMONIC"] || ""
}

export default {
  alfajores: getDeployerMnemonic('ALFAJORES'),
  alfajoresstaging: getDeployerMnemonic('ALFAJORES_STAGING'),
  baklava: getDeployerMnemonic('BAKLAVA'),
  baklavastaging: getDeployerMnemonic('BAKLAVA_STAGING'),
  rc1: getDeployerMnemonic('RC1'),
}
