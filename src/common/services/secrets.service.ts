import { Injectable, OnModuleInit } from "@nestjs/common";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

interface SecretCache {
  value: string;
  expiresAt: number;
}

@Injectable()
export class SecretsService implements OnModuleInit {
  private client: SecretsManagerClient | null = null;
  private cache: Map<string, SecretCache> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private secrets: Record<string, string> = {};

  async onModuleInit() {
    // Only initialize AWS client in production
    if (process.env.NODE_ENV === "production" && process.env.USE_AWS_SECRETS === "true") {
      this.client = new SecretsManagerClient({
        region: process.env.AWS_REGION || "ap-southeast-2",
      });

      // Pre-fetch secrets at startup
      await this.loadSecrets();
    }
  }

  private async loadSecrets(): Promise<void> {
    const secretName = process.env.AWS_SECRET_NAME || "trend-backend/production";

    try {
      console.log(`Loading secrets from AWS Secrets Manager: ${secretName}`);
      const secret = await this.getSecretFromAWS(secretName);

      if (secret) {
        // Parse JSON secret containing multiple key-value pairs
        this.secrets = JSON.parse(secret);
        console.log("Secrets loaded successfully from AWS Secrets Manager");
      }
    } catch (error) {
      console.error("Failed to load secrets from AWS Secrets Manager:", error);
      console.log("Falling back to environment variables");
    }
  }

  private async getSecretFromAWS(secretName: string): Promise<string | null> {
    if (!this.client) {
      return null;
    }

    // Check cache first
    const cached = this.cache.get(secretName);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    try {
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.client.send(command);

      if (response.SecretString) {
        // Cache the result
        this.cache.set(secretName, {
          value: response.SecretString,
          expiresAt: Date.now() + this.CACHE_TTL_MS,
        });
        return response.SecretString;
      }

      return null;
    } catch (error) {
      console.error(`Failed to fetch secret ${secretName}:`, error);
      return null;
    }
  }

  /**
   * Get a secret value. Falls back to environment variable if AWS is not configured
   * or if the secret is not found.
   */
  get(key: string, envFallback?: string): string | undefined {
    // First check AWS secrets (loaded at startup)
    if (this.secrets[key]) {
      return this.secrets[key];
    }

    // Fall back to environment variable
    return process.env[key] || envFallback;
  }

  /**
   * Get a required secret value. Throws if not found.
   */
  getOrThrow(key: string): string {
    const value = this.get(key);
    if (!value) {
      throw new Error(`Required secret '${key}' is not configured`);
    }
    return value;
  }

  /**
   * Check if secrets are being loaded from AWS
   */
  isUsingAWS(): boolean {
    return this.client !== null && Object.keys(this.secrets).length > 0;
  }
}
