const path = require('path')
const findWorkspaceRoot = require('find-yarn-workspace-root')
const workspaceRoot = findWorkspaceRoot()

module.exports = {
  moduleFileExtensions: [ "js", "json", "ts" ],
  rootDir: ".",
  preset: "ts-jest",
  testRegex: "[^-]spec.ts$",
  testEnvironment: "node",
  setupFilesAfterEnv: [
    path.join(workspaceRoot, 'jest.setup.ts')
  ],
  coverageDirectory: "./coverage",
  verbose: true,
  collectCoverageFrom: [
    "**/*.{js,jsx}",
    "!**/node_modules/**",
    "!libs/blockchain/migrations/**",
  ]
}
