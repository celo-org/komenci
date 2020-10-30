import { BootstrapConsole } from 'nestjs-console'
import { ToolsModule } from './tools.module'

const bootstrap = new BootstrapConsole({
  module: ToolsModule,
  useDecorators: true
})

bootstrap.init().then(async (app) => {
  await app.init()
  // boot the cli
  await bootstrap.boot()
  process.exit(0)
}).catch(e => {
  console.error(e)
  process.exit(1)
})