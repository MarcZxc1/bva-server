/**
 * Login Attempt Tracking Service
 * 
 * Tracks failed login attempts per email address to prevent brute force attacks.
 * Uses Redis to store attempt counts and lockout timestamps.
 * 
 * Rules:
 * - Maximum 5 failed attempts allowed
 * - Account locked for 5 minutes after 5 failed attempts
 * - Successful login resets attempt count
 * - Lockout automatically expires after 5 minutes
 */

import { CacheService } from "../lib/redis";

interface LoginAttemptData {
  attempts: number;
  lockedUntil: number | null; // Unix timestamp in milliseconds
}

export class LoginAttemptService {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes in milliseconds
  private static readonly ATTEMPT_KEY_PREFIX = "login_attempts:";
  private static readonly LOCKOUT_KEY_PREFIX = "login_lockout:";

  /**
   * Get login attempt data for an email
   */
  private static getKey(email: string): string {
    return `${this.ATTEMPT_KEY_PREFIX}${email.toLowerCase()}`;
  }

  private static getLockoutKey(email: string): string {
    return `${this.LOCKOUT_KEY_PREFIX}${email.toLowerCase()}`;
  }

  /**
   * Check if account is currently locked
   * @returns true if locked, false if not locked, null if error
   */
  static async isLocked(email: string): Promise<{ locked: boolean; remainingSeconds?: number }> {
    try {
      const lockoutKey = this.getLockoutKey(email);
      const lockedUntil = await CacheService.get<number>(lockoutKey);

      if (!lockedUntil) {
        return { locked: false };
      }

      const now = Date.now();
      if (now < lockedUntil) {
        const remainingSeconds = Math.ceil((lockedUntil - now) / 1000);
        return { locked: true, remainingSeconds };
      }

      // Lockout expired, clean up
      await this.clearAttempts(email);
      return { locked: false };
    } catch (error) {
      console.error("Error checking lockout status:", error);
      // On error, don't block login (fail open)
      return { locked: false };
    }
  }

  /**
   * Record a failed login attempt
   */
  static async recordFailedAttempt(email: string): Promise<{ attempts: number; locked: boolean; remainingSeconds?: number }> {
    try {
      const key = this.getKey(email);
      const lockoutKey = this.getLockoutKey(email);

      // Get current attempts
      const currentData = await CacheService.get<LoginAttemptData>(key);
      const currentAttempts = currentData?.attempts || 0;
      const newAttempts = currentAttempts + 1;

      // Check if we've reached max attempts
      if (newAttempts >= this.MAX_ATTEMPTS) {
        // Lock the account
        const lockedUntil = Date.now() + this.LOCKOUT_DURATION_MS;
        await CacheService.set(lockoutKey, lockedUntil, Math.ceil(this.LOCKOUT_DURATION_MS / 1000));
        
        // Store attempt count (will be cleared after lockout expires)
        await CacheService.set(key, { attempts: newAttempts, lockedUntil }, Math.ceil(this.LOCKOUT_DURATION_MS / 1000));

        const remainingSeconds = Math.ceil(this.LOCKOUT_DURATION_MS / 1000);
        return { attempts: newAttempts, locked: true, remainingSeconds };
      }

      // Store updated attempt count (expires after lockout duration to auto-cleanup)
      await CacheService.set(key, { attempts: newAttempts, lockedUntil: null }, Math.ceil(this.LOCKOUT_DURATION_MS / 1000));

      return { attempts: newAttempts, locked: false };
    } catch (error) {
      console.error("Error recording failed attempt:", error);
      // On error, return safe defaults
      return { attempts: 0, locked: false };
    }
  }

  /**
   * Clear login attempts (called on successful login)
   */
  static async clearAttempts(email: string): Promise<void> {
    try {
      const key = this.getKey(email);
      const lockoutKey = this.getLockoutKey(email);
      
      await Promise.all([
        CacheService.del(key),
        CacheService.del(lockoutKey),
      ]);
    } catch (error) {
      console.error("Error clearing login attempts:", error);
      // Don't throw - this is cleanup
    }
  }

  /**
   * Get remaining attempts before lockout
   */
  static async getRemainingAttempts(email: string): Promise<number> {
    try {
      const key = this.getKey(email);
      const data = await CacheService.get<LoginAttemptData>(key);
      const attempts = data?.attempts || 0;
      return Math.max(0, this.MAX_ATTEMPTS - attempts);
    } catch (error) {
      console.error("Error getting remaining attempts:", error);
      return this.MAX_ATTEMPTS; // Return max on error
    }
  }
}

