# CDW (Collision Damage Waiver) Implementation Guide

## Overview
This document describes the professional production-level implementation of CDW settings across the CRM application.

## Architecture

### 1. Type Definitions (`src/types/cdw.ts`)
- `CompanyCDWSettings`: Company-level CDW configuration (admin)
- `LocationCDWSettings`: Location-level CDW configuration (operator)
- `UpdateCompanyCDWPayload`: Payload for updating company CDW
- `UpdateLocationCDWPayload`: Payload for updating location CDW
- `CarClassCDWPercentage`: Per-class CDW percentage structure

### 2. API Hooks (`src/hooks/useCDWApi.ts`)

#### Company Level (Admin)
- `useGetCompanySettings(companyId)`: Fetch company settings including CDW
- `useUpdateCompanyCDWSettings(companyId)`: Update company CDW settings

#### Location Level (Operator)
- `useGetLocationCDWSettings(locationId)`: Fetch location CDW settings
- `useUpdateLocationCDWSettings(locationId)`: Update location CDW settings

#### Validation Helpers
- `validateCDWPercentage()`: Validate percentage is within admin range
- `validateCDWRange()`: Validate min < max for company settings

### 3. Pages & Components

#### Commission Settings View (`CompanyCommissionSettings.tsx`)
- **Purpose**: Display company-level commission and CDW settings
- **Features**:
  - Shows CDW enabled/disabled status
  - Displays admin CDW range (min-max)
  - Shows platform commission on CDW
  - Indicates if tax on CDW is allowed
- **Data Source**: `useGetCompanySettings()`

#### Commission Settings Edit (`CompanyCommissionSettingsEdit.tsx`)
- **Purpose**: Edit company-level commission and CDW settings (admin only)
- **Features**:
  - Toggle CDW enabled/disabled
  - Set min/max CDW percentage range
  - Set platform commission percentage
  - Validation before save
- **API Calls**: 
  - Loads: `useGetCompanySettings()`
  - Saves: `useUpdateCompanyCDWSettings()`

#### CDW Page (`src/pages/rate/CDWPage.tsx`)
- **Purpose**: Configure CDW for a specific location (operator)
- **Features**:
  - Enable/disable CDW for location
  - Choose scope: Whole Location or Per Car Class
  - Set CDW percentages (validated against admin range)
  - Choose revenue calculation method
  - Configure tax on CDW (when separate revenue method)
  - Real-time validation
  - Cancel/Save with change tracking
- **API Calls**:
  - Loads: `useGetLocationCDWSettings()`
  - Saves: `useUpdateLocationCDWSettings()`

## API Endpoints

### Company Level (Admin)
```
GET  /company-settings/:companyId
POST /company-settings/:companyId/cdw-settings
```

### Location Level (Operator)
```
GET /operator/locations/cdw-settings/:locationId
PUT /operator/locations/cdw-settings/:locationId/full
```

## Data Flow

### Company Settings Flow
1. Admin enables CDW at company level
2. Admin sets min/max percentage range (e.g., 20%-60%)
3. Admin sets platform commission on CDW
4. System automatically allows tax on CDW when CDW is enabled

### Location Settings Flow
1. Operator checks if company has CDW enabled
2. If yes, operator can enable CDW for their location
3. Operator chooses scope:
   - **Whole Location**: One percentage for all car classes
   - **Per Car Class**: Individual percentage for each car class
4. Operator sets CDW percentage(s) within admin range
5. Operator chooses revenue calculation method:
   - **Part of Rental**: CDW added to rental revenue
   - **Separate**: CDW tracked separately (enables tax option)
6. If separate revenue, operator can enable tax on CDW:
   - Choose type: Percentage or Fixed
   - Enter tax value
7. Save validates all fields and updates via API

## Validation Rules

### Company Level
- Min percentage < Max percentage
- Both percentages between 0-100
- Commission percentage between 0-100

### Location Level
- CDW percentage must be within admin min-max range
- If scope is PER_CAR_CLASS, all car classes must have a percentage
- If tax on CDW enabled, tax value is required
- Tax percentage must be 0-100
- Tax fixed amount must be positive

## Error Handling

### API Errors
- Network errors: Toast notification with retry option
- Validation errors: Toast with specific error message
- 400 errors: Display backend validation message

### UI States
- Loading: Spinner while fetching data
- Error: Error message with retry button
- No data: Appropriate empty state messages
- Disabled: When company CDW not enabled

## Features

### Change Tracking
- `hasChanges` state tracks if form has been modified
- Cancel button resets to original values
- Save button disabled when no changes

### Auto-enable Tax
- When revenue method changes to "SEPARATE", tax is auto-enabled
- Improves UX by reducing clicks

### Scope Switching
- When switching from WHOLE_LOCATION to PER_CAR_CLASS:
  - Initializes all car classes with whole location percentage
  - Prevents data loss

### Real-time Validation
- Input fields have min/max constraints
- Validation runs before save
- Clear error messages guide user

## Color Scheme
- Primary action color: `#F56304` (orange)
- Success/Active: Green
- Disabled: Gray
- Error: Red
- Info: Blue

## Testing Checklist

### Company Settings (Admin)
- [ ] Enable/disable CDW
- [ ] Set valid min/max range
- [ ] Set commission percentage
- [ ] Validate min < max
- [ ] Validate percentages 0-100
- [ ] Save successfully
- [ ] View updated settings

### Location Settings (Operator)
- [ ] View admin CDW status
- [ ] Enable CDW when admin enabled
- [ ] Cannot enable when admin disabled
- [ ] Set whole location percentage
- [ ] Set per-class percentages
- [ ] Switch between scopes
- [ ] Validate percentages within admin range
- [ ] Choose revenue method
- [ ] Enable tax on CDW (separate method only)
- [ ] Set tax percentage/fixed
- [ ] Cancel discards changes
- [ ] Save updates successfully
- [ ] Reload shows saved data

## Future Enhancements
- Bulk update for car class percentages
- CDW history/audit log
- CDW analytics dashboard
- Advanced validation rules
- Multi-location CDW copy feature
