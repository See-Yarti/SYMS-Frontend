# Data Refresh Issue Fix

## Problem
Frontend mein data manual reload par hi show ho raha tha. Jab API call hoti thi (edit page se save), view page automatically update nahi ho raha tha. User ko manually page reload karna pad raha tha to see updated data.

## Root Cause
React Query caching mechanism ke wajah se:
1. Data fetch hone ke baad cache mein store ho jata hai
2. Jab edit page se save hota hai aur wapas view page par aate hain, React Query cached data dikhata hai
3. Query invalidation ho rahi thi but `staleTime` aur `refetchOnMount` settings properly configured nahi thi
4. Result: Stale (purana) data dikhta tha instead of fresh data

## Solution Applied

### 1. Updated Query Options in `useCDWApi.ts`

**Company Settings Query:**
```typescript
export const useGetCompanySettings = (companyId: string) => {
  return useFetchData<CompanySettingsResponse>(
    companyId ? `company-settings/${companyId}` : '',
    ['company-settings', companyId],
    { 
      enabled: !!companyId, 
      retry: 1,
      staleTime: 0,              // ✅ Always consider data stale
      refetchOnMount: true,      // ✅ Refetch when component mounts
      refetchOnWindowFocus: false, // Don't refetch on window focus
    }
  );
};
```

**Location CDW Settings Query:**
```typescript
export const useGetLocationCDWSettings = (locationId: string) => {
  return useFetchData<LocationCDWSettings>(
    locationId ? `operator/locations/cdw-settings/${locationId}` : '',
    ['location-cdw-settings', locationId],
    { 
      enabled: !!locationId, 
      retry: 1,
      staleTime: 0,              // ✅ Always consider data stale
      refetchOnMount: true,      // ✅ Refetch when component mounts
      refetchOnWindowFocus: false, // Don't refetch on window focus
    }
  );
};
```

### 2. Added Manual Invalidation in Edit Page

**File:** `CompanyCommissionSettingsEdit.tsx`

Added explicit query invalidation before navigation:
```typescript
// Save CDW settings
await updateCDWSettings.mutateAsync({
  cdwEnabled,
  ...(cdwEnabled && {
    cdwMinPercentage: parseFloat(cdwMin),
    cdwMaxPercentage: parseFloat(cdwMax),
    cdwCommissionPercentage: parseFloat(cdwCommission),
  }),
});

// ✅ Force invalidate all company settings queries
await queryClient.invalidateQueries({ queryKey: ['company-settings', companyId] });

toast.success('All settings saved successfully');
navigate(`/companies/${companyId}/commission-settings`);
```

### 3. Existing Refetch in CDWPage

CDWPage already had proper refetch implementation:
```typescript
try {
  await updateCDW.mutateAsync(payload);
  setHasChanges(false);
  refetchCDW(); // ✅ Already refetching after save
} catch (error) {
  console.error('Save CDW settings error:', error);
}
```

## How It Works Now

### Flow 1: Edit Company Settings
1. User opens edit page → Fresh data fetched (`staleTime: 0`)
2. User makes changes and saves
3. All mutations execute (commission, CDW, etc.)
4. Each mutation's `onSuccess` invalidates cache
5. Manual `queryClient.invalidateQueries()` ensures all queries invalidated
6. Navigate to view page
7. View page component mounts → `refetchOnMount: true` triggers fresh fetch
8. ✅ User sees updated data immediately

### Flow 2: Edit Location CDW
1. User opens CDW page → Fresh data fetched (`staleTime: 0`)
2. User makes changes and saves
3. Mutation executes
4. Mutation's `onSuccess` invalidates cache
5. `refetchCDW()` explicitly refetches data
6. ✅ User sees updated data immediately

### Flow 3: Navigate Between Pages
1. User navigates from view to edit and back
2. Each time component mounts → `refetchOnMount: true` triggers fetch
3. `staleTime: 0` ensures data is always considered stale
4. ✅ Fresh data fetched every time

## React Query Configuration Explained

### `staleTime: 0`
- **Purpose:** Marks data as stale immediately after fetching
- **Effect:** React Query will refetch data on next mount/focus
- **Why:** Ensures we always get fresh data from server

### `refetchOnMount: true`
- **Purpose:** Refetch query when component mounts
- **Effect:** Every time user navigates to page, fresh data is fetched
- **Why:** Ensures user sees latest data after navigation

### `refetchOnWindowFocus: false`
- **Purpose:** Don't refetch when user switches browser tabs
- **Effect:** Reduces unnecessary API calls
- **Why:** We only want fresh data on mount, not on every tab switch

### Query Invalidation
- **Purpose:** Mark specific queries as stale and trigger refetch
- **Effect:** Forces React Query to refetch data
- **Why:** Ensures data is updated after mutations

## Benefits

1. ✅ **Automatic Data Refresh:** No manual page reload needed
2. ✅ **Fresh Data Guarantee:** Always shows latest data from server
3. ✅ **Better UX:** Seamless experience for users
4. ✅ **Reduced Bugs:** No stale data issues
5. ✅ **Consistent Behavior:** Same behavior across all pages

## Performance Considerations

### Potential Concern: Too Many API Calls?
**Answer:** No, because:
1. Queries only refetch on mount (not on every render)
2. React Query deduplicates simultaneous requests
3. Network requests are fast (< 200ms typically)
4. Better to have fresh data than stale data

### If Performance Becomes an Issue:
Can adjust `staleTime` to a small value (e.g., 5000ms = 5 seconds):
```typescript
staleTime: 5000, // Data fresh for 5 seconds
```

## Testing Checklist

### Company Commission Settings
- [x] Open view page → Fresh data loads
- [x] Navigate to edit page → Fresh data loads
- [x] Make changes and save
- [x] Navigate back to view page → Updated data shows immediately
- [x] No manual reload needed

### Location CDW Settings
- [x] Open CDW page → Fresh data loads
- [x] Make changes and save
- [x] Updated data shows immediately
- [x] No manual reload needed

### Navigation Flow
- [x] View → Edit → View (data refreshes each time)
- [x] Multiple saves in edit page (data stays fresh)
- [x] Browser back button works correctly

## Files Modified

1. **`src/hooks/useCDWApi.ts`**
   - Added `staleTime: 0` to both GET queries
   - Added `refetchOnMount: true` to both GET queries
   - Added `refetchOnWindowFocus: false` to both GET queries

2. **`src/components/Company/CompanyCommissionSettingsEdit.tsx`**
   - Imported `useQueryClient`
   - Added manual `queryClient.invalidateQueries()` before navigation
   - Ensures all company settings queries are invalidated

## Related Documentation
- React Query Docs: https://tanstack.com/query/latest/docs/react/guides/important-defaults
- Stale Time: https://tanstack.com/query/latest/docs/react/guides/caching
- Query Invalidation: https://tanstack.com/query/latest/docs/react/guides/query-invalidation
