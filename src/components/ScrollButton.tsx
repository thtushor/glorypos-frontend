import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface ScrollButtonProps {
  direction: "left" | "right";
  onClick: () => void;
  className?: string;
}

const ScrollButton: React.FC<ScrollButtonProps> = ({
  direction,
  onClick,
  className = "",
}) => {
  return (
    <button
      onClick={onClick}
      className={`absolute ${
        direction === "left" ? "left-0" : "right-0"
      } z-10 h-full px-2 flex items-center justify-center bg-gradient-to-${
        direction === "left" ? "r" : "l"
      } from-white via-white to-transparent ${className}`}
    >
      {direction === "left" ? (
        <FaChevronLeft className="w-4 h-4 text-gray-600" />
      ) : (
        <FaChevronRight className="w-4 h-4 text-gray-600" />
      )}
    </button>
  );
};

export default ScrollButton;
