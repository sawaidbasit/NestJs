import { Injectable, Logger } from '@nestjs/common';
import { Stripe } from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor() {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in the environment variables');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-03-31.basil',
    });
  }

  async retrieveCheckoutSession(sessionId: string) {
    this.logger.log(`Retrieving checkout session for sessionId: ${sessionId}`);
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      this.logger.log(`Checkout session retrieved successfully: ${JSON.stringify(session)}`);
      return session;
    } catch (error) {
      this.logger.error(`Error retrieving checkout session for sessionId ${sessionId}:`, error);
      throw error;
    }
  }

  async retrieveSubscription(subscriptionId: string) {
    this.logger.log(`Retrieving subscription for subscriptionId: ${subscriptionId}`);
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      this.logger.log(`Subscription retrieved successfully: ${JSON.stringify(subscription)}`);
      return subscription;
    } catch (error) {
      this.logger.error(`Error retrieving subscription for subscriptionId ${subscriptionId}:`, error);
      throw error;
    }
  }
}
