# Commission Settings Backend Validation Fix

## Issue
The frontend was sending incorrect payload structure to the backend, causing 422 validation errors:
- `splitPercentage` was being sent for `COMPLETED` status (not allowed)
- `yalaRidePercentage` was missing for `OPERATOR_FAULT` (required)

## Backend Validation Requirements

### Endpoint
`POST /company-settings/:companyId/status-commission-settings`

### DTO Structure (from backend)

#### 1. COMPLETED Status
**DTO:** `CompletedStatusSettingDto`
```typescript
{
  type: 'PERCENTAGE' | 'FIXED';
  percentageRate?: number;  // Required for PERCENTAGE
  fixedAmount?: number;     // Required for FIXED
  // splitPercentage is NOT allowed
}
```

#### 2. OPERATOR_FAULT Status
**DTO:** `OperatorFaultSettingDto`
```typescript
{
  type: 'PERCENTAGE';
  penaltyPercentage: number;      // Required
  yalaRidePercentage: number;     // Required (always 100)
}
```

#### 3. LATE_CANCEL, NO_SHOW, CUSTOMER_FAULT Status
**DTO:** `StatusCommissionSettingDto`
```typescript
{
  type: 'PERCENTAGE' | 'FIXED';
  percentageRate: number;         // Required for both types
  fixedAmount?: number;           // Required for FIXED
  splitPercentage?: number;       // Required for PERCENTAGE
}
```

## Changes Made

### 1. Updated Types (`src/types/company.ts`)
Added detailed comments to `StatusCommissionSetting` interface explaining field usage:
```typescript
export interface StatusCommissionSetting {
  type: 'PERCENTAGE' | 'FIXED' | null;
  percentageRate?: number;
  fixedAmount?: number;
  splitPercentage?: number;       // Only for LATE_CANCEL, NO_SHOW, CUSTOMER_FAULT when type is PERCENTAGE
  penaltyPercentage?: number;     // Only for OPERATOR_FAULT
  yalaRidePercentage?: number;    // Only for OPERATOR_FAULT (always 100)
}
```

### 2. Fixed Payload Generation (`CompanyCommissionSettingsEdit.tsx`)

**Before (Incorrect):**
```typescript
COMPLETED: {
  type: commissionType,
  percentageRate: isFixedMode ? undefined : parseFloat(platformCommissionPct) || 0,
  fixedAmount: isFixedMode ? parseFloat(platformCommissionFixed) || 0 : undefined,
  splitPercentage: isFixedMode ? undefined : 100,  // ❌ NOT ALLOWED
},
OPERATOR_FAULT: {
  type: 'PERCENTAGE',
  penaltyPercentage: parseFloat(operatorFaultPct) || 15,
  // ❌ Missing yalaRidePercentage
},
```

**After (Correct):**
```typescript
COMPLETED: {
  type: commissionType,
  percentageRate: isFixedMode ? undefined : parseFloat(platformCommissionPct) || 0,
  fixedAmount: isFixedMode ? parseFloat(platformCommissionFixed) || 0 : undefined,
  // ✅ No splitPercentage
},
OPERATOR_FAULT: {
  type: 'PERCENTAGE',
  penaltyPercentage: parseFloat(operatorFaultPct) || 15,
  yalaRidePercentage: 100,  // ✅ Always 100 as per backend requirement
},
```

## Validation Rules Summary

| Status | Type | percentageRate | fixedAmount | splitPercentage | penaltyPercentage | yalaRidePercentage |
|--------|------|----------------|-------------|-----------------|-------------------|-------------------|
| COMPLETED | PERCENTAGE | ✅ Required | ❌ | ❌ NOT ALLOWED | ❌ | ❌ |
| COMPLETED | FIXED | ❌ | ✅ Required | ❌ NOT ALLOWED | ❌ | ❌ |
| OPERATOR_FAULT | PERCENTAGE | ❌ | ❌ | ❌ | ✅ Required | ✅ Required (100) |
| LATE_CANCEL | PERCENTAGE | ✅ Required | ❌ | ✅ Required | ❌ | ❌ |
| LATE_CANCEL | FIXED | ✅ Required | ✅ Required | ❌ | ❌ | ❌ |
| NO_SHOW | PERCENTAGE | ✅ Required | ❌ | ✅ Required | ❌ | ❌ |
| NO_SHOW | FIXED | ✅ Required | ✅ Required | ❌ | ❌ | ❌ |
| CUSTOMER_FAULT | PERCENTAGE | ✅ Required | ❌ | ✅ Required | ❌ | ❌ |
| CUSTOMER_FAULT | FIXED | ✅ Required | ✅ Required | ❌ | ❌ | ❌ |

## Testing

### Test Case 1: PERCENTAGE Mode
**Payload:**
```json
{
  "COMPLETED": {
    "type": "PERCENTAGE",
    "percentageRate": 10
  },
  "OPERATOR_FAULT": {
    "type": "PERCENTAGE",
    "penaltyPercentage": 15,
    "yalaRidePercentage": 100
  },
  "LATE_CANCEL": {
    "type": "PERCENTAGE",
    "percentageRate": 30,
    "splitPercentage": 10
  },
  "NO_SHOW": {
    "type": "PERCENTAGE",
    "percentageRate": 25,
    "splitPercentage": 15
  },
  "CUSTOMER_FAULT": {
    "type": "PERCENTAGE",
    "percentageRate": 20,
    "splitPercentage": 8
  }
}
```
**Expected:** ✅ 200 OK

### Test Case 2: FIXED Mode
**Payload:**
```json
{
  "COMPLETED": {
    "type": "FIXED",
    "fixedAmount": 50
  },
  "OPERATOR_FAULT": {
    "type": "PERCENTAGE",
    "penaltyPercentage": 15,
    "yalaRidePercentage": 100
  },
  "LATE_CANCEL": {
    "type": "FIXED",
    "percentageRate": 30,
    "fixedAmount": 20
  },
  "NO_SHOW": {
    "type": "FIXED",
    "percentageRate": 25,
    "fixedAmount": 25
  },
  "CUSTOMER_FAULT": {
    "type": "FIXED",
    "percentageRate": 20,
    "fixedAmount": 15
  }
}
```
**Expected:** ✅ 200 OK

### Test Case 3: Invalid - splitPercentage in COMPLETED
**Payload:**
```json
{
  "COMPLETED": {
    "type": "PERCENTAGE",
    "percentageRate": 10,
    "splitPercentage": 100
  }
}
```
**Expected:** ❌ 422 Unprocessable Content
```json
{
  "errors": [{
    "field": "splitPercentage",
    "constraints": ["property splitPercentage should not exist"]
  }]
}
```

### Test Case 4: Invalid - Missing yalaRidePercentage
**Payload:**
```json
{
  "OPERATOR_FAULT": {
    "type": "PERCENTAGE",
    "penaltyPercentage": 15
  }
}
```
**Expected:** ❌ 422 Unprocessable Content
```json
{
  "errors": [{
    "field": "yalaRidePercentage",
    "constraints": ["yalaRidePercentage must be a number conforming to the specified constraints"]
  }]
}
```

## Files Modified
1. `/src/types/company.ts` - Updated `StatusCommissionSetting` interface with detailed comments
2. `/src/components/Company/CompanyCommissionSettingsEdit.tsx` - Fixed payload generation in `handleSave()`

## Verification Checklist
- [x] COMPLETED payload does not include `splitPercentage`
- [x] OPERATOR_FAULT payload includes `yalaRidePercentage: 100`
- [x] LATE_CANCEL, NO_SHOW, CUSTOMER_FAULT include `splitPercentage` for PERCENTAGE mode
- [x] All required fields are present based on commission type
- [x] No linter errors
- [x] Types match backend DTO structure

## Notes
- `yalaRidePercentage` for OPERATOR_FAULT is always set to 100 as per backend logic
- `percentageRate` is required for both PERCENTAGE and FIXED types in cancellation statuses (LATE_CANCEL, NO_SHOW, CUSTOMER_FAULT)
- COMPLETED status has a separate DTO that explicitly excludes `splitPercentage`
