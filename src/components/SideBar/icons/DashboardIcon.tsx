// src/components/SideBar/icons/DashboardIcon.tsx
import React from 'react';

const DashboardIcon = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>((props, ref) => {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      ref={ref}
    >
      <path
        d="M5.25 1.75H2.33333C2.01117 1.75 1.75 2.01117 1.75 2.33333V6.41667C1.75 6.73883 2.01117 7 2.33333 7H5.25C5.57217 7 5.83333 6.73883 5.83333 6.41667V2.33333C5.83333 2.01117 5.57217 1.75 5.25 1.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.6665 1.75H8.74984C8.42767 1.75 8.1665 2.01117 8.1665 2.33333V4.08333C8.1665 4.4055 8.42767 4.66667 8.74984 4.66667H11.6665C11.9887 4.66667 12.2498 4.4055 12.2498 4.08333V2.33333C12.2498 2.01117 11.9887 1.75 11.6665 1.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.6665 7H8.74984C8.42767 7 8.1665 7.26117 8.1665 7.58333V11.6667C8.1665 11.9888 8.42767 12.25 8.74984 12.25H11.6665C11.9887 12.25 12.2498 11.9888 12.2498 11.6667V7.58333C12.2498 7.26117 11.9887 7 11.6665 7Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.25 9.33337H2.33333C2.01117 9.33337 1.75 9.59454 1.75 9.91671V11.6667C1.75 11.9889 2.01117 12.25 2.33333 12.25H5.25C5.57217 12.25 5.83333 11.9889 5.83333 11.6667V9.91671C5.83333 9.59454 5.57217 9.33337 5.25 9.33337Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

DashboardIcon.displayName = 'DashboardIcon';

export default DashboardIcon;