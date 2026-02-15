import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    position?: "top" | "bottom" | "left" | "right";
}

const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = "top"
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        if (!triggerRef.current || !tooltipRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();

        const spacing = 10; // spacing between trigger and tooltip
        const padding = 10; // minimum distance from screen edge

        let top = 0;
        let left = 0;
        let arrowTop: string | number = "";
        let arrowLeft: string | number = "";
        let arrowTransform = "rotate(45deg)";

        // Calculate initial position
        switch (position) {
            case "top":
                top = triggerRect.top - tooltipRect.height - spacing;
                left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
                arrowTop = "100%";
                arrowLeft = "50%";
                arrowTransform = "rotate(45deg) translateX(-50%)"; // Center horizontally
                break;
            case "bottom":
                top = triggerRect.bottom + spacing;
                left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
                arrowTop = -4; // Half of arrow size (8px)
                arrowLeft = "50%";
                arrowTransform = "rotate(45deg) translateX(-50%)";
                break;
            case "left":
                top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
                left = triggerRect.left - tooltipRect.width - spacing;
                arrowTop = "50%";
                arrowLeft = "100%";
                arrowTransform = "rotate(45deg) translateY(-50%)";
                break;
            case "right":
                top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
                left = triggerRect.right + spacing;
                arrowTop = "50%";
                arrowLeft = -4;
                arrowTransform = "rotate(45deg) translateY(-50%)";
                break;
        }

        // Horizontal clamping (for top/bottom positions primarily, but safety for all)
        if (left < padding) {
            left = padding;
        } else if (left + tooltipRect.width > window.innerWidth - padding) {
            left = window.innerWidth - padding - tooltipRect.width;
        }

        // Vertical clamping
        if (top < padding) {
            top = padding;
        } else if (top + tooltipRect.height > window.innerHeight - padding) {
            top = window.innerHeight - padding - tooltipRect.height;
        }

        // Recalculate arrow position if tooltip shifted horizontally (for top/bottom)
        if (position === "top" || position === "bottom") {
            const triggerCenter = triggerRect.left + (triggerRect.width / 2);
            const tooltipLeft = left;
            const relativeArrowLeft = triggerCenter - tooltipLeft;

            // Clamp arrow to be within tooltip border radius
            const arrowPadding = 12; // approximate padding + border radius
            const minArrowLeft = arrowPadding;
            const maxArrowLeft = tooltipRect.width - arrowPadding;

            let finalArrowLeft = Math.max(minArrowLeft, Math.min(maxArrowLeft, relativeArrowLeft));

            arrowLeft = finalArrowLeft;
            arrowTransform = "rotate(45deg) translateX(-50%)"; // Standard rotation
        }

        // Recalculate arrow position if tooltip shifted vertically (for left/right)
        if (position === "left" || position === "right") {
            const triggerCenter = triggerRect.top + (triggerRect.height / 2);
            const tooltipTop = top;
            const relativeArrowTop = triggerCenter - tooltipTop;

            const arrowPadding = 12;
            const minArrowTop = arrowPadding;
            const maxArrowTop = tooltipRect.height - arrowPadding;

            let finalArrowTop = Math.max(minArrowTop, Math.min(maxArrowTop, relativeArrowTop));

            arrowTop = finalArrowTop;
            arrowTransform = "rotate(45deg) translateY(-50%)";
        }


        setTooltipStyle({
            top: top,
            left: left,
            transform: "none" // We are manually positioning
        });

        setArrowStyle({
            top: arrowTop,
            left: arrowLeft,
            right: "auto",
            bottom: "auto",
            transform: arrowTransform,
            position: "absolute"
        });
    };

    const handleMouseEnter = () => {
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsVisible((prev) => !prev);
    };

    // Update position on scroll or resize when visible
    useEffect(() => {
        if (isVisible) {
            updatePosition();
            window.addEventListener("scroll", updatePosition);
            window.addEventListener("resize", updatePosition);

            const handleClickOutside = (event: MouseEvent) => {
                if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
                    setIsVisible(false);
                }
            };
            document.addEventListener("click", handleClickOutside);

            return () => {
                window.removeEventListener("scroll", updatePosition);
                window.removeEventListener("resize", updatePosition);
                document.removeEventListener("click", handleClickOutside);
            };
        }
    }, [isVisible]);

    // Use layout effect to position before paint if possible, or right after render
    React.useLayoutEffect(() => {
        if (isVisible) {
            updatePosition();
        }
    }, [isVisible, content]);

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
                className="inline-block"
            >
                {children}
            </div>
            {isVisible && createPortal(
                <div
                    ref={tooltipRef}
                    className="fixed z-[9999] px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg pointer-events-none max-w-xs break-words transition-opacity duration-200"
                    style={tooltipStyle}
                >
                    {content}
                    {/* Arrow */}
                    <div
                        className="w-2 h-2 bg-gray-900"
                        style={arrowStyle}
                    />
                </div>,
                document.body
            )}
        </>
    );
};

export default Tooltip;
