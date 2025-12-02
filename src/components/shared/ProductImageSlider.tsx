import React, { useState, useRef, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../../styles/ProductImageSlider.css"; // Import custom CSS for thumbnails

interface ProductImageSliderProps {
  images: string[];
}

const ProductImageSlider: React.FC<ProductImageSliderProps> = ({ images }) => {
  const [nav1, setNav1] = useState<Slider | null>(null);
  const [nav2, setNav2] = useState<Slider | null>(null);
  const slider1 = useRef<Slider>(null);
  const slider2 = useRef<Slider>(null);

  useEffect(() => {
    if (slider1.current && slider2.current) {
      setNav1(slider1.current);
      setNav2(slider2.current);
    }
  }, []);

  const mainSliderSettings = {
    asNavFor: nav2 as Slider,
    ref: slider1 as React.Ref<Slider>,
    slidesToShow: 1,
    fade: true,
    autoplay: true,
    autoplaySpeed: 3000,
    infinite: true,
    arrows: false,
  };

  const thumbnailSliderSettings = {
    asNavFor: nav1 as Slider,
    ref: slider2 as React.Ref<Slider>,
    slidesToShow: 4,
    swipeToSlide: true,
    focusOnSelect: true,
    infinite: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
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
    return <div>No images available.</div>;
  }

  // If only one image, render it directly without a slider
  if (images.length === 1) {
    return (
      <div className="rounded-lg overflow-hidden shadow-md">
        <img
          src={images[0]}
          alt="Product Image"
          className="w-full aspect-square object-cover"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Slider
        {...mainSliderSettings}
        className="rounded-lg overflow-hidden shadow-md"
      >
        {images.map((image, index) => (
          <div key={index}>
            <img
              src={image}
              alt={`Product ${index + 1}`}
              className="w-full aspect-square object-cover"
            />
          </div>
        ))}
      </Slider>

      <Slider {...thumbnailSliderSettings} className="thumbnail-slider mt-4">
        {images.map((image, index) => (
          <div key={index} className="p-1">
            <img
              src={image}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-16 object-cover rounded-md cursor-pointer border-2 border-transparent transition-all duration-300 hover:border-brand-primary"
            />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default ProductImageSlider;
