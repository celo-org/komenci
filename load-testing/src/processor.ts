import { query } from 'express';
import fs = require('fs')
import path = require('path')
import { loadInputData } from './utils'

let args = {};

function loadTestCases(context, events, done) {
  const environment = context.vars.$environment

  if (!args[environment]) {
    console.log(`Loading test cases for environment: ${environment}`)

    const __rootpath = path.join(__dirname, '/../')
    const __inputpath = path.join(__rootpath, '/input/', environment)

    // Configuration of ADDRESS test case
    const inputAddresses = loadInputData(path.join(__inputpath, 'addresses.csv'))
    const celoAccounts = loadInputData(path.join(__inputpath, 'celo_accounts.csv'))
    const celoValidators = loadInputData(path.join(__inputpath, 'celo_validators.csv'))


    args[environment] = inputAddresses

  }
  return args[environment]
}

module.exports = { loadTestCases }