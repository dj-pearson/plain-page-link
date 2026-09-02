# Edge Functions Migration Guide - Action Required

## ✅ What's Done

1. **Created Edge Functions Utility** (`src/lib/edgeFunctions.ts`)
   - Centralized functions client
   - Type-safe helpers for all functions
   - Legacy compatibility layer

2. **Added Environment Variable**
   - Ready to use `https://functions.agentbio.net`

3. **Updated 2 Files** (examples):
   - ✅ `src/hooks/useUsernameCheck.ts`
   - ✅ `src/components/forms/ContactForm.tsx`

## 📋 Files Still Needing Updates (21 remaining)

### Pattern to Follow

**BEFORE:**
```typescript
import { supabase } from "@/integrations/supabase/client";

// Inside function:
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { param1, param2 }
});

if (error) throw error;
return data;
```

**AFTER (Option 1 - Recommended):**
```typescript
import { edgeFunctions } from "@/lib/edgeFunctions";

// Inside function:
const { data, error } = await edgeFunctions.invoke('function-name', {
  body: { param1, param2 }
});

if (error) throw error;
return data;
```

**AFTER (Option 2 - Typed helpers):**
```typescript
import { EdgeFunctions } from "@/lib/edgeFunctions";

// Inside function:
const data = await EdgeFunctions.checkUsername(username);
// or
const data = await EdgeFunctions.submitLead(leadData);
// etc.
```

---

## 🔧 Quick Migration Steps

### For Each File:

1. **Add import** at the top:
   ```typescript
   import { edgeFunctions } from "@/lib/edgeFunctions";
   ```

2. **Replace** all instances:
   ```typescript
   // OLD:
   supabase.functions.invoke(
   
   // NEW:
   edgeFunctions.invoke(
   ```

3. **Keep the rest the same** - the API is compatible!

---

## 📁 Files to Update

### Hooks (19 files):
```
src/hooks/useSSO.ts
src/hooks/useSessions.ts
src/hooks/useLoginSecurity.ts
src/hooks/useMFA.ts
src/hooks/useGDPR.ts
src/hooks/useAuditLog.ts
src/hooks/useSocialMedia.ts
src/hooks/useSearchAnalytics.ts
src/hooks/useContentSuggestions.ts
src/hooks/useArticleWebhooks.ts
src/hooks/useArticles.ts
src/hooks/useAIConfiguration.ts
src/lib/usageTracking.ts
src/lib/visitorAnalytics.ts
(+ any others with supabase.functions.invoke)
```

### Components (3 files):
```
src/components/pageBuilder/blocks/ContactBlock.tsx
src/components/admin/seo/KeywordsTracker.tsx
src/components/admin/SEOManager.tsx
```

### Pages (3 files):
```
src/pages/tools/ListingDescriptionGenerator.tsx
src/pages/tools/InstagramBioAnalyzer.tsx
src/pages/onboarding/OnboardingWizardPage.tsx
src/pages/Pricing.tsx
```

---

## 🚀 Quick Find & Replace

### In VSCode:

1. **Open Find in Files** (Ctrl+Shift+F)
2. **Find:** `supabase.functions.invoke`
3. **Replace:** `edgeFunctions.invoke`
4. **Add this import** to each file:
   ```typescript
   import { edgeFunctions } from "@/lib/edgeFunctions";
   ```

### Or use PowerShell:

```powershell
# Run this in your project root
$files = Get-ChildItem -Path "src" -Filter "*.ts*" -Recurse | 
    Select-String -Pattern "supabase\.functions\.invoke" | 
    Select-Object -ExpandProperty Path -Unique

foreach ($file in $files) {
    Write-Host "Update: $file"
}
```

---

## ✅ Testing After Migration

### 1. Check TypeScript Compilation:
```bash
npm run build:check
```

### 2. Test Key Functions:
- Username check (registration/signup)
- Contact form submission
- Lead capture
- Listing description generator
- Instagram bio analyzer
- Any AI/content generation features

### 3. Monitor Console:
Look for any errors related to edge functions calls.

---

## 🎯 Priority Files (Update These First)

**High Priority** (User-facing features):
1. `src/hooks/useUsernameCheck.ts` ✅ DONE
2. `src/components/forms/ContactForm.tsx` ✅ DONE
3. `src/pages/tools/ListingDescriptionGenerator.tsx` ⏳
4. `src/pages/tools/InstagramBioAnalyzer.tsx` ⏳
5. `src/components/pageBuilder/blocks/ContactBlock.tsx` ⏳

**Medium Priority** (Admin features):
6. `src/hooks/useArticles.ts`
7. `src/components/admin/SEOManager.tsx`
8. `src/hooks/useContentSuggestions.ts`

**Low Priority** (Background/analytics):
9. `src/lib/usageTracking.ts`
10. `src/lib/visitorAnalytics.ts`
11. All others

---

## 📝 Example File Update

### Before (`src/pages/tools/ListingDescriptionGenerator.tsx`):
```typescript
import { supabase } from '@/integrations/supabase/client';

// ...

const { data, error } = await supabase.functions.invoke('generate-listing-description', {
  body: { propertyDetails: details },
});

if (error) throw error;
```

### After:
```typescript
import { edgeFunctions } from '@/lib/edgeFunctions';

// ...

const { data, error } = await edgeFunctions.invoke('generate-listing-description', {
  body: { propertyDetails: details },
});

if (error) throw error;
```

**OR use typed helper:**
```typescript
import { EdgeFunctions } from '@/lib/edgeFunctions';

// ...

const data = await EdgeFunctions.generateListingDescription(details);
```

---

## 🐛 Common Issues & Solutions

### Issue 1: TypeScript errors about edgeFunctions
**Solution:** Make sure you imported from the correct path:
```typescript
import { edgeFunctions } from "@/lib/edgeFunctions";
```

### Issue 2: Function not found errors
**Solution:** Check that the function name matches what's in your edge-functions-server.ts FUNCTIONS_MAP

### Issue 3: Auth token not being sent
**Solution:** Use `auth: true` option:
```typescript
const data = await callEdgeFunction('function-name', {
  body: {},
  auth: true // This adds the auth token
});
```

---

## 🎉 When You're Done

1. ✅ All files updated
2. ✅ TypeScript compiles without errors
3. ✅ All tests pass
4. ✅ Manual testing complete
5. ✅ Deploy to production
6. ✅ Monitor for any edge function errors

---

## 📞 Need Help?

- Check `EDGE_FUNCTIONS_MIGRATION.md` for detailed migration info
- Check `src/lib/edgeFunctions.ts` for available typed helpers
- Test edge functions directly: `https://functions.agentbio.net/health`

---

**Status:** Migration In Progress  
**Files Updated:** 2 / 23  
**Progress:** ~10%  

**Next Action:** Update the remaining files using the pattern above, starting with high-priority user-facing features.

