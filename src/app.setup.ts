import { INestApplication, ValidationPipe } from "@nestjs/common";
import helmet from "helmet";

/**
 * Shared app configuration (security headers, validation, CORS, prefix).
 * Used by both the long-running server (main.ts — local dev / Docker) and
 * the Vercel serverless entry (serverless.ts) so they can't drift apart.
 */
export function configureApp(app: INestApplication): void {
  const isProduction = process.env.NODE_ENV === 'production';

  // Validate required env vars in production
  if (isProduction && !process.env.FRONTEND_URL) {
    throw new Error('FATAL: FRONTEND_URL environment variable is required in production');
  }

  // Security headers with enhanced configuration
  app.use(
    helmet({
      // Strict-Transport-Security: force HTTPS for 1 year, include subdomains
      hsts: isProduction
        ? {
            maxAge: 31536000, // 1 year in seconds
            includeSubDomains: true,
            preload: true,
          }
        : false, // Disable in development (no HTTPS)
      // Content-Security-Policy: restrictive policy for API
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'none'"],
              frameAncestors: ["'none'"],
            },
          }
        : false, // Disable in development for easier debugging
      // Prevent clickjacking
      frameguard: { action: 'deny' },
      // Prevent MIME type sniffing
      noSniff: true,
      // Hide X-Powered-By header
      hidePoweredBy: true,
    })
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true, // Reject requests with unknown properties
    }),
  );

  // CORS configuration - strict in production
  const corsOrigin = isProduction
    ? process.env.FRONTEND_URL!
    : process.env.FRONTEND_URL || 'http://localhost:3000';

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix("api/v1");
}
