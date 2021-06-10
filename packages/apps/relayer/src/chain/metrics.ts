import { Gauge } from 'prom-client'
import { getGas } from './transaction.service'

export class ApiMetrics {
  private totalGasCostUserOnboarding: Gauge<string>

  constructor() {

    this.totalGasCostUserOnboarding = new Gauge({
      name: 'total_gas_cost_user_onboarding',
      help:'Measure of the gas cost of the last onboarding.',
      async collect() {
        // Invoked when the registry collects its metrics' values.
        const currentValue = await getGas()
        this.set(currentValue)
      },
    })

  }

}
export const metrics = new ApiMetrics()
