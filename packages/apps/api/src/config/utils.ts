export const numberFromEnv = (
  key: string,
  defaultValue: number
) => {
  const rawValue = process.env[key]
  return rawValue && !isNaN(+rawValue)
    ? +rawValue
    : defaultValue
}