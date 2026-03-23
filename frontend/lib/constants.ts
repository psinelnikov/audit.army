// Centralized constants for the Audit Army application

// Audit status constants
export const AUDIT_STATUS = {
  PENDING: 0,
  IN_REVIEW: 1,
  COMPLETED: 2,
  DISPUTED: 3,
  REFUNDED: 4,
} as const;

// Time constants (in milliseconds)
export const TIME_CONSTANTS = {
  REVIEW_PERIOD_DAYS: 7,
  REVIEW_PERIOD_HOURS: 7 * 24,
  REVIEW_PERIOD_MINUTES: 7 * 24 * 60,
  REVIEW_PERIOD_SECONDS: 7 * 24 * 60 * 60,
  REVIEW_PERIOD_MILLISECONDS: 7 * 24 * 60 * 60 * 1000,
  DAY_IN_MILLISECONDS: 24 * 60 * 60 * 1000,
  HOUR_IN_MILLISECONDS: 60 * 60 * 1000,
} as const;

// Transaction wait times (in seconds)
export const TRANSACTION_WAIT_TIMES = {
  DEFAULT: 60,
  FAST: 30,
  SLOW: 120,
} as const;

// API endpoints
export const API_ENDPOINTS = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  DEBUG_REVIEWER_STATUS: (daoAddress: string, reviewerAddress: string) => 
    `/api/audit/debug/reviewer-status/${daoAddress}/${reviewerAddress}`,
} as const;

// UI constants
export const UI_CONSTANTS = {
  ADDRESS_TRUNCATE_LENGTH: 6,
  SPINNER_SIZE: 12,
  MIN_VIEWPORT_HEIGHT_REM: 4,
} as const;