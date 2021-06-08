export enum PromiseStatus {
  Fullfilled = 'fulfilled',
  Rejected = 'rejected',
}

type PromiseResult = {
  status: PromiseStatus.Fullfilled
  value: any
} | {
  status: PromiseStatus.Rejected
  error: any
}

export async function promiseAllSettled(promises: Promise<any>[]): Promise<PromiseResult[]> {
  return Promise.all(
    promises.map(promise => {
      const onFulfill = value => ({ status: PromiseStatus.Fullfilled, value } as PromiseResult)
      const onReject = error => ({ status: PromiseStatus.Rejected, error } as PromiseResult)
      return promise.then(onFulfill, onReject)
    })
  )
}
