# Instagram Bio Analyzer - Resend Email Integration Setup

This document explains how to set up the automated email system for the Instagram Bio Analyzer tool.

## Overview

The email system sends a 7-day nurture sequence to agents who use the bio analyzer:
- **Email 1**: Immediate delivery with 3 optimized bios
- **Email 2-7**: Scheduled over 7 days (sent by cron job)

## Prerequisites

1. **Resend API Key**: Already configured in both Cloudflare and Supabase as `RESEND_API_KEY`
2. **Supabase Edge Functions**: Deployed and running
3. **Database Tables**: Migrations already created

## Setup Steps

### 1. Verify Environment Variables

Make sure these are set in your Supabase project:

```bash
# In Supabase Dashboard > Project Settings > Edge Functions > Secrets
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=noreply@agentbio.net  # Or your verified domain
SITE_URL=https://agentbio.net
SUPABASE_URL=https://api.agentbio.net  # Self-hosted Supabase API
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 2. Deploy Edge Functions

Deploy both edge functions to Supabase:

```bash
# Deploy the immediate email function
supabase functions deploy send-bio-analyzer-email

# Deploy the scheduled email cron function
supabase functions deploy send-scheduled-bio-emails
```

### 3. Set Up Cron Job

Configure a cron job to run the scheduled email function daily:

#### Option A: Supabase Cron (Recommended)

Create a cron job in your Supabase project:

```sql
-- Run daily at 9 AM UTC
SELECT cron.schedule(
  'send-bio-analyzer-emails',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://functions.agentbio.net/send-scheduled-bio-emails',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);
```

#### Option B: External Cron (GitHub Actions, Vercel Cron, etc.)

Set up a daily trigger to call:
```bash
curl -X POST https://functions.agentbio.net/send-scheduled-bio-emails \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### 4. Verify Resend Domain

Make sure your sending domain is verified in Resend:

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add your domain (e.g., agentbio.net)
3. Add the required DNS records
4. Verify the domain

### 5. Test the Integration

Test the immediate email:

```bash
curl -X POST https://functions.agentbio.net/send-bio-analyzer-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "analysisId": "test-id",
    "email": "your-test-email@example.com",
    "firstName": "Test",
    "market": "Miami, FL",
    "score": 75,
    "bioRewrites": [
      "Bio option 1",
      "Bio option 2",
      "Bio option 3"
    ]
  }'
```

Test the scheduled emails function:

```bash
curl -X POST https://functions.agentbio.net/send-scheduled-bio-emails \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## Email Sequence Timeline

| Day | Email | Subject | Purpose |
|-----|-------|---------|---------|
| 0 | Email 1 | Your 3 Optimized Instagram Bios | Deliver value immediately |
| 1 | Email 2 | The mistake 73% of agents make | Education + pain point |
| 2 | Email 3 | Instagram as 24/7 scheduler | Show what's possible |
| 3 | Email 4 | 30-day content calendar | More free value |
| 5 | Email 5 | Real data from 2,847 agents | Social proof + benchmarks |
| 6 | Email 6 | Linktree vs AgentBio | Address objections |
| 7 | Email 7 | 20% off + free setup | Final conversion push |

## Monitoring

### Check Email Delivery

Query sent emails:

```sql
SELECT
  ec.email,
  ec.first_name,
  ec.market,
  es.sequence_number,
  es.email_subject,
  es.sent_at,
  es.opened,
  es.clicked
FROM instagram_bio_email_captures ec
JOIN instagram_bio_email_sequences es ON es.email_capture_id = ec.id
WHERE ec.created_at > NOW() - INTERVAL '7 days'
ORDER BY ec.created_at DESC, es.sequence_number ASC;
```

### Check Sequence Completion Rate

```sql
SELECT
  COUNT(*) FILTER (WHERE email_sequence_completed = true) as completed,
  COUNT(*) FILTER (WHERE email_sequence_completed = false) as in_progress,
  COUNT(*) as total,
  ROUND(COUNT(*) FILTER (WHERE email_sequence_completed = true)::numeric / COUNT(*) * 100, 2) as completion_rate
FROM instagram_bio_email_captures
WHERE email_sequence_started = true;
```

### Check Email Engagement

```sql
SELECT
  sequence_number,
  COUNT(*) as sent,
  COUNT(*) FILTER (WHERE opened = true) as opened,
  COUNT(*) FILTER (WHERE clicked = true) as clicked,
  ROUND(COUNT(*) FILTER (WHERE opened = true)::numeric / COUNT(*) * 100, 2) as open_rate,
  ROUND(COUNT(*) FILTER (WHERE clicked = true)::numeric / COUNT(*) * 100, 2) as click_rate
FROM instagram_bio_email_sequences
WHERE sent_at IS NOT NULL
GROUP BY sequence_number
ORDER BY sequence_number;
```

## Troubleshooting

### Emails Not Sending

1. Check Resend API key is valid
2. Check domain is verified in Resend
3. Check edge function logs: `supabase functions logs send-bio-analyzer-email`
4. Check FROM_EMAIL is set correctly

### Scheduled Emails Not Working

1. Verify cron job is running
2. Check function logs: `supabase functions logs send-scheduled-bio-emails`
3. Verify captures have `email_sequence_started = true`
4. Check the date calculation logic is working

### Email Bounces

Monitor bounces in Resend dashboard and update the database:

```sql
UPDATE instagram_bio_email_captures
SET email_sequence_completed = true
WHERE email = 'bounced-email@example.com';
```

## Customization

### Modify Email Content

Edit the email templates in:
- `/supabase/functions/send-bio-analyzer-email/index.ts` (Email 1)
- `/supabase/functions/send-scheduled-bio-emails/index.ts` (Emails 2-7)

After changes, redeploy:
```bash
supabase functions deploy send-bio-analyzer-email
supabase functions deploy send-scheduled-bio-emails
```

### Change Email Timing

Modify the day schedule in `send-scheduled-bio-emails/index.ts`:

```typescript
// Current schedule
if (daysSinceCapture >= 1 && !sentNumbers.includes(2)) sequenceToSend = 2
else if (daysSinceCapture >= 2 && !sentNumbers.includes(3)) sequenceToSend = 3
// ... etc

// Example: Speed up to send all in 3 days
if (daysSinceCapture >= 0.5 && !sentNumbers.includes(2)) sequenceToSend = 2
else if (daysSinceCapture >= 1 && !sentNumbers.includes(3)) sequenceToSend = 3
```

## Performance Optimization

### Batch Processing

For high volume, modify the cron function to process in batches:

```typescript
const BATCH_SIZE = 100;
// Process captures in batches of 100
```

### Rate Limiting

Resend has rate limits. Add delays between sends if needed:

```typescript
await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
```

## Conversion Tracking

Track conversions from email to trial signup:

```sql
-- When user signs up with matching email
UPDATE instagram_bio_email_captures
SET
  converted_to_trial = true,
  converted_at = NOW()
WHERE email = $1;
```

Add this to your registration/trial signup flow.

## Cost Estimation

Resend pricing (as of 2024):
- Free tier: 100 emails/day
- Pro: $20/month for 50,000 emails

Expected usage:
- 1,600 analyses/month × 55% capture = 880 captures
- 880 captures × 7 emails = 6,160 emails/month
- Cost: Free tier sufficient initially, ~$20/month at scale

## Support

For issues with:
- **Resend**: Check [Resend Docs](https://resend.com/docs)
- **Supabase Edge Functions**: Check [Supabase Docs](https://supabase.com/docs/guides/functions)
- **This tool**: Contact development team

## Next Steps

1. ✅ Deploy edge functions
2. ✅ Set up cron job
3. ✅ Test email delivery
4. ✅ Monitor first week of emails
5. ✅ Optimize based on engagement data
6. ✅ Add conversion tracking
7. ✅ Scale as volume increases
