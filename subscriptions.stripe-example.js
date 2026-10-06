// NOT WIRED IN — reference implementation for real subscriptions.
//
// The admin panel's manual tier toggle (PUT /api/admin/users/:id/tier) is
// enough to demo and test the subscriber path end to end. For real
// payments, install `stripe`, add STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET
// to server/.env, mount this router in index.js, and point a Stripe
// Checkout button in the desktop app at POST /api/billing/checkout.
//
//   import Stripe from 'stripe';
//   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
//
//   billingRouter.post('/billing/checkout', async (req, res) => {
//     const session = await stripe.checkout.sessions.create({
//       mode: 'subscription',
//       line_items: [{ price: 'price_xxx', quantity: 1 }],
//       success_url: 'https://your-app/success',
//       cancel_url: 'https://your-app/cancel',
//       client_reference_id: req.userId,
//     });
//     res.json({ url: session.url });
//   });
//
//   // Raw body needed for signature verification — mount with
//   // express.raw({ type: 'application/json' }) on this one route only.
//   billingRouter.post('/billing/webhook', async (req, res) => {
//     const event = stripe.webhooks.constructEvent(
//       req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET
//     );
//     if (event.type === 'checkout.session.completed') {
//       const session = event.data.object;
//       setTier(session.client_reference_id, 'subscriber', /* renewal date */ null);
//     }
//     if (event.type === 'customer.subscription.deleted') {
//       // look up the associated userId (store it when the subscription is
//       // created) and setTier(userId, 'free')
//     }
//     res.json({ received: true });
//   });
