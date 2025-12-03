import React, { useState, useRef, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../../styles/ProductImageSlider.css"; // Import custom CSS for thumbnails

export interface ProductImageSliderProps {
  images: string[];
  variant?: "simple" | "with-thumbnails" | "with-dots";
  showDots?: boolean;
  showThumbnails?: boolean;
  autoplay?: boolean;
  autoplaySpeed?: number;
  pauseOnHover?: boolean;
  pauseOnFocus?: boolean;
  draggable?: boolean;
  fade?: boolean;
  className?: string;
  imageClassName?: string;
  aspectRatio?: string;
  arrows?: boolean;
}

const ProductImageSlider: React.FC<ProductImageSliderProps> = ({
  images,
  variant = "simple",
  showDots = false,
  showThumbnails = false,
  autoplay = false,
  autoplaySpeed = 3000,
  pauseOnHover = true,
  pauseOnFocus = true,
  draggable = true,
  fade = false,
  className = "",
  imageClassName = "",
  aspectRatio = "aspect-square",
  arrows = false,
}) => {
  const [nav1, setNav1] = useState<Slider | null>(null);
  const [nav2, setNav2] = useState<Slider | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const slider1 = useRef<Slider>(null);
  const slider2 = useRef<Slider>(null);

  // Determine variant-based defaults
  const effectiveShowDots =
    variant === "with-dots" ? true : variant === "simple" ? showDots : false;
  const effectiveShowThumbnails =
    variant === "with-thumbnails"
      ? true
      : variant === "simple"
      ? showThumbnails
      : false;

  useEffect(() => {
    if (effectiveShowThumbnails && slider1.current && slider2.current) {
      setNav1(slider1.current);
      setNav2(slider2.current);
    }
  }, [effectiveShowThumbnails]);

  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsPaused(false);
    }
  };

  const handleFocus = () => {
    if (pauseOnFocus) {
      setIsPaused(true);
    }
  };

  const handleBlur = () => {
    if (pauseOnFocus) {
      setIsPaused(false);
    }
  };

  const mainSliderSettings = {
    ...(effectiveShowThumbnails && { asNavFor: nav2 as Slider }),
    ref: slider1 as React.Ref<Slider>,
    slidesToShow: 1,
    fade: fade,
    autoplay: autoplay && !isPaused,
    autoplaySpeed: autoplaySpeed,
    infinite: images.length > 1,
    arrows: arrows,
    dots: effectiveShowDots,
    draggable: draggable,
    swipe: draggable,
    touchMove: draggable,
    pauseOnHover: pauseOnHover,
    pauseOnFocus: pauseOnFocus,
    customPaging: (i: number) => (
      <div className="w-2 h-2 rounded-full bg-gray-300 mt-2" />
    ),
  };

  const thumbnailSliderSettings = {
    asNavFor: nav1 as Slider,
    ref: slider2 as React.Ref<Slider>,
    slidesToShow: Math.min(4, images.length),
    swipeToSlide: true,
    focusOnSelect: true,
    infinite: images.length > 4,
    arrows: false,
    dots: false,
    draggable: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(3, images.length),
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: Math.min(2, images.length),
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  if (!images || images.length === 0) {
    return (
      <div className="rounded-lg overflow-hidden shadow-md bg-gray-100 flex items-center justify-center">
        <span className="text-gray-400 text-sm">No images available</span>
      </div>
    );
  }

  // If only one image, render it directly without a slider
  if (images.length === 1) {
    return (
      <div className={`rounded-lg overflow-hidden shadow-md ${className}`}>
        <img
          src={images[0]}
          alt="Product Image"
          className={`w-full ${aspectRatio} object-cover ${imageClassName}`}
        />
      </div>
    );
  }

  return (
    <div
      className={`space-y-4 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <div className="relative">
        <Slider
          {...mainSliderSettings}
          className="rounded-lg overflow-hidden shadow-md"
        >
          {images.map((image, index) => (
            <div key={index}>
              <img
                src={image}
                alt={`Product ${index + 1}`}
                className={`w-full ${aspectRatio} object-cover ${imageClassName}`}
                draggable={false}
              />
            </div>
          ))}
        </Slider>
      </div>

      {effectiveShowThumbnails && (
        <Slider {...thumbnailSliderSettings} className="thumbnail-slider mt-4">
          {images.map((image, index) => (
            <div key={index} className="p-1">
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-16 object-cover rounded-md cursor-pointer border-2 border-transparent transition-all duration-300 hover:border-brand-primary"
                draggable={false}
              />
            </div>
          ))}
        </Slider>
      )}
    </div>
  );
};

export default ProductImageSlider;
