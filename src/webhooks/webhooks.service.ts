import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RevenueCatWebhookEvent, mapStoreToProvider } from './dto/revenuecat-webhook.dto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleRevenueCatEvent(event: RevenueCatWebhookEvent): Promise<void> {
    const { type, app_user_id, expiration_at_ms, store } = event.event;

    this.logger.log(`Processing RevenueCat event: ${type} for user: ${app_user_id}`);

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: app_user_id },
          { rcCustomerId: app_user_id },
        ],
      },
    });

    if (!user) {
      this.logger.warn(`User not found for RevenueCat event: ${app_user_id}`);
      return;
    }

    const provider = mapStoreToProvider(store);

    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
        await this.activateSubscription(user.id, expiration_at_ms, provider, app_user_id);
        break;

      case 'EXPIRATION':
      case 'CANCELLATION':
        await this.handleExpiration(user.id, type);
        break;

      case 'BILLING_ISSUE':
        this.logger.warn(`Billing issue for user ${user.id} - subscription may expire soon`);
        break;

      default:
        this.logger.log(`Unhandled event type: ${type}`);
    }
  }

  private async activateSubscription(
    userId: string,
    expirationMs: number | null,
    provider: 'APPLE' | 'GOOGLE' | 'STRIPE' | null,
    rcCustomerId: string,
  ): Promise<void> {
    const proExpiresAt = expirationMs ? new Date(expirationMs) : null;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isPro: true,
        proExpiresAt,
        subscriptionProvider: provider,
        rcCustomerId,
      },
    });

    this.logger.log(`Activated Pro for user ${userId}, expires: ${proExpiresAt?.toISOString() || 'never'}`);
  }

  private async handleExpiration(userId: string, eventType: string): Promise<void> {
    if (eventType === 'EXPIRATION') {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isPro: false,
        },
      });
      this.logger.log(`Deactivated Pro for user ${userId} due to expiration`);
    } else {
      this.logger.log(`User ${userId} cancelled but still has access until expiration`);
    }
  }

  async getSubscriptionStatus(userId: string): Promise<{
    isPro: boolean;
    proExpiresAt: Date | null;
    subscriptionProvider: string | null;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        isPro: true,
        proExpiresAt: true,
        subscriptionProvider: true,
      },
    });

    if (!user) {
      return { isPro: false, proExpiresAt: null, subscriptionProvider: null };
    }

    if (user.isPro && user.proExpiresAt && user.proExpiresAt < new Date()) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isPro: false },
      });
      return { isPro: false, proExpiresAt: user.proExpiresAt, subscriptionProvider: user.subscriptionProvider };
    }

    return {
      isPro: user.isPro,
      proExpiresAt: user.proExpiresAt,
      subscriptionProvider: user.subscriptionProvider,
    };
  }
}
