import React from "react";

const LockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12.667 7.333H3.333A1.333 1.333 0 002 8.667v4A1.333 1.333 0 003.333 14h9.334A1.333 1.333 0 0014 12.667v-4a1.333 1.333 0 00-1.333-1.334zM4.667 7.333V4.667a3.333 3.333 0 116.666 0v2.666"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default LockIcon;
