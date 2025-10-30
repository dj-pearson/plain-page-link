# 🗄️ Storage Bucket Setup Guide

## ❌ Why SQL Migration Failed

The storage bucket migration failed because **you can't create Supabase storage buckets via SQL** from the SQL Editor. Storage buckets require special permissions and must be created through:
1. Supabase Dashboard UI (easiest)
2. Supabase CLI
3. Supabase Management API

---

## ✅ Solution: Create Buckets via Dashboard

### **Step-by-Step Instructions**

#### 1. Go to Supabase Dashboard
Navigate to: https://supabase.com/dashboard

#### 2. Select Your Project
Click on your AgentBio project

#### 3. Go to Storage
- In the left sidebar, click **Storage**
- You should see the existing `avatars` bucket

#### 4. Create `listing-photos` Bucket

Click **"New bucket"** button and configure:

```
Bucket name: listing-photos
Public bucket: ✅ YES (checked)
File size limit: 10485760 (10 MB)
Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, image/heic
```

Then click **"Create bucket"**

#### 5. Create `brokerage-logos` Bucket

Click **"New bucket"** again and configure:

```
Bucket name: brokerage-logos
Public bucket: ✅ YES (checked)
File size limit: 2097152 (2 MB)
Allowed MIME types: image/jpeg, image/jpg, image/png, image/svg+xml, image/webp
```

Then click **"Create bucket"**

---

## 🔐 Setting Up RLS Policies (After Buckets Created)

Once the buckets are created, you CAN run this SQL to set up the security policies:

```sql
-- RLS policies for listing-photos bucket
CREATE POLICY "Listing photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-photos');

CREATE POLICY "Authenticated users can upload listing photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listing-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update listing photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'listing-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete listing photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'listing-photos' 
  AND auth.role() = 'authenticated'
);

-- RLS policies for brokerage-logos bucket
CREATE POLICY "Brokerage logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'brokerage-logos');

CREATE POLICY "Authenticated users can upload brokerage logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'brokerage-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update brokerage logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'brokerage-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete brokerage logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'brokerage-logos' 
  AND auth.role() = 'authenticated'
);
```

---

## ✅ Verification

After creating the buckets, verify they exist:

### In Supabase Dashboard:
- Go to **Storage** in sidebar
- You should see 3 buckets:
  - ✅ `avatars` (existing)
  - ✅ `listing-photos` (new)
  - ✅ `brokerage-logos` (new)

### Via SQL Query:
```sql
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
ORDER BY name;
```

Should return 3 rows.

---

## 🚀 Using the Buckets in Your App

### Upload Listing Photo
```typescript
const { data, error } = await supabase.storage
  .from('listing-photos')
  .upload(`${userId}/${listingId}/photo-1.jpg`, file, {
    cacheControl: '3600',
    upsert: false
  });

if (data) {
  const publicUrl = supabase.storage
    .from('listing-photos')
    .getPublicUrl(data.path).data.publicUrl;
  
  // Save publicUrl to listings.photos array in database
}
```

### Upload Brokerage Logo
```typescript
const { data, error } = await supabase.storage
  .from('brokerage-logos')
  .upload(`${userId}/logo.png`, file, {
    cacheControl: '3600',
    upsert: true // Allow overwrite
  });
```

### Get Public URL
```typescript
const { data } = supabase.storage
  .from('listing-photos')
  .getPublicUrl('path/to/image.jpg');

console.log(data.publicUrl); // Use this URL in <img src="">
```

---

## 🎯 Summary

**Instead of running the SQL migration for storage buckets:**

1. ✅ Create buckets via Supabase Dashboard UI (5 minutes)
2. ✅ Run the RLS policy SQL after buckets exist (1 minute)
3. ✅ Test upload/download in your app

**Buckets to create:**
- `listing-photos` (10MB limit, public)
- `brokerage-logos` (2MB limit, public)

The `avatars` bucket already exists from your initial setup.

---

**Done! Your storage is now ready for listing photos and brokerage logos! 📸**

