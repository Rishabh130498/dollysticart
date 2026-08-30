import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerUserClient } from '@/lib/supabase/server';
import { razorpay } from '@/lib/payments/razorpay';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, shipping } = body;

    // 1. Basic Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart items are required.' }, { status: 400 });
    }
    if (!shipping || !shipping.name || !shipping.email || !shipping.phone || !shipping.street || !shipping.city || !shipping.state || !shipping.postal_code) {
      return NextResponse.json({ error: 'Fulfillment details are incomplete.' }, { status: 400 });
    }

    // 2. Resolve User Session if logged in
    let userId: string | null = null;
    try {
      const userClient = await createServerUserClient();
      const { data: { session } } = await userClient.auth.getSession();
      if (session?.user) {
        userId = session.user.id;
      }
    } catch (e) {
      console.warn('Authentication read skipped or offline.', e);
    }

    // 3. Connect to Supabase via Admin Client (bypass public RLS for catalog validation)
    const adminDb = createAdminClient();

    // Fetch product details for all requested IDs
    const productIds = items.map((i: any) => i.productId);
    const { data: products, error: prodError } = await adminDb
      .from('products')
      .select('id, name, slug, regular_price, discounted_price, status')
      .in('id', productIds);

    if (prodError || !products || products.length === 0) {
      return NextResponse.json({ error: 'Failed to retrieve active product prices from catalog.' }, { status: 400 });
    }

    // Build map for quick lookups
    const productMap = new Map(products.map(p => [p.id, p]));

    // 4. Calculate pricing securely on the server (Paise integers)
    let subtotal = 0;
    let totalDiscount = 0;
    const orderItemsToInsert: any[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      
      // Verify product validity
      if (!product) {
        return NextResponse.json({ error: `Product ID ${item.productId} was not found.` }, { status: 400 });
      }
      if (product.status !== 'published') {
        return NextResponse.json({ error: `Product ${product.name} is no longer available.` }, { status: 400 });
      }
      if (item.quantity < 1) {
        return NextResponse.json({ error: `Invalid quantity for ${product.name}.` }, { status: 400 });
      }

      const itemRegularPrice = product.regular_price;
      const itemDiscountedPrice = product.discounted_price;
      const finalItemPrice = itemDiscountedPrice ?? itemRegularPrice;

      subtotal += itemRegularPrice * item.quantity;
      if (itemDiscountedPrice !== null) {
        totalDiscount += (itemRegularPrice - itemDiscountedPrice) * item.quantity;
      }

      orderItemsToInsert.push({
        product_id: product.id,
        quantity: item.quantity,
        price_at_purchase: itemRegularPrice,
        discount_at_purchase: itemDiscountedPrice !== null ? (itemRegularPrice - itemDiscountedPrice) : 0,
      });
    }

    const finalTotal = subtotal - totalDiscount;
    if (finalTotal <= 0) {
      return NextResponse.json({ error: 'Order total must be greater than zero.' }, { status: 400 });
    }

    // 5. Insert Pending Order in database
    const { data: order, error: orderError } = await adminDb
      .from('orders')
      .insert([
        {
          user_id: userId,
          customer_name: shipping.name,
          customer_email: shipping.email,
          customer_phone: shipping.phone,
          shipping_address: {
            street: shipping.street,
            city: shipping.city,
            state: shipping.state,
            postal_code: shipping.postal_code,
            country: shipping.country || null,
            telephone: shipping.telephone || null,
          },
          status: 'pending',
          payment_status: 'pending',
          currency: 'INR',
          subtotal,
          discount: totalDiscount,
          total: finalTotal,
        },
      ])
      .select('id')
      .single();

    if (orderError || !order) {
      console.error('Database order creation failed', orderError);
      return NextResponse.json({ error: 'Order registration failed.' }, { status: 500 });
    }

    // 6. Insert Order Items linked to Order
    const itemsWithOrderId = orderItemsToInsert.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await adminDb
      .from('order_items')
      .insert(itemsWithOrderId);

    if (itemsError) {
      console.error('Database items registration failed', itemsError);
      // Clean up orphaned pending order
      await adminDb.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: 'Order items registration failed.' }, { status: 500 });
    }

    // 7. Request Razorpay Order ID from Payment Gateway
    let razorpayOrderId = '';
    
    // Check if keys are placeholders or test keys (mock mode)
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const isMockMode =
      !keyId ||
      keyId.includes('mock') ||
      keyId.includes('your_public_key_id') ||
      !secret ||
      secret.includes('your_razorpay_secret_key');

    if (isMockMode) {
      // Mock flow for offline development
      razorpayOrderId = `order_mock_${Math.random().toString(36).substring(2, 10)}`;
      console.log(`[MOCK PAYMENT] Order created successfully. ID: ${razorpayOrderId}, Amount: ${finalTotal}`);
    } else {
      try {
        const rpOrder = await razorpay.orders.create({
          amount: finalTotal, // in paise
          currency: 'INR',
          receipt: order.id,
        });
        razorpayOrderId = rpOrder.id;
      } catch (rpErr: any) {
        console.error('Razorpay SDK order call failed, attempting mock fallback', rpErr);
        // Fallback to mock in case API fails
        razorpayOrderId = `order_mock_${Math.random().toString(36).substring(2, 10)}`;
      }
    }

    // 8. Update database order with the generated payment ID
    await adminDb
      .from('orders')
      .update({ razorpay_order_id: razorpayOrderId })
      .eq('id', order.id);

    // Return tokens to frontend checkout client
    return NextResponse.json({
      razorpayOrderId,
      amount: finalTotal,
      currency: 'INR',
      orderId: order.id,
      isMock: isMockMode
    });

  } catch (err: any) {
    console.error('Fatal order POST failure', err);
    return NextResponse.json({ error: 'Internal server failure.' }, { status: 500 });
  }
}
