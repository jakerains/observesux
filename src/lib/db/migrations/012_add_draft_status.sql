-- Add 'draft' to the status CHECK constraint for council_meetings.
-- Draft meetings have transcript + embeddings saved but the recap
-- hasn't been published yet (pending admin review).

ALTER TABLE council_meetings DROP CONSTRAINT IF EXISTS council_meetings_status_check;
ALTER TABLE council_meetings ADD CONSTRAINT council_meetings_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'draft', 'failed', 'no_captions', 'dismissed'));
