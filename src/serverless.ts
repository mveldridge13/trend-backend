import "./instrument"; // Must be first import
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { IncomingMessage, ServerResponse } from "http";
import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";

/**
 * Vercel serverless entry point.
 *
 * Boots Nest once per function instance and reuses it for every request that
 * instance serves (Fluid Compute keeps warm instances around), instead of
 * calling app.listen() like main.ts does.
 *
 * Wired up by api/index.js + vercel.json. Not used by local dev or Docker.
 */
type RequestListener = (req: IncomingMessage, res: ServerResponse) => void;

let serverPromise: Promise<RequestListener> | null = null;

async function createServer(): Promise<RequestListener> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  await app.init();
  // Nest's own Express instance (same version Nest was built against).
  return app.getHttpAdapter().getInstance();
}

export async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (!serverPromise) {
    serverPromise = createServer().catch((err) => {
      // Don't cache a failed boot — let the next request retry.
      serverPromise = null;
      throw err;
    });
  }
  const server = await serverPromise;
  server(req, res);
}
