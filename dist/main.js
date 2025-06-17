"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    app.enableCors();
    app.setGlobalPrefix("api/v1");
    await app.listen(3001, "0.0.0.0");
    console.log("🚀 Application is running on: http://0.0.0.0:3001");
    console.log("📱 React Native can connect via: http://192.168.1.9:3001");
}
bootstrap();
//# sourceMappingURL=main.js.map