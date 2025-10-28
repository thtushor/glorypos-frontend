import React from "react";

interface SpinnerProps {
  color?: string; // Optional prop for color
  size?: string; // Optional prop for size (e.g., "6rem", "4rem")
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  color = "#ffffff",
  size = "6rem",
  className = "",
}) => {
  return (
    <span
      className={`loader ${className}`}
      style={
        {
          "--loader-size": size,
          "--loader-color": color,
        } as React.CSSProperties
      }
    ></span>
  );
};

export default Spinner;
