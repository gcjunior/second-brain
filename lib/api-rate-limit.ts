import {
  RATE_LIMIT_ADMIN_PER_USER,
  RATE_LIMIT_ASK_PER_USER,
  RATE_LIMIT_AUDIO_PER_USER,
  RATE_LIMIT_AUTH_FAILURE_PER_EMAIL,
  RATE_LIMIT_AUTH_FAILURE_PER_IP,
  RATE_LIMIT_AUTH_FAILURE_WINDOW_MS,
  RATE_LIMIT_BRAIN_PER_USER,
  RATE_LIMIT_MEMORY_PER_USER,
  RATE_LIMIT_WINDOW_MS,
} from "@/lib/constants";
import { getClientIp } from "@/lib/http";
import {
  checkRateLimit,
  normalizeRateLimitEmail,
} from "@/lib/rate-limit";
import type { RateLimitResult } from "@/lib/rate-limit";

export function checkAuthFailureRateLimits(
  request: Request,
  email: string,
): RateLimitResult {
  const ip = getClientIp(request) ?? "unknown";
  const ipKey = `auth-failure:ip:${ip}`;
  const ipResult = checkRateLimit(
    ipKey,
    RATE_LIMIT_AUTH_FAILURE_PER_IP,
    RATE_LIMIT_AUTH_FAILURE_WINDOW_MS,
  );
  if (!ipResult.ok) {
    return ipResult;
  }

  const emailKey = `auth-failure:email:${normalizeRateLimitEmail(email)}`;
  return checkRateLimit(
    emailKey,
    RATE_LIMIT_AUTH_FAILURE_PER_EMAIL,
    RATE_LIMIT_AUTH_FAILURE_WINDOW_MS,
  );
}

export function checkUserRateLimit(
  scope: string,
  userId: string,
  limit: number,
): RateLimitResult {
  return checkRateLimit(`api:${scope}:${userId}`, limit, RATE_LIMIT_WINDOW_MS);
}

export function checkAskRateLimit(userId: string): RateLimitResult {
  return checkUserRateLimit("ask", userId, RATE_LIMIT_ASK_PER_USER);
}

export function checkAudioRateLimit(userId: string): RateLimitResult {
  return checkUserRateLimit("audio", userId, RATE_LIMIT_AUDIO_PER_USER);
}

export function checkMemoryRateLimit(userId: string): RateLimitResult {
  return checkUserRateLimit("memory", userId, RATE_LIMIT_MEMORY_PER_USER);
}

export function checkBrainRateLimit(userId: string): RateLimitResult {
  return checkUserRateLimit("brain", userId, RATE_LIMIT_BRAIN_PER_USER);
}

export function checkAdminRateLimit(userId: string): RateLimitResult {
  return checkUserRateLimit("admin", userId, RATE_LIMIT_ADMIN_PER_USER);
}
