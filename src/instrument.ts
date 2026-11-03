import * as dotenv from "dotenv";
dotenv.config(); // Load .env before anything else

import * as Sentry from "@sentry/nestjs";

// Only initialize Sentry if DSN is set
if (process.env.SENTRY_DSN) {
  // The CPU profiler is a native addon. Load it lazily, and skip it on Vercel
  // (process.env.VERCEL) where serverless bundling may not ship the binary.
  const integrations = [];
  if (!process.env.VERCEL) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { nodeProfilingIntegration } = require("@sentry/profiling-node");
    integrations.push(nodeProfilingIntegration());
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",

    integrations,

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Profiling (only in production to reduce overhead)
    profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,

    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }
      return event;
    },
  });
}
