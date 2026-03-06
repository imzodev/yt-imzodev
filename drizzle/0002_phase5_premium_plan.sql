INSERT INTO "subscription_plans" (
  "name",
  "slug",
  "description",
  "stripe_price_id",
  "amount",
  "currency",
  "interval",
  "features",
  "is_active",
  "sort_order"
)
VALUES (
  'Premium',
  'premium',
  'Monthly premium membership for the YouTube Community Portal.',
  'price_1T7zPRC7xTF363N1xw3CSMnL',
  999,
  'usd',
  'month',
  '["Premium videos", "Advanced search", "Expanded forum participation", "Priority support", "Early access"]'::json,
  true,
  1
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "stripe_price_id" = EXCLUDED."stripe_price_id",
  "amount" = EXCLUDED."amount",
  "currency" = EXCLUDED."currency",
  "interval" = EXCLUDED."interval",
  "features" = EXCLUDED."features",
  "is_active" = EXCLUDED."is_active",
  "sort_order" = EXCLUDED."sort_order";
