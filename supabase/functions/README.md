# Supabase Edge Functions

This directory contains Supabase Edge Functions for handling backend operations.

## Available Functions

### Push Notifications

1. **register-push-token** - Register FCM token for push notifications
2. **unregister-push-token** - Unregister/deactivate FCM token

### Form Submissions

3. **submit-contact** - Handle contact form submissions

## Prerequisites

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link to your project:
```bash
supabase link --project-ref your-project-ref
```

## Deployment

Deploy all functions:
```bash
supabase functions deploy
```

Deploy a specific function:
```bash
supabase functions deploy register-push-token
```

## Environment Variables

Set these secrets in your Supabase dashboard or via CLI:

```bash
# Required
supabase secrets set SUPABASE_URL=your-supabase-url
supabase secrets set SUPABASE_ANON_KEY=your-anon-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional - for email notifications
supabase secrets set RESEND_API_KEY=your-resend-api-key
supabase secrets set FROM_EMAIL=noreply@agentbio.net
supabase secrets set AGENT_EMAIL=agent@example.com
```

## Database Setup

Run this SQL in your Supabase SQL editor to create required tables:

```sql
-- Create push_tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_info JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_tokens(is_active);

-- Enable Row Level Security
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/modify their own tokens
CREATE POLICY "Users can manage their own push tokens"
  ON push_tokens
  FOR ALL
  USING (auth.uid() = user_id);

-- Create leads table (if not exists)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  type TEXT NOT NULL,
  data JSONB,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for leads
CREATE INDEX IF NOT EXISTS idx_leads_agent_id ON leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Enable Row Level Security for leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: Agents can see their own leads
CREATE POLICY "Agents can view their own leads"
  ON leads
  FOR SELECT
  USING (auth.uid() = agent_id);

-- Policy: Service role can insert leads (for public forms)
CREATE POLICY "Service role can insert leads"
  ON leads
  FOR INSERT
  WITH CHECK (true);
```

## Testing Locally

Start local Supabase:
```bash
supabase start
```

Serve functions locally:
```bash
supabase functions serve
```

Test a function:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/submit-contact' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"name":"Test User","email":"test@example.com","message":"Test message"}'
```

## Frontend Integration

Update your frontend API URLs to point to your Edge Functions:

```typescript
// src/lib/constants.ts
export const API_URL = 'https://your-project-ref.supabase.co/functions/v1'

// Example usage in push-notifications.ts
const response = await fetch(`${API_URL}/register-push-token`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  },
  body: JSON.stringify({ token, userId, device }),
})
```

## Monitoring

View function logs:
```bash
supabase functions logs register-push-token
```

View all function logs:
```bash
supabase functions logs
```

## Troubleshooting

### CORS Issues
All functions include CORS headers by default. If you still have issues, check:
- Your frontend URL is correct
- Authorization header is being sent
- Preflight OPTIONS requests are handled

### Authentication Issues
Edge Functions automatically validate JWT tokens from the Authorization header.
Make sure you're sending: `Authorization: Bearer <supabase-jwt-token>`

### Database Issues
- Check your RLS policies
- Ensure tables exist
- Verify the service role key has proper permissions

## Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Deploy Docs](https://deno.com/deploy/docs)
- [Edge Function Examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions)
