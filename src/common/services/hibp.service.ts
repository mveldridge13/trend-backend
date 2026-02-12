import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";

@Injectable()
export class HibpService {
  private readonly HIBP_API_URL = "https://api.pwnedpasswords.com/range/";

  /**
   * Check if a password has been exposed in a data breach using the k-Anonymity model.
   * Only the first 5 characters of the SHA-1 hash are sent to the API.
   * @returns true if password is compromised, false if safe
   */
  async isPasswordCompromised(password: string): Promise<boolean> {
    try {
      // SHA-1 hash the password
      const sha1Hash = crypto
        .createHash("sha1")
        .update(password)
        .digest("hex")
        .toUpperCase();

      // Split into prefix (first 5 chars) and suffix (rest)
      const prefix = sha1Hash.substring(0, 5);
      const suffix = sha1Hash.substring(5);

      // Query HIBP API with just the prefix (k-Anonymity)
      const response = await fetch(`${this.HIBP_API_URL}${prefix}`, {
        headers: {
          "User-Agent": "TrendBackend-PasswordCheck",
        },
      });

      if (!response.ok) {
        // If API fails, don't block registration - log and allow
        console.error(`HIBP API error: ${response.status}`);
        return false;
      }

      const text = await response.text();

      // Response is a list of hash suffixes and counts, one per line
      // Format: SUFFIX:COUNT
      const lines = text.split("\n");
      for (const line of lines) {
        const [hashSuffix] = line.split(":");
        if (hashSuffix && hashSuffix.trim() === suffix) {
          return true; // Password found in breach database
        }
      }

      return false; // Password not found in any breach
    } catch (error) {
      // If check fails (network error, etc.), don't block the user
      console.error("HIBP check failed:", error);
      return false;
    }
  }

  /**
   * Get the number of times a password has appeared in breaches.
   * @returns number of times seen (0 if not found or on error)
   */
  async getBreachCount(password: string): Promise<number> {
    try {
      const sha1Hash = crypto
        .createHash("sha1")
        .update(password)
        .digest("hex")
        .toUpperCase();

      const prefix = sha1Hash.substring(0, 5);
      const suffix = sha1Hash.substring(5);

      const response = await fetch(`${this.HIBP_API_URL}${prefix}`, {
        headers: {
          "User-Agent": "TrendBackend-PasswordCheck",
        },
      });

      if (!response.ok) {
        return 0;
      }

      const text = await response.text();
      const lines = text.split("\n");

      for (const line of lines) {
        const [hashSuffix, count] = line.split(":");
        if (hashSuffix && hashSuffix.trim() === suffix) {
          return parseInt(count.trim(), 10) || 0;
        }
      }

      return 0;
    } catch (error) {
      console.error("HIBP breach count check failed:", error);
      return 0;
    }
  }
}
