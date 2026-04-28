-- Add low-maintenance indexes used by the alert cron.
-- The current live data set is small, but these keep hourly checks cheap as
-- push subscriptions and triggered-alert history grow.

CREATE INDEX IF NOT EXISTS idx_browser_push_subscriptions_notify_weather
  ON browser_push_subscriptions (notify_weather)
  WHERE is_active = true AND notify_weather = true;

CREATE INDEX IF NOT EXISTS idx_browser_push_subscriptions_notify_river
  ON browser_push_subscriptions (notify_river)
  WHERE is_active = true AND notify_river = true;

CREATE INDEX IF NOT EXISTS idx_browser_push_subscriptions_notify_air_quality
  ON browser_push_subscriptions (notify_air_quality)
  WHERE is_active = true AND notify_air_quality = true;

CREATE INDEX IF NOT EXISTS idx_browser_push_subscriptions_notify_traffic
  ON browser_push_subscriptions (notify_traffic)
  WHERE is_active = true AND notify_traffic = true;

CREATE INDEX IF NOT EXISTS idx_browser_push_subscriptions_notify_digest
  ON browser_push_subscriptions (notify_digest)
  WHERE is_active = true AND notify_digest = true;

CREATE INDEX IF NOT EXISTS idx_browser_push_subscriptions_notify_council_meeting
  ON browser_push_subscriptions (notify_council_meeting)
  WHERE is_active = true AND notify_council_meeting = true;

CREATE INDEX IF NOT EXISTS idx_device_triggered_alerts_triggered_at
  ON device_triggered_alerts (triggered_at);

CREATE INDEX IF NOT EXISTS idx_browser_triggered_alerts_triggered_at
  ON browser_triggered_alerts (triggered_at);
