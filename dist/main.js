"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./instrument");
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const helmet_1 = require("helmet");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && !process.env.FRONTEND_URL) {
        throw new Error('FATAL: FRONTEND_URL environment variable is required in production');
    }
    app.use((0, helmet_1.default)({
        hsts: isProduction
            ? {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            }
            : false,
        contentSecurityPolicy: isProduction
            ? {
                directives: {
                    defaultSrc: ["'none'"],
                    frameAncestors: ["'none'"],
                },
            }
            : false,
        frameguard: { action: 'deny' },
        noSniff: true,
        hidePoweredBy: true,
    }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const corsOrigin = isProduction
        ? process.env.FRONTEND_URL
        : process.env.FRONTEND_URL || 'http://localhost:3000';
    app.enableCors({
        origin: corsOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.setGlobalPrefix("api/v1");
    const port = process.env.PORT || 3000;
    await app.listen(port, "0.0.0.0");
    console.log(`Application running on port ${port} (${isProduction ? 'production' : 'development'})`);
}
bootstrap();
//# sourceMappingURL=main.js.map