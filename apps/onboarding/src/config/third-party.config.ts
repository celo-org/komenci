import { registerAs } from '@nestjs/config'

// TODO -- these are examples
export default registerAs('thirdParty', () => ({
  recaptchaUri: "https://www.google.com/recaptcha/api/siteverify",
  recaptchaToken: process.env.RECAPTCHA_TOKEN,
  appleDeviceCheckUrl: "https://api.development.devicecheck.apple.com", //In production`https://api.devicecheck.apple.com`
  appleDeviceCheckToken: process.env.APPLE_DEVICE_CHECK_TOKEN,
  appleDeviceCheckTeamID: process.env.TEAM_ID,
  appleDeviceCheckKeyID: process.env.APPLE_DEVICE_KEY_ID,
  appleDeviceCheckKeyFilename: process.env.APPLE_DEVICE_KEY_FILENAME,
  androidSafetyNetUrl: "https://www.googleapis.com/androidcheck/v1/attestations/verify",
  androidSafetyNetToken: process.env.ANDROID_SAFETYNET_TOKEN //API_KEY
}))

