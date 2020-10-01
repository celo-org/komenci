const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  "testRegex": ".e2e-spec.ts$",
}
