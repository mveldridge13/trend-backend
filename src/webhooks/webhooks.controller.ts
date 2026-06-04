import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhooksService } from './webhooks.service';
import { RevenueCatWebhookEvent } from './dto/revenuecat-webhook.dto';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly configService: ConfigService,
  ) {}

  @Post('revenuecat')
  @HttpCode(HttpStatus.OK)
  async handleRevenueCatWebhook(
    @Body() event: RevenueCatWebhookEvent,
    @Headers('authorization') authHeader: string,
  ): Promise<{ received: boolean }> {
    const webhookSecret = this.configService.get<string>('REVENUECAT_WEBHOOK_SECRET');

    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      this.logger.warn('Invalid RevenueCat webhook authorization');
      throw new UnauthorizedException('Invalid webhook authorization');
    }

    try {
      await this.webhooksService.handleRevenueCatEvent(event);
      return { received: true };
    } catch (error) {
      this.logger.error(`Error processing RevenueCat webhook: ${error.message}`, error.stack);
      return { received: true };
    }
  }
}
