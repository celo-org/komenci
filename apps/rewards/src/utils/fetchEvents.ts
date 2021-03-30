import { EventLog } from 'web3-core'

const EVENTS_BATCH_SIZE = 100000

export async function fetchEvents(
  contract: any,
  event: string,
  fromBlock: number,
  toBlock: number
) {
  const allEvents: EventLog[] = []
  let currentFromBlock = fromBlock
  while (currentFromBlock < toBlock) {
    const events = await contract.getPastEvents(event, {
      fromBlock: currentFromBlock,
      toBlock: currentFromBlock + EVENTS_BATCH_SIZE
    })
    allEvents.push(...events)
    currentFromBlock += EVENTS_BATCH_SIZE + 1
  }
  return allEvents
}
