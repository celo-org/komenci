const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig');

module.exports = {
  moduleFileExtensions: [ "js", "json", "ts" ],
  rootDir: ".",
  preset: "ts-jest",
  testRegex: "[^-]spec.ts$",
  testEnvironment: "node",
  setupFilesAfterEnv: [
    './jest.setup.ts',
  ],
  coverageDirectory: "./coverage",
  verbose: true,
  roots: [
    "<rootDir>/apps/",
    "<rootDir>/libs/blockchain",
  ],
  collectCoverageFrom: [
    "**/*.{js,jsx}",
    "!**/node_modules/**",
    "!libs/celo/**",
    "!libs/blockchain/migrations/**",
  ],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(
      compilerOptions.paths,
      {
        prefix: "<rootDir>/"
      }
    ),
    "apps/onboarding/(.*)": "<rootDir>/apps/onboarding/$1",
    "apps/relayer/(.*)": "<rootDir>/apps/relayer/$1",
  }
}
