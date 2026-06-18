-- Newsletter Subscribers Table
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email            text        UNIQUE NOT NULL,
  name             text,
  status           text        DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  source           text        DEFAULT 'website',
  subscribed_at    timestamptz DEFAULT now(),
  unsubscribed_at  timestamptz
);

CREATE INDEX IF NOT EXISTS newsletter_subscribers_email_idx  ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_status_idx ON newsletter_subscribers(status);

-- RLS: enabled, only service role can read/write (API uses service role key)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- No public read/write — all access goes through the API route (service role)
-- If you want admin panel access via Supabase dashboard, run the line below:
-- CREATE POLICY "admin_all" ON newsletter_subscribers FOR ALL USING (auth.role() = 'service_role');

-- Unsubscribe helper function (optional: call via RPC from a one-click unsubscribe link)
CREATE OR REPLACE FUNCTION unsubscribe_newsletter(subscriber_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE newsletter_subscribers
  SET status = 'unsubscribed', unsubscribed_at = now()
  WHERE email = lower(subscriber_email);
END;
$$;
