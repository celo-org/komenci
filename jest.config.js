module.exports = {
  preset: 'ts-jest',
  testRegex: "[^-]spec.ts$",
  setupFilesAfterEnv: [
    '<rootDir>/jest_setup.ts',
  ],
  verbose: true,
  roots: [
    "<rootDir>/apps/",
    "<rootDir>/libs/"
  ],
  moduleNameMapper: {
    "apps/(.*)": "<rootDir>/apps/$1",
    "@app/blockchain/(.*)": "<rootDir>/libs/blockchain/src/$1",
    "@app/blockchain": "<rootDir>/libs/blockchain/src"
  }
}
