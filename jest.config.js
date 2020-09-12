module.exports = {
  preset: 'ts-jest',
  testMatch: ['<rootDir>/**/?(*.|*-)+(spec|test).ts?(x)'],
  setupFilesAfterEnv: [
    '<rootDir>/jest_setup.ts',
  ],
  verbose: true,
}
