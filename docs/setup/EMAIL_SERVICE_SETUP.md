# Email Service Setup Guide - Resend Integration

**Status**: ✅ Code Complete - Just Needs Configuration
**Time Required**: 15-20 minutes
**Last Updated**: 2025-11-10

---

## 🎉 Good News!

The email system is **already fully implemented** in the codebase. Lead notification emails and auto-responders are ready to go. You just need to configure your Resend account and add the API key.

---

## ✅ What's Already Working

### 1. Lead Notification System (`/supabase/functions/submit-lead/index.ts`)

When a lead submits a form on your site, the system automatically:

**✉️ Sends to the Lead** (Auto-Response):
- Professional branded email
- Personalized based on lead type (buyer/seller/valuation)
- Thanks them and sets expectations
- Beautiful HTML template

**🔔 Sends to the Agent** (Notification):
- Lead details (name, email, phone, message)
- Lead type and additional info (price range, timeline, etc.)
- Link to view in dashboard
- Professional HTML template with green header

### 2. Shared Email Utility (`/supabase/functions/_shared/email.ts`)

Reusable email sending function that:
- Uses Resend API
- Handles HTML and plain text
- Graceful error handling (doesn't break if email fails)
- Customizable FROM_EMAIL
- Template helpers included

---

## 🚀 Setup Instructions

### Step 1: Create Resend Account (5 minutes)

1. **Sign up**: Go to https://resend.com
2. **Verify email**: Check your inbox and verify
3. **Free tier**: 3,000 emails/month, 100 emails/day

### Step 2: Get API Key (2 minutes)

1. **Dashboard**: Go to https://resend.com/api-keys
2. **Create API Key**:
   - Name: "AgentBio Production" (or "AgentBio Development")
   - Permission: "Sending access"
   - Copy the key (starts with `re_`)

   ```
   Example: re_123abc456def789ghi012jkl345mno678
   ```

### Step 3: Verify Domain (5 minutes) - IMPORTANT

**Why?** Without domain verification, emails may go to spam.

1. **Go to**: https://resend.com/domains
2. **Add Domain**: `agentbio.net`
3. **DNS Records**: Resend will show 3 DNS records to add:
   ```
   TXT _resend.agentbio.net → [verification code]
   MX agentbio.net → feedback-smtp.resend.com (Priority: 10)
   TXT agentbio.net → "v=spf1 include:_spf.resend.com ~all"
   ```

4. **Add to your DNS provider**:
   - Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
   - Add all 3 DNS records
   - Wait 5-10 minutes for propagation

5. **Verify in Resend**: Click "Verify Domain"

**Status Check**:
- ✅ Green checkmark = Ready to send!
- ⚠️ Pending = Wait a few more minutes
- ❌ Failed = Check DNS records

### Step 4: Configure Supabase Environment Variables (3 minutes)

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: AgentBio
3. **Settings** → **Edge Functions** → **Secrets**
4. **Add two secrets**:

   **Secret 1: RESEND_API_KEY**
   ```
   Name: RESEND_API_KEY
   Value: re_your_api_key_here
   ```

   **Secret 2: FROM_EMAIL**
   ```
   Name: FROM_EMAIL
   Value: notifications@agentbio.net
   ```

   (Use a `@agentbio.net` address since that's your verified domain)

5. **Click "Add"** for each

### Step 5: Deploy Edge Functions (Optional - if modified)

If you've made any changes to Edge Functions, deploy them:

```bash
# From project root
npx supabase functions deploy submit-lead
```

**Note**: If you haven't modified anything, they're already deployed!

---

## ✅ Testing the Email System

### Test 1: Lead Notification Email

1. **Go to your live site**: https://agentbio.net/[your-username]
2. **Fill out a lead form**:
   - Use your personal email
   - Fill in name, phone, message
   - Submit

3. **Check your email**:
   - ✅ You should receive an auto-response email
   - ✅ The agent should receive a notification email

4. **Verify in Resend Dashboard**:
   - Go to https://resend.com/emails
   - You should see 2 emails sent
   - Check status (Delivered, Opened, Clicked)

### Test 2: Database Check

```sql
-- In Supabase SQL Editor
SELECT * FROM leads ORDER BY created_at DESC LIMIT 10;
```

You should see your test lead with all data captured.

### Test 3: Check Logs

1. **Supabase Dashboard** → **Edge Functions** → **submit-lead**
2. **Logs** tab
3. Look for:
   ```
   Email sent successfully to: [email]
   ```

If you see errors, check:
- RESEND_API_KEY is set correctly
- Domain is verified
- API key has "Sending access" permission

---

## 🎨 Email Templates Already Created

### Agent Notification Email
**Subject**: 🔔 New [lead type] from [Name]

Features:
- Green header
- All lead details in table format
- Link to dashboard
- Responsive HTML

### Lead Auto-Response Email
**Subject**: Thank you for your [inquiry type]

Features:
- Purple gradient header
- Personalized message based on lead type
- Professional formatting
- Agent name signature
- Responsive HTML

---

## 🔧 Customization Options

### Change "From" Name

Edit `/supabase/functions/_shared/email.ts`:

```typescript
from: 'Your Name <notifications@agentbio.net>'
```

Examples:
- `'AgentBio <notifications@agentbio.net>'`
- `'Sarah Johnson <sarah@agentbio.net>'`
- `'AgentBio Notifications <noreply@agentbio.net>'`

### Change Email Templates

Both templates are in `/supabase/functions/submit-lead/index.ts`:
- Line 121-172: Auto-response to lead
- Line 175-233: Notification to agent

Customize:
- HTML styles (colors, fonts, layout)
- Message copy
- Add your logo
- Add social media links

### Add More Email Types

Create new functions in `/supabase/functions/`:
```bash
mkdir supabase/functions/send-welcome-email
```

Use the shared `sendEmail()` utility:
```typescript
import { sendEmail } from '../_shared/email.ts'

await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to AgentBio!',
  body: 'Plain text version',
  html: '<h1>HTML version</h1>'
})
```

---

## 📊 Monitoring & Analytics

### Resend Dashboard

**Metrics Available**:
- Total emails sent
- Delivery rate (should be >98%)
- Open rate (avg 20-30% for transactional)
- Click rate
- Bounce rate
- Spam complaints

**Best Practices**:
- Keep bounce rate < 5%
- Keep spam rate < 0.1%
- Monitor delivery rate daily

### Supabase Logs

**Check logs for**:
- Email send attempts
- Failures and reasons
- Response times

**Access**:
Supabase Dashboard → Edge Functions → [function] → Logs

---

## 🐛 Troubleshooting

### Problem: Emails Not Sending

**Check 1: API Key Set?**
```bash
# In Supabase Dashboard → Settings → Edge Functions → Secrets
# Verify RESEND_API_KEY exists
```

**Check 2: Domain Verified?**
- Go to https://resend.com/domains
- Should show green checkmark
- If not, check DNS records

**Check 3: Check Logs**
```
Supabase Dashboard → Functions → submit-lead → Logs

Look for:
"Email sent successfully" ✅
or
"Failed to send email" ❌
```

**Check 4: Test Resend API Directly**
```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_your_key' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "notifications@agentbio.net",
    "to": "your@email.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

### Problem: Emails Going to Spam

**Solutions**:
1. **Verify domain** (most important)
2. **Add DKIM record** (Resend provides this)
3. **Add DMARC record**:
   ```
   TXT _dmarc.agentbio.net → "v=DMARC1; p=none;"
   ```
4. **Warm up sending** (start with low volume, increase gradually)
5. **Use verified "From" address**

### Problem: High Bounce Rate

**Causes**:
- Invalid email addresses from leads
- Typos in email forms
- Disposable email addresses

**Solutions**:
1. **Add email validation** (already in forms)
2. **Double opt-in** (send verification email)
3. **Clean email list** regularly

---

## 💰 Pricing & Limits

### Resend Free Tier
- ✅ 3,000 emails/month
- ✅ 100 emails/day
- ✅ Domain verification
- ✅ Webhooks
- ✅ API access

### When to Upgrade?
- More than 3,000 emails/month
- Need higher daily limit
- Want dedicated IP
- Need priority support

**Paid Plans**:
- Pro: $20/mo - 50,000 emails
- Team: $100/mo - 300,000 emails
- Enterprise: Custom pricing

### Calculation for AgentBio

**Assumptions**:
- 100 agents on platform
- 10 leads per agent per month
- 2 emails per lead (notification + auto-response)

**Total**: 100 × 10 × 2 = **2,000 emails/month**

**Result**: ✅ Free tier is sufficient!

---

## 📝 Next Steps After Setup

Once emails are working:

1. **Monitor for 1 week**:
   - Check delivery rates
   - Watch for bounces
   - Read agent feedback

2. **Optimize templates**:
   - A/B test subject lines
   - Adjust copy based on response
   - Add more personalization

3. **Add more email types**:
   - Welcome email for new agents
   - Weekly digest of leads
   - Monthly performance report
   - Birthday/anniversary emails

4. **Set up webhooks**:
   - Track opens and clicks
   - Update lead status automatically
   - Trigger follow-up actions

---

## ✅ Checklist

- [ ] Created Resend account
- [ ] Got API key (re_xxxxx)
- [ ] Verified domain (agentbio.net)
- [ ] Added DNS records (TXT, MX, SPF)
- [ ] Set RESEND_API_KEY in Supabase
- [ ] Set FROM_EMAIL in Supabase
- [ ] Tested lead form submission
- [ ] Received auto-response email
- [ ] Received notification email
- [ ] Checked Resend dashboard
- [ ] Reviewed email logs in Supabase

---

## 🎉 You're Done!

Your email system is now fully operational! Agents will receive notifications for every lead, and leads will get professional auto-responses.

**Time Investment**: 15-20 minutes
**Monthly Cost**: $0 (free tier)
**Emails per month**: Up to 3,000
**Delivery rate**: 98%+

**Questions?** Check Resend docs: https://resend.com/docs

---

**Last Updated**: 2025-11-10
**Status**: Ready for Production ✅
