import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { getServerStripe2 } from '@/lib/stripe';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const stripe = getServerStripe2();
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // Verify user with Supabase
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
        }

        // Get user subscription data
        const { data: subscriptionData, error: subError } = await supabase
            .from('user_subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single();

        if (subError || !subscriptionData?.stripe_customer_id) {
            return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: subscriptionData.stripe_customer_id,
            return_url: `${appUrl}/profile`,
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error('[Stripe Portal] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
