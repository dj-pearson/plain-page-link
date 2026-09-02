# Admin Setup Instructions

## Grant Admin Access to Your Account

To access the admin dashboard, you need to assign the admin role to your user account.

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Click "New Query"

### Step 2: Run the Admin Role Assignment

Copy and paste this SQL command:

```sql
-- Assign admin role to pearsonperformance@gmail.com
INSERT INTO public.user_roles (user_id, role) 
VALUES ('d80ac479-7b27-4a0e-9b77-9cc70e95a089', 'admin')
ON CONFLICT DO NOTHING;
```

### Step 3: Verify Admin Access

1. Log out of your account
2. Log back in with `pearsonperformance@gmail.com`
3. You should now see an "Admin" link in the dashboard sidebar with a "ROOT" badge
4. Click on it to access the admin dashboard

## Admin Dashboard Features

Once you have admin access, you can:

### 🤖 AI Settings
- Configure AI models for content generation
- Adjust temperature and token settings
- Test AI model connectivity
- Manage available AI models

### 📱 Social Media Management
- Create property highlight posts
- Generate market update content
- Schedule social media posts
- Manage webhooks for automatic distribution

### 📝 Blog/Articles Management
- Create and manage real estate blog articles
- AI-powered content generation
- SEO optimization tools
- Article webhooks for distribution

### ⚙️ Platform Settings
- Additional platform configuration options (coming soon)

## Database Tables Created

The following tables were created for the admin functionality:

### Core Admin Tables
- `ai_configuration` - AI model settings and configuration
- `ai_models` - Available AI models and their capabilities

### Content Management Tables
- `social_media_posts` - Real estate social media content
- `social_media_webhooks` - Webhook configurations for social posts
- `articles` - Blog articles and content
- `article_comments` - Comments on blog articles
- `article_webhooks` - Webhook configurations for articles
- `content_suggestions` - AI-powered content suggestions

## Security Notes

- Admin access is strictly controlled by the `user_roles` table
- All admin operations use Row Level Security (RLS) policies
- The `has_role()` function ensures secure role checking
- Only users with the 'admin' role can access admin features

## Adding Additional Admins

To grant admin access to another user, first get their user ID:

```sql
-- Find user ID by email
SELECT id, email FROM auth.users WHERE email = 'other-admin@example.com';
```

Then assign the admin role:

```sql
-- Replace USER_ID with the actual ID from the query above
INSERT INTO public.user_roles (user_id, role) 
VALUES ('USER_ID', 'admin')
ON CONFLICT DO NOTHING;
```

## Removing Admin Access

To remove admin access from a user:

```sql
-- Replace USER_ID with the user's ID
DELETE FROM public.user_roles 
WHERE user_id = 'USER_ID' AND role = 'admin';
```

## Support

If you encounter any issues with admin setup or access, please check:

1. You're logged in with the correct email address
2. The SQL command ran successfully without errors
3. You've logged out and back in after assigning the role
4. Your browser cache is cleared

## Next Steps

After setting up admin access:

1. Configure your AI settings in the AI Settings tab
2. Set up your social media webhook integrations
3. Start creating content with AI assistance
4. Monitor your content performance

---

**Important:** Keep your admin credentials secure and only grant admin access to trusted team members.
