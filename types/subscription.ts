/**
 * Subscription Type Definitions
 * 
 * These types match the database enum constraints for subscription_status and subscription_plan.
 * They are used across the web application to ensure type safety when working with subscription data.
 */

/**
 * Subscription status enum matching database constraint
 * 
 * - free: User has no active subscription (default state)
 * - active: User has an active paid subscription with valid payment
 * - past_due: Subscription exists but payment failed; user may have grace period
 * - canceled: Subscription was canceled and is no longer active
 */
export type SubscriptionStatus = 'free' | 'active' | 'past_due' | 'canceled';

/**
 * Subscription plan enum matching database constraint
 * 
 * - none: No subscription plan (free tier)
 * - monthly: Monthly recurring subscription ($5.99/month)
 * - yearly: Annual subscription ($39.99/year)
 */
export type SubscriptionPlan = 'none' | 'monthly' | 'yearly';

/**
 * User subscription record from database
 */
export interface UserSubscription {
  user_id: string;
  subscription_status: SubscriptionStatus;
  subscription_plan: SubscriptionPlan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  start_date: string | null;
  end_date: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Stripe status to database enum mapping
 * 
 * Maps Stripe subscription statuses to our database enum values.
 * This ensures consistent status representation across the application.
 */
export const STRIPE_STATUS_MAP: Record<string, SubscriptionStatus> = {
  'active': 'active',
  'trialing': 'active',  // Map trialing to active (users in trial have active access)
  'past_due': 'past_due',
  'unpaid': 'past_due',  // Map unpaid to past_due
  'canceled': 'canceled',
  'incomplete': 'free',
  'incomplete_expired': 'free',
  'paused': 'canceled',
} as const;

/**
 * Helper function to map Stripe status to database enum
 * 
 * @param stripeStatus - The status string from Stripe API
 * @returns The corresponding database enum value
 * 
 * @example
 * ```typescript
 * const status = mapStripeStatus('trialing'); // Returns 'active'
 * const status = mapStripeStatus('unknown'); // Returns 'free' (fallback)
 * ```
 */
export function mapStripeStatus(stripeStatus: string): SubscriptionStatus {
  return STRIPE_STATUS_MAP[stripeStatus] || 'free';
}

/**
 * Type guard to check if a value is a valid SubscriptionStatus
 */
export function isSubscriptionStatus(value: unknown): value is SubscriptionStatus {
  return typeof value === 'string' && 
    ['free', 'active', 'past_due', 'canceled'].includes(value);
}

/**
 * Type guard to check if a value is a valid SubscriptionPlan
 */
export function isSubscriptionPlan(value: unknown): value is SubscriptionPlan {
  return typeof value === 'string' && 
    ['none', 'monthly', 'yearly'].includes(value);
}

/**
 * Helper function to check if user has an active subscription
 */
export function hasActiveSubscription(
  status: SubscriptionStatus,
  plan: SubscriptionPlan,
  endDate?: string | null
): boolean {
  const hasPaidPlan = plan === 'monthly' || plan === 'yearly';
  if (status !== 'active' || !hasPaidPlan || !endDate) {
    return false;
  }

  return new Date(endDate) > new Date();
}
