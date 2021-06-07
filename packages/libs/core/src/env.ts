export const listFromEnv = (key: string, defaultValue: string[] = []): string[] => {
  const value = process.env[key] 
  return value?.split(',') ?? defaultValue
}

export const floatListFromEnv = (key: string, defaultValue: number[] = []): number[] => {
  const values = listFromEnv(key)
  if (values.length === 0) {
    return defaultValue
  } else {
    return values.map((val, index) => {
      const intVal = parseFloat(val)
      if (isNaN(intVal)) {
        throw new Error(`Error parsing float value from ${key} at index ${index} with value ${val}`)
      }
      return intVal
    })
  }
}

export const intListFromEnv = (key: string, defaultValue: number[] = []): number[] => {
  const values = listFromEnv(key)
  if (values.length === 0) {
    return defaultValue
  } else {
    return values.map((val, index) => {
      const intVal = parseInt(val, 10)
      if (isNaN(intVal)) {
        throw new Error(`Error parsing int value from ${key} at index ${index} with value ${val}`)
      }
      return intVal
    })
  }
}

export const intFromEnv = (key: string, defaultValue: number = 0): number => {
  const value = parseInt(process.env[key], 10)
  return isNaN(value) ? defaultValue: value
}

export const floatFromEnv = (key: string, defaultValue: number = 0): number => {
  const value = parseFloat(process.env[key])
  return isNaN(value) ? defaultValue: value
}

type ObjectDefinition<T extends Record<string, any>, K extends keyof T> = Record<K, (index: number) => T[K]>

export const objectArrayFromEnv = <T extends Record<string, any>>(
  def: ObjectDefinition<T, keyof T>, 
  hasIndex: (index: number) => boolean
): T[] => {
  const objects: T[] = []
  for (let i = 0; hasIndex(i); i++) {
    objects.push(
      Object.keys(def).reduce((acc, key: keyof T) => {
        acc[key] = def[key](i)
        return acc
      }, {} as T)
    )
  }
  return objects
}

export const envVarWithIndex= (key: string, index: number) => `${key}__${index}`