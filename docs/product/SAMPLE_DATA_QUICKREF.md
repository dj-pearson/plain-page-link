# Sample Data System - Quick Reference

## 🚀 What It Does
Automatically generates demo content for new users:
- 4 listings, 5 leads, 4 testimonials, 6 links
- Smart duplication prevention
- Admin control panel

## 📁 Key Files

### Service
```typescript
src/lib/sample-data-service.ts
- generateSampleData(userId, options)
- checkExistingData(userId)
- deleteSampleData(userId)
```

### Admin UI
```typescript
src/components/admin/SampleDataManager.tsx
- User lookup
- Data checking
- Manual generation
```

### Integration
```typescript
src/stores/useAuthStore.ts (signUp function)
- Auto-generates on new user signup
- Runs in background
```

## 💻 Usage

### Admin Quick Add (to self)
```bash
1. Go to /admin → Sample Data tab
2. Click "Add Sample Data to My Account"
3. Done!
```

### Admin Add to User
```bash
1. Enter user email or ID
2. Click "Check User Data"
3. Select options
4. Click "Generate Sample Data"
```

### Programmatic
```typescript
import { generateSampleData } from '@/lib/sample-data-service';

await generateSampleData(userId, {
  includeListings: true,
  includeLeads: true,
  includeTestimonials: true,
  includeLinks: true,
  skipDuplicateCheck: false
});
```

## 🔍 Sample Data Contents

| Type | Count | Details |
|------|-------|---------|
| Listings | 4 | Active, Pending, Sold properties |
| Leads | 5 | New, Contacted, Qualified, Closed |
| Testimonials | 4 | All 5-star, realistic reviews |
| Links | 6 | Calendar, Valuation, Resources |

## ✅ Features

- ✅ Auto-runs on signup
- ✅ Duplicate prevention
- ✅ Admin override option
- ✅ Selective generation
- ✅ Background execution
- ✅ Error handling
- ✅ User data checking

## 🛠️ Testing

```bash
# Test signup
1. Create new account
2. Check dashboard for sample data

# Test admin panel
1. Login as admin
2. Navigate to /admin
3. Click Sample Data tab
4. Use "Add to My Account"

# Test duplication
1. Try adding twice
2. Second attempt should skip existing
```

## 📊 Database Tables

- `listings` - Property listings
- `leads` - Contact inquiries
- `testimonials` - Client reviews
- `links` - Custom action links

## ⚠️ Important Notes

- Non-blocking (signup succeeds even if fails)
- Only adds if category is empty
- Can force with `skipDuplicateCheck`
- All sample data is fake/placeholder
- Users can delete anytime

## 📚 Full Documentation

See: `SAMPLE_DATA_SYSTEM.md`
