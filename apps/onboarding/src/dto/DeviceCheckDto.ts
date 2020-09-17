export interface DeviceCheckDto{
    // https://developer.apple.com/documentation/devicecheck/accessing_and_modifying_per-device_data#2910408
    // Not clear which response we are going to obtain from the server
    isValidSignature: boolean
}