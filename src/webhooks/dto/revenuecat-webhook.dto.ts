export interface RevenueCatWebhookEvent {
  api_version: string;
  event: {
    id: string;
    type: RevenueCatEventType;
    app_id: string;
    event_timestamp_ms: number;
    product_id: string;
    period_type: string;
    purchased_at_ms: number;
    expiration_at_ms: number | null;
    environment: 'SANDBOX' | 'PRODUCTION';
    entitlement_id: string | null;
    entitlement_ids: string[];
    presented_offering_id: string | null;
    transaction_id: string;
    original_transaction_id: string;
    is_family_share: boolean;
    country_code: string;
    app_user_id: string;
    aliases: string[];
    original_app_user_id: string;
    currency: string;
    price: number;
    price_in_purchased_currency: number;
    subscriber_attributes: Record<string, { value: string; updated_at_ms: number }>;
    store: 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | 'PROMOTIONAL';
    takehome_percentage: number;
    offer_code: string | null;
    tax_percentage: number;
    commission_percentage: number;
    cancel_reason: string | null;
    expiration_reason: string | null;
  };
}

export type RevenueCatEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'UNCANCELLATION'
  | 'NON_RENEWING_PURCHASE'
  | 'SUBSCRIPTION_PAUSED'
  | 'EXPIRATION'
  | 'BILLING_ISSUE'
  | 'PRODUCT_CHANGE'
  | 'TRANSFER';

export function mapStoreToProvider(store: string): 'APPLE' | 'GOOGLE' | 'STRIPE' | null {
  switch (store) {
    case 'APP_STORE':
      return 'APPLE';
    case 'PLAY_STORE':
      return 'GOOGLE';
    case 'STRIPE':
      return 'STRIPE';
    default:
      return null;
  }
}
