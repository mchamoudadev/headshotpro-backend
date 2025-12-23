# Payment Environment Variables

## Stripe
```env
STRIPE_SECRET_KEY=sk_test_...          # Stripe secret key (test or live)
STRIPE_WEBHOOK_SECRET=whsec_...        # Stripe webhook signing secret
```

## Mobile Wallets (EVC, ZAAD, SAHAL)
```**env**
MERCHANT_U_ID=your_merchant_id
MERCHANT_API_KEY=your_api_key
MERCHANT_API_USER_ID=your_api_user_id
MERCHANT_API_END_POINT=https://api.endpoint.com
```

## EBIR (Ethiopian Mobile Payments)
```env
EBIR_MERCHANT_U_ID=your_ebir_merchant_id
EBIR_MERCHANT_API_KEY=your_ebir_api_key
EBIR_MERCHANT_API_USER_ID=your_ebir_api_user_id
EBIR_MERCHANT_API_END_POINT=https://ebir.api.endpoint.com
```

## Summary

**Stripe:** 2 variables
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

**EVC/ZAAD/SAHAL:** 4 variables (shared)
- `MERCHANT_U_ID`
- `MERCHANT_API_KEY`
- `MERCHANT_API_USER_ID`
- `MERCHANT_API_END_POINT`

**EBIR:** 4 variables (separate)
- `EBIR_MERCHANT_U_ID`
- `EBIR_MERCHANT_API_KEY`
- `EBIR_MERCHANT_API_USER_ID`
- `EBIR_MERCHANT_API_END_POINT`

**AWS:**
- `AWS_ACCESS_KEY_ID`
-  `AWS_SECRET_ACCESS_KEY`
-  `AWS_BUCKET_NAME`
-  `AWS_REGION`
-  `AWS_VERSION` 2010-12-01

**REPLICATE**
   - `REPLICATE_API_KEY`

**Total: 10 environment variables**



