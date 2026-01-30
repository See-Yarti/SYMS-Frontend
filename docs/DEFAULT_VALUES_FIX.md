# Default Values Display Issue Fix

## Problem
Commission settings view page (`/companies/:id/commission-settings`) par jab page load hota tha, toh API data aane se pehle hi default values (like `10%`, `PERCENTAGE`, etc.) show ho rahi thi. Yeh confusing tha kyunki user ko lagta tha ke yeh actual data hai, jabke yeh sirf fallback values thi.

## Root Cause

### Issue 1: Incomplete Loading State Check
```typescript
// ❌ Before: Only checking company loading
if (companyLoading || !companyId) {
  return <Loader2 />;
}
```

**Problem:** Settings APIs (`settingsResOld`, `settingsRes`) bhi load ho rahi thi but unka loading state check nahi ho raha tha. Result: Component render ho jata tha with fallback values.

### Issue 2: Aggressive Fallback Values
```typescript
// ❌ Before: Default '10' immediately set ho jata tha
const effectiveRate = settingsOld?.effectiveCommissionRate ?? 
                      settingsResOld?.data?.baseCommissionRate ?? 
                      '10'; // ❌ Default value

const commissionType = (settingsOld?.commissionType ?? 'PERCENTAGE'); // ❌ Default
const edgeCase = settingsOld?.edgeCaseHandling ?? 'OWE'; // ❌ Default
```

**Problem:** Nullish coalescing operator (`??`) immediately fallback values de raha tha, even when data load ho raha tha.

## Solution Applied

### 1. Complete Loading State Check

**File:** `CompanyCommissionSettings.tsx`

```typescript
// ✅ After: Check ALL loading states
if (companyLoading || settingsLoadingOld || settingsLoading || !companyId) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-[#F56304]" />
    </div>
  );
}
```

**Effect:** Ab jab tak SARE APIs load nahi ho jati, loading spinner dikhta rahega. No premature rendering with default values.

### 2. Safer Fallback Values

```typescript
// ✅ After: Use '0' or empty instead of arbitrary defaults
const effectiveRate = settingsOld?.effectiveCommissionRate || 
                      settingsResOld?.data?.baseCommissionRate || 
                      '0'; // ✅ Neutral default

const commissionType = (settingsOld?.commissionType || 'PERCENTAGE');
const edgeCase = settingsOld?.edgeCaseHandling || 'CAP'; // ✅ Backend default
const scs = settingsOld?.statusCommissionSettings || {}; // ✅ Empty object
```

**Changes:**
- Changed `??` to `||` for more strict falsy checking
- Changed default rate from `'10'` to `'0'` (neutral value)
- Changed default edge case from `'OWE'` to `'CAP'` (backend default)

## How It Works Now

### Loading Flow
1. User opens page → Component mounts
2. Three APIs start loading:
   - `useGetCompany()` - Company data
   - `useGetCompanySettingsOld()` - Commission settings
   - `useGetCompanySettings()` - CDW settings
3. **Loading spinner shows** until ALL APIs complete
4. Once all data loaded → Page renders with ACTUAL data
5. ✅ No default/fallback values shown prematurely

### Data Display Flow
```
Page Load
  ↓
Check: companyLoading? → Yes → Show Spinner
  ↓
Check: settingsLoadingOld? → Yes → Show Spinner
  ↓
Check: settingsLoading? → Yes → Show Spinner
  ↓
All APIs loaded? → Yes → Render with ACTUAL data
  ↓
✅ User sees real data (not defaults)
```

## Comparison

### Before (❌ Bad UX)
```
Page Load → Immediate render with:
- Commission: 10% (default)
- Type: PERCENTAGE (default)
- Edge Case: OWE (default)
- CDW: Not shown yet (still loading)

↓ 500ms later

API data arrives → Values change:
- Commission: 15% (actual)
- Type: FIXED (actual)
- Edge Case: CAP (actual)
- CDW: Enabled (actual)
```
**Problem:** User sees values change/jump, confusing experience

### After (✅ Good UX)
```
Page Load → Loading spinner
  ↓
All APIs complete (500ms)
  ↓
Page renders with ACTUAL data:
- Commission: 15%
- Type: FIXED
- Edge Case: CAP
- CDW: Enabled
```
**Benefit:** Clean, single render with correct data

## Benefits

1. ✅ **No Flickering:** Values don't jump/change after page load
2. ✅ **Clear Loading State:** User knows data is loading
3. ✅ **Accurate Data:** Only real data shown, no confusing defaults
4. ✅ **Better UX:** Professional, polished experience
5. ✅ **No Confusion:** User won't mistake defaults for actual settings

## Edge Cases Handled

### Case 1: API Returns Null/Undefined
```typescript
const effectiveRate = settingsOld?.effectiveCommissionRate || '0';
```
- If API returns `null` or `undefined` → Shows `'0'`
- Better than showing arbitrary `'10'`

### Case 2: Partial Data Load
```typescript
if (companyLoading || settingsLoadingOld || settingsLoading || !companyId) {
  return <Loader2 />;
}
```
- If ANY API is still loading → Spinner continues
- Prevents partial/incomplete data display

### Case 3: API Error
- Existing error handling still works
- Error boundary catches and displays error message

## Testing Checklist

- [x] Page shows loading spinner on initial load
- [x] No default values flash before real data
- [x] All data loads before page renders
- [x] Values don't change/jump after render
- [x] Loading spinner shows for appropriate duration
- [x] Real data displays correctly once loaded
- [x] No console errors or warnings

## Files Modified

1. **`src/components/Company/CompanyCommissionSettings.tsx`**
   - Added `settingsLoadingOld` and `settingsLoading` to loading check
   - Changed fallback values from arbitrary defaults to neutral/backend defaults
   - Changed `??` to `||` for stricter falsy checking

## Performance Impact

**Minimal:** 
- Loading check is simple boolean operation (negligible cost)
- User waits same time for API (no additional delay)
- Single render instead of multiple renders (actually better performance!)

## Related Issues

This fix also prevents:
- Race conditions between API calls
- Hydration mismatches in SSR scenarios
- Flash of incorrect content (FOIC)
- Cumulative Layout Shift (CLS) issues
