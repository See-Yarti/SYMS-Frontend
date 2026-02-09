// src/components/SideBar/icons/CompaniesIcon.tsx
import React from 'react';

const CompaniesIcon = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>((props, ref) => {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      ref={ref}
    >
      <path
        d="M6.09961 7.5H8.89961"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.09961 4.38965H8.89961"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.89961 14.4992V12.1659C8.89961 11.7533 8.75211 11.3577 8.48956 11.066C8.22701 10.7742 7.87091 10.6104 7.49961 10.6104C7.12831 10.6104 6.77221 10.7742 6.50966 11.066C6.24711 11.3577 6.09961 11.7533 6.09961 12.1659V14.4992"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.3 5.94368H1.9C1.5287 5.94368 1.1726 6.10757 0.91005 6.3993C0.6475 6.69102 0.5 7.08668 0.5 7.49924V12.9437C0.5 13.3562 0.6475 13.7519 0.91005 14.0436C1.1726 14.3354 1.5287 14.4992 1.9 14.4992H13.1C13.4713 14.4992 13.8274 14.3354 14.0899 14.0436C14.3525 13.7519 14.5 13.3562 14.5 12.9437V5.16591C14.5 4.75335 14.3525 4.35769 14.0899 4.06596C13.8274 3.77424 13.4713 3.61035 13.1 3.61035H11.7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.2998 14.5V2.05556C3.2998 1.643 3.4473 1.24733 3.70986 0.955612C3.97241 0.663888 4.3285 0.5 4.6998 0.5H10.2998C10.6711 0.5 11.0272 0.663888 11.2898 0.955612C11.5523 1.24733 11.6998 1.643 11.6998 2.05556V14.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

CompaniesIcon.displayName = 'CompaniesIcon';

export default CompaniesIcon;
