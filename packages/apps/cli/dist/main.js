"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nestjs_console_1 = require("nestjs-console");
const tools_module_1 = require("./tools.module");
const bootstrap = new nestjs_console_1.BootstrapConsole({
    module: tools_module_1.ToolsModule,
    useDecorators: true
});
bootstrap.init().then(async (app) => {
    await app.init();
    await bootstrap.boot();
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=main.js.map