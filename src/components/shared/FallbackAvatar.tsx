import React, { useEffect, useState } from "react";

interface FallbackAvatarProps {
  src: string | null;
  alt: string;
  className?: string;
}

const getInitials = (name: string) => {
  return name.trim().charAt(0).toUpperCase();
};

const getRandomColor = (text: string) => {
  const colors = [
    { bg: "bg-blue-100", text: "text-blue-600" },
    { bg: "bg-purple-100", text: "text-purple-600" },
    { bg: "bg-green-100", text: "text-green-600" },
    { bg: "bg-pink-100", text: "text-pink-600" },
    { bg: "bg-indigo-100", text: "text-indigo-600" },
    { bg: "bg-teal-100", text: "text-teal-600" },
  ];

  // Generate consistent color based on text
  const index = text
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
};

const FallbackAvatar: React.FC<FallbackAvatarProps> = ({
  src,
  alt,
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);
  const { bg, text } = getRandomColor(alt);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  if (!src || imageError) {
    return (
      <div
        className={`relative rounded-full flex items-center justify-center ${bg} ${className}`}
        title={alt}
      >
        <span className={`text-2xl font-semibold ${text}`}>
          {getInitials(alt)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover rounded-full ${className}`}
      onError={() => setImageError(true)}
    />
  );
};

export default FallbackAvatar;
