/**
 * Stripe Billing Portal Configuration
 * Configures the customer self-serve portal for subscription management
 */
import Stripe from 'stripe';
import { stripe } from '../stripe';

const STRIPE_PORTAL_CONFIG_NAME = 'yt-imzodev-default';

export interface PortalConfig {
  id: string;
  url: string;
}

/**
 * Create or retrieve the Stripe Billing Portal configuration
 * This enables customers to upgrade/downgrade plans with proration
 */
export async function getOrCreatePortalConfiguration(): Promise<string> {
  // Try to find existing configuration
  const configurations = await stripe.billingPortal.configurations.list({
    active: true,
  });

  // Look for our named configuration
  const existingConfig = configurations.data.find(
    (config) => config.metadata?.name === STRIPE_PORTAL_CONFIG_NAME
  );

  if (existingConfig) {
    return existingConfig.id;
  }

  // Create new configuration with subscription update capabilities
  const configuration = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: 'Manage your subscription',
      privacy_policy_url: process.env.SITE_URL + '/privacy',
      terms_of_service_url: process.env.SITE_URL + '/terms',
    },
    features: {
      subscription_update: {
        enabled: true,
        default_allowed_updates: ['price', 'promotion_code'],
        products: [], // Empty array means all products are allowed
        proration_behavior: 'create_prorations', // Enable proration for mid-cycle changes
      },
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end', // Allow access until end of billing period
        cancellation_reason: {
          enabled: true,
          options: ['too_expensive', 'unused', 'other'],
        },
      },
      subscription_pause: {
        enabled: false, // Don't allow pausing
      },
      payment_method_update: {
        enabled: true,
      },
      invoice_history: {
        enabled: true,
      },
    },
    metadata: {
      name: STRIPE_PORTAL_CONFIG_NAME,
    },
  });

  return configuration.id;
}

/**
 * Create a billing portal session with plan change capabilities
 */
export async function createBillingPortalSessionWithConfig(
  customerId: string,
  origin: string
): Promise<PortalConfig> {
  const configurationId = await getOrCreatePortalConfiguration();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/profile?billing=return`,
    configuration: configurationId,
  });

  return {
    id: session.id,
    url: session.url,
  };
}

/**
 * Handle subscription plan change events
 * This is called from the webhook handler when a subscription is updated
 */
export async function handleSubscriptionPlanChange(
  subscription: Stripe.Subscription
): Promise<{ success: boolean; newTier?: string }> {
  const customerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer.id;

  const status = subscription.status;
  
  // Determine the tier based on subscription status and items
  const hasPremium = status === 'active' || status === 'trialing';
  const tier = hasPremium ? 'premium' : 'free';

  return {
    success: true,
    newTier: tier,
  };
}

/**
 * Get available plans for upgrade/downgrade
 */
export async function getAvailablePlans(): Promise<Array<{
  id: string;
  name: string;
  priceId: string;
  amount: number;
  interval: string;
}>> {
  const prices = await stripe.prices.list({
    active: true,
    expand: ['data.product'],
  });

  return prices.data
    .filter((price) => price.type === 'recurring')
    .map((price) => ({
      id: price.id,
      name: (price.product as Stripe.Product).name || 'Unknown',
      priceId: price.id,
      amount: price.unit_amount || 0,
      interval: price.recurring?.interval || 'month',
    }));
}
