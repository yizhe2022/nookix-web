import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';
import { getServerStripe2, getWebhookSecret } from '@/lib/stripe';
import { mapStripeStatus, SubscriptionPlan } from '@/types/subscription';

const stripe = getServerStripe2();
const webhookSecret = getWebhookSecret();

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed.`, err.message);
        return NextResponse.json({ error: err.message }, { status: 400 });
    }

    // Use Supabase service role client for admin operations
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.client_reference_id;
                const subscriptionId = session.subscription as string;
                const customerId = session.customer as string;

                if (userId && subscriptionId) {
                    try {
                        // Retrieve full subscription object to get current_period_end and price
                        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;
                        const priceId = subscription.items.data[0].price.id;

                        // Determine plan based on price ID
                        let plan: SubscriptionPlan = 'none';
                        console.log('[Webhook] Checking price ID:', priceId);
                        console.log('[Webhook] Monthly Price ID from env:', process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID);
                        console.log('[Webhook] Yearly Price ID from env:', process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID);
                        
                        if (priceId === process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID) {
                            plan = 'monthly';
                            console.log('[Webhook] Matched monthly plan');
                        } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID) {
                            plan = 'yearly';
                            console.log('[Webhook] Matched yearly plan');
                        } else {
                            console.warn('[Webhook] Price ID did not match any known plans:', priceId);
                        }

                        // Map Stripe status to database enum using helper function
                        const subscription_status = mapStripeStatus(subscription.status);

                        // Update user_subscriptions table
                        const { error } = await supabase
                            .from('user_subscriptions')
                            .upsert({
                                user_id: userId,
                                subscription_status,
                                subscription_plan: plan,
                                // @ts-expect-error - Stripe types are incomplete for current_period_start/end
                                start_date: new Date(subscription.current_period_start * 1000).toISOString(),
                                // @ts-expect-error - Stripe types are incomplete for current_period_start/end
                                end_date: new Date(subscription.current_period_end * 1000).toISOString(),
                                stripe_customer_id: customerId,
                                stripe_subscription_id: subscriptionId,
                                cancel_at_period_end: subscription.cancel_at_period_end || false,
                                updated_at: new Date().toISOString()
                            }, {
                                onConflict: 'user_id'
                            });

                        if (error) {
                            console.error('[Webhook] Failed to update subscription:', error);
                        } else {
                            console.log('[Webhook] Successfully updated subscription for user:', userId);
                        }
                    } catch (e) {
                        console.error("Failed to process checkout.session.completed", e);
                    }
                }
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                try {
                    // Find user by stripe_customer_id
                    const { data: subscriptionData, error: findError } = await supabase
                        .from('user_subscriptions')
                        .select('user_id')
                        .eq('stripe_customer_id', customerId)
                        .single();

                    if (findError || !subscriptionData) {
                        console.error("User not found for subscription update", findError);
                        break;
                    }

                    const priceId = subscription.items.data[0].price.id;

                    // Determine plan based on price ID
                    let plan: SubscriptionPlan = 'none';
                    console.log('[Webhook] Subscription updated - Checking price ID:', priceId);
                    
                    if (priceId === process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID) {
                        plan = 'monthly';
                        console.log('[Webhook] Matched monthly plan');
                    } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID) {
                        plan = 'yearly';
                        console.log('[Webhook] Matched yearly plan');
                    } else {
                        console.warn('[Webhook] Price ID did not match any known plans:', priceId);
                    }

                    // Map Stripe status to database enum using helper function
                    const subscription_status = mapStripeStatus(subscription.status);

                    const { error } = await supabase
                        .from('user_subscriptions')
                        .update({
                            subscription_status,
                            subscription_plan: plan,
                            // @ts-expect-error - Stripe types are incomplete for current_period_start/end
                            start_date: new Date(subscription.current_period_start * 1000).toISOString(),
                            // @ts-expect-error - Stripe types are incomplete for current_period_start/end
                            end_date: new Date(subscription.current_period_end * 1000).toISOString(),
                            cancel_at_period_end: subscription.cancel_at_period_end || false,
                            updated_at: new Date().toISOString()
                        })
                        .eq('user_id', subscriptionData.user_id);

                    if (error) {
                        console.error('[Webhook] Failed to update subscription:', error);
                    } else {
                        console.log('[Webhook] Successfully updated subscription for user:', subscriptionData.user_id);
                    }
                } catch (e) {
                    console.error("Failed to process subscription update", e);
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                try {
                    // Find user by stripe_customer_id
                    const { data: subscriptionData, error: findError } = await supabase
                        .from('user_subscriptions')
                        .select('user_id')
                        .eq('stripe_customer_id', customerId)
                        .single();

                    if (findError || !subscriptionData) {
                        console.error("User not found for subscription deletion", findError);
                        break;
                    }

                    const { error } = await supabase
                        .from('user_subscriptions')
                        .update({
                            subscription_status: 'canceled',
                            subscription_plan: 'none',
                            cancel_at_period_end: false,
                            updated_at: new Date().toISOString()
                        })
                        .eq('user_id', subscriptionData.user_id);

                    if (error) {
                        console.error('[Webhook] Failed to delete subscription:', error);
                    } else {
                        console.log('[Webhook] Successfully deleted subscription for user:', subscriptionData.user_id);
                    }
                } catch (e) {
                    console.error("Failed to process subscription deletion", e);
                }
                break;
            }
        }
    } catch (error) {
        console.error('Webhook handler failed', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
