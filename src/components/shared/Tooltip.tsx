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
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            let top = 0;
            let left = 0;

            // Add scroll offset
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;

            switch (position) {
                case "top":
                    top = rect.top + scrollY - 10; // 10px spacing
                    left = rect.left + scrollX + rect.width / 2;
                    break;
                case "bottom":
                    top = rect.bottom + scrollY + 10;
                    left = rect.left + scrollX + rect.width / 2;
                    break;
                case "left":
                    top = rect.top + scrollY + rect.height / 2;
                    left = rect.left + scrollX - 10;
                    break;
                case "right":
                    top = rect.top + scrollY + rect.height / 2;
                    left = rect.right + scrollX + 10;
                    break;
            }

            setCoords({ top, left });
        }
    };

    const handleMouseEnter = () => {
        updatePosition();
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    // Update position on scroll or resize when visible
    useEffect(() => {
        if (isVisible) {
            window.addEventListener("scroll", updatePosition);
            window.addEventListener("resize", updatePosition);
            return () => {
                window.removeEventListener("scroll", updatePosition);
                window.removeEventListener("resize", updatePosition);
            };
        }
    }, [isVisible]);

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="inline-block"
            >
                {children}
            </div>
            {isVisible && createPortal(
                <div
                    className="fixed z-[9999] px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg pointer-events-none max-w-xs break-words"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        transform: `translate(${position === "left" ? "-100%" :
                                position === "right" ? "0" : "-50%"
                            }, ${position === "top" ? "-100%" :
                                position === "bottom" ? "0" : "-50%"
                            })`
                    }}
                >
                    {content}
                    {/* Arrow */}
                    <div
                        className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${position === "top" ? "top-[100%] left-1/2 -mt-1 -translate-x-1/2" :
                                position === "bottom" ? "bottom-[100%] left-1/2 -mb-1 -translate-x-1/2" :
                                    position === "left" ? "left-[100%] top-1/2 -ml-1 -translate-y-1/2" :
                                        "right-[100%] top-1/2 -mr-1 -translate-y-1/2"
                            }`}
                    />
                </div>,
                document.body
            )}
        </>
    );
};

export default Tooltip;
