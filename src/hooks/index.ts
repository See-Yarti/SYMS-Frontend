// ============================================
// CENTRALIZED HOOKS EXPORT
// ============================================

// Navigation Hooks
export {
  useParams,
  useNavigate,
  useLocation,
  useSearchParams,
} from './useNextNavigation';
export { default as useQueryParams } from './useQueryParams';

// Utility Hooks
export { useFilteredMenu } from './useFilteredMenu';
export { useIsMobile } from './use-mobile';

// ============================================
// GLOBAL API HOOKS - Use for all new code!
// ============================================
export { useApiGet, useApiMutate, usePaginatedGet } from './useGlobalApi';

// ============================================
// Domain-Specific Hooks (Legacy - still working)
// Import directly: import { useGetCompanies } from '@/hooks/useCompanyApi';
// ============================================
