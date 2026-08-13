import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { getServerStripe2 } from '@/lib/stripe';
import type { SubscriptionPlan } from '@/types/subscription';

type CheckoutPlan = Extract<SubscriptionPlan, 'monthly' | 'yearly'>;

function getRuntimePriceId(plan: CheckoutPlan): string {
    const key = plan === 'monthly'
        ? 'STRIPE_MONTHLY_PRICE_ID'
        : 'STRIPE_YEARLY_PRICE_ID';

    const priceId = process.env[key]?.trim();

    if (!priceId) {
        throw new Error(`${key} is not configured`);
    }

    return priceId;
}

function isCheckoutPlan(value: unknown): value is CheckoutPlan {
    return value === 'monthly' || value === 'yearly';
}

export async function POST(req: Request) {
    try {
        const { plan, cancelUrl } = await req.json();
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!isCheckoutPlan(plan)) {
            return NextResponse.json({ error: 'Invalid subscription plan' }, { status: 400 });
        }

        const priceId = getRuntimePriceId(plan);

        console.log('[Stripe Checkout] Received plan:', plan);
        console.log('[Stripe Checkout] Resolved priceId:', priceId);
        console.log('[Stripe Checkout] Received cancelUrl:', cancelUrl);

        if (!priceId) {
            return NextResponse.json({ error: 'Price ID not configured' }, { status: 400 });
        }

        if (!token) {
            console.error('[Stripe Checkout] Unauthorized: No token provided');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Initialize Stripe using shared configuration
        const stripe = getServerStripe2();

        // Log environment status for debugging
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        console.log(`[Stripe Checkout] Init: APP_URL=${appUrl}`);

        // Verify user with Supabase
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        
        // Get user from token
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            console.error('[Stripe Checkout] Supabase Auth Failed:', authError);
            return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
        }

        console.log(`[Stripe Checkout] Authenticated user: ${user.id}`);

        // Get user subscription data
        const { data: subscriptionData } = await supabase
            .from('user_subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single();

        // Get or Create Customer
        let customerId = subscriptionData?.stripe_customer_id;

        if (!customerId) {
            console.log(`[Stripe] Creating customer for user ${user.id}`);
            try {
                const customer = await stripe.customers.create({
                    email: user.email!,
                    metadata: {
                        supabaseUserId: user.id,
                    },
                });
                customerId = customer.id;

                // Save customer ID to Supabase
                const { error: upsertError } = await supabase
                    .from('user_subscriptions')
                    .upsert({
                        user_id: user.id,
                        stripe_customer_id: customerId,
                        subscription_status: 'free',
                        subscription_plan: 'none',
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'user_id'
                    });

                if (upsertError) {
                    console.error('[Stripe Checkout] Failed to save customer ID:', upsertError);
                    throw new Error(`Failed to save Stripe customer ID: ${upsertError.message}`);
                }
            } catch (stripeCustError: any) {
                console.error('[Stripe Checkout] Failed to create customer:', stripeCustError);
                throw new Error(`Failed to create Stripe customer: ${stripeCustError.message}`);
            }
        }

        // Create Checkout Session
        console.log(`[Stripe] Creating checkout session for customer ${customerId}, price ${priceId}`);
        console.log(`[Stripe] Using cancel_url: ${cancelUrl || `${appUrl}/premium?canceled=true`}`);
        try {
            const session = await stripe.checkout.sessions.create({
                customer: customerId,
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                allow_promotion_codes: true,
                subscription_data: {
                    trial_period_days: 7,
                },
                success_url: `${appUrl}/premium?success=true`,
                cancel_url: cancelUrl || `${appUrl}/premium?canceled=true`,
                client_reference_id: user.id,
                metadata: {
                    userId: user.id,
                },
            });

            return NextResponse.json({ url: session.url, sessionId: session.id });
        } catch (stripeSessionError: any) {
            console.error('[Stripe Checkout] Failed to create session:', stripeSessionError);

            // SPECIAL HANDLING: If customer does not exist (e.g. ID from Test Env used in Prod), recreate it
            if (stripeSessionError.code === 'resource_missing' && stripeSessionError.message.includes('No such customer')) {
                console.warn(`[Stripe] Customer ${customerId} missing. Re-creating customer for user ${user.id}...`);

                try {
                    // 1. Re-create customer
                    const newCustomer = await stripe.customers.create({
                        email: user.email!,
                        metadata: {
                            supabaseUserId: user.id,
                        },
                    });
                    const newCustomerId = newCustomer.id;

                    // 2. Update Supabase with new ID
                    await supabase
                        .from('user_subscriptions')
                        .upsert({
                            user_id: user.id,
                            stripe_customer_id: newCustomerId,
                            subscription_status: 'free',
                            subscription_plan: 'none',
                            updated_at: new Date().toISOString()
                        }, {
                            onConflict: 'user_id'
                        });

                    console.log(`[Stripe] Re-created customer: ${newCustomerId}. Retrying session...`);

                    // 3. Retry session creation with new ID
                    const session = await stripe.checkout.sessions.create({
                        customer: newCustomerId,
                        line_items: [
                            {
                                price: priceId,
                                quantity: 1,
                            },
                        ],
                        mode: 'subscription',
                        allow_promotion_codes: true,
                        subscription_data: {
                            trial_period_days: 7,
                        },
                        success_url: `${appUrl}/premium?success=true`,
                        cancel_url: cancelUrl || `${appUrl}/premium?canceled=true`,
                        client_reference_id: user.id,
                        metadata: {
                            userId: user.id,
                        },
                    });

                    return NextResponse.json({ url: session.url, sessionId: session.id });
                } catch (retryError: any) {
                    console.error('[Stripe Checkout] Retry failed:', retryError);
                    throw new Error(`Failed to recover from missing customer error: ${retryError.message}`);
                }
            }

            // Verify if it's an API key issue
            if (stripeSessionError.message?.includes('API key')) {
                console.error('[Stripe Checkout] CRITICAL: Invalid Stripe API Key. Check env vars.');
            }
            throw stripeSessionError;
        }

    } catch (error: any) {
        console.error('[Stripe Checkout Error]:', error);
        return NextResponse.json(
            {
                error: error.message || 'Internal Server Error',
                debug_error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                message: error.message, // Explicitly expose message
            },
            { status: 500 }
        );
    }
}
