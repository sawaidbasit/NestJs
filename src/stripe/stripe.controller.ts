import { Controller, Get, Query, Logger, BadRequestException } from '@nestjs/common';
import { StripeService } from './stripe.service';

@Controller('stripe')
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(private readonly stripeService: StripeService) {}

  @Get('checkout-session')
  async getCheckoutSession(@Query('sessionId') sessionId: string | undefined) {
    if (!sessionId) {
      this.logger.error('sessionId is required');
      throw new BadRequestException('sessionId is required');
    }

    this.logger.log(`Received request to retrieve checkout session with sessionId: ${sessionId}`);
    try {
      const session = await this.stripeService.retrieveCheckoutSession(sessionId);
      this.logger.log(`Successfully retrieved checkout session: ${JSON.stringify(session)}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to retrieve checkout session for sessionId ${sessionId}:`, error);
      throw error;
    }
  }

  @Get('subscription')
  async getSubscription(@Query('subscriptionId') subscriptionId: string | undefined) {
    if (!subscriptionId) {
      this.logger.error('subscriptionId is required');
      throw new BadRequestException('subscriptionId is required');
    }

    this.logger.log(`Received request to retrieve subscription with subscriptionId: ${subscriptionId}`);
    try {
      const subscription = await this.stripeService.retrieveSubscription(subscriptionId);
      this.logger.log(`Successfully retrieved subscription: ${JSON.stringify(subscription)}`);
      return subscription;
    } catch (error) {
      this.logger.error(`Failed to retrieve subscription for subscriptionId ${subscriptionId}:`, error);
      throw error;
    }
  }
}
