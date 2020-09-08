export interface ReCAPTCHAResponseDto {
	success: boolean
	'challenge_ts': string
	hostname: string
	'apk_package_name': string
	'error-codes': string[]
}