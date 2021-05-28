import { Gauge } from 'prom-client'

export class ApiMetrics {
  private totalDifferentAccounts: Gauge<string>
  private totalGasCostUserOnboarding: Gauge<string>

  constructor() {

    this.totalGasCostUserOnboarding = new Gauge({
      name: 'total_gas_cost_user_onboarding',
      help:'Measure of the gas cost of the last onboarding.',
    })

  }

  setTotalDifferentAccounts() {
    this.totalGasCostUserOnboarding.inc()
  }

  setTotalGasCostUserOnboarding(gas: number) {
    this.totalGasCostUserOnboarding.set(gas)
  }

}
export const metrics = new ApiMetrics()
