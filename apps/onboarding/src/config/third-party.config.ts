import { registerAs } from '@nestjs/config';

// TODO -- these are examples
export default registerAs('thirdParty', () => ({
  recaptchaToken: process.env.RECAPTCHA_TOKEN,
  appleDeviceCheckToken: process.env.APPLE_DEVICE_CHECK_TOKEN,
  androidSafetyNetToken: process.env.ANDROID_SAFETYNET_TOKEN
}))

