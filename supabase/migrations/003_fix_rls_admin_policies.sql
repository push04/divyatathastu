-- =============================================
-- MIGRATION 003 — Fix missing RLS policies
-- RLS was enabled on coupons but had NO policies
-- Notifications had no admin policy (broadcast broken)
-- Add admin full-access policies for remaining tables
-- =============================================

-- ── COUPONS ── (RLS was enabled but no policies existed — nobody could access)
CREATE POLICY "coupons_public_read" ON coupons FOR SELECT USING (is_active = true);
CREATE POLICY "coupons_admin" ON coupons FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- ── NOTIFICATIONS ── (missing admin policy — broadcast insert was failing)
CREATE POLICY "notifications_admin" ON notifications FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- ── MAIL MESSAGES ── (admin/expert needs to read all messages to reply)
CREATE POLICY "mail_messages_admin" ON mail_messages FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'expert')
);

-- ── EBOOK PURCHASES ── (admin needs to view all purchase records)
CREATE POLICY "ebook_purchases_admin" ON ebook_purchases FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- ── EVENT REGISTRATIONS ── (admin needs to view/manage registrations)
CREATE POLICY "event_reg_admin" ON event_registrations FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- ── SAVED MANDIRS ── (admin read-only for analytics)
CREATE POLICY "saved_mandirs_admin" ON saved_mandirs FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- ── KUNDLI CACHE ── (admin read-only)
CREATE POLICY "kundli_cache_admin" ON kundli_cache FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'expert')
);

-- ── REPORT DISCUSSIONS ── (admin full access)
CREATE POLICY "report_discussions_admin" ON report_discussions FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'expert')
);

-- ── ITINERARIES ── (admin read-only for moderation)
CREATE POLICY "itineraries_admin" ON itineraries FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
