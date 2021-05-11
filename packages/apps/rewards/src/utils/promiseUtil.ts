export async function promiseAllSettled(promises: Promise<any>[]) {
  return Promise.all(
    promises.map(promise => {
      const onFulfill = value => ({ status: 'fulfilled', value: value })
      const onReject = error => ({ status: 'rejected', error: error })
      return promise.then(onFulfill, onReject)
    })
  )
}
