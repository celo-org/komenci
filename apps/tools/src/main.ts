import { BootstrapConsole } from 'nestjs-console'
import { ToolsModule } from './tools.module'

const bootstrap = new BootstrapConsole({
  module: ToolsModule,
  useDecorators: true
})

bootstrap.init().then(async (app) => {
  try {
    // init your app
    await app.init()
    // boot the cli
    await bootstrap.boot()
    process.exit(0)
  } catch (e) {
    process.exit(1)
  }
})