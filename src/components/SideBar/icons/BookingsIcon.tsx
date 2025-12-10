// src/components/SideBar/icons/BookingsIcon.tsx
import React from 'react';

const BookingsIcon = React.forwardRef<
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
        d="M4.38916 0.5V3.30011"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.6108 0.5V3.30011"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.9444 1.89954H2.05556C1.19645 1.89954 0.5 2.52636 0.5 3.29959V13.1C0.5 13.8732 1.19645 14.5 2.05556 14.5H12.9444C13.8036 14.5 14.5 13.8732 14.5 13.1V3.29959C14.5 2.52636 13.8036 1.89954 12.9444 1.89954Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0.5 6.09973H14.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

BookingsIcon.displayName = 'BookingsIcon';

export default BookingsIcon;