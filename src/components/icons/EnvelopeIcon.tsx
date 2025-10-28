import React from "react";

const EnvelopeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M1.333 3.333L7.333 8L13.333 3.333M2 12.667h12A1.333 1.333 0 0015.333 11.333V4.667A1.333 1.333 0 0014 3.333H2A1.333 1.333 0 00.667 4.667v6.666A1.333 1.333 0 002 12.667z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default EnvelopeIcon;
