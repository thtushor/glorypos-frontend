import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaInfoCircle,
} from "react-icons/fa";
import { IoClose } from "react-icons/io5";

interface AlertMsgProps {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  onClose?: () => void;
  duration?: number;
}

const alertStyles = {
  success: {
    bg: "bg-green-50",
    border: "border-green-400",
    text: "text-green-800",
    icon: FaCheckCircle,
    iconColor: "text-green-500",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-400",
    text: "text-red-800",
    icon: FaTimesCircle,
    iconColor: "text-red-500",
  },
  warning: {
    bg: "bg-yellow-50",
    border: "border-yellow-400",
    text: "text-yellow-800",
    icon: FaExclamationCircle,
    iconColor: "text-yellow-500",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-400",
    text: "text-blue-800",
    icon: FaInfoCircle,
    iconColor: "text-blue-500",
  },
};

function AlertMsg({
  message,
  type = "success",
  onClose,
  duration = 5000,
}: AlertMsgProps) {
  const [isVisible, setIsVisible] = React.useState(true);
  const style = alertStyles[type];
  const Icon = style.icon;

  React.useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`z-50 w-full ${style.bg} border ${style.border} rounded-lg shadow-lg`}
        >
          <div className="flex items-start gap-3 p-4">
            <div className={`flex-shrink-0 ${style.iconColor}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className={`flex-1 ${style.text}`}>
              <p className="text-sm font-medium">{message}</p>
            </div>
            {onClose && (
              <button
                onClick={() => {
                  setIsVisible(false);
                  onClose();
                }}
                className={`flex-shrink-0 ${style.text} hover:opacity-75 transition-opacity`}
              >
                <IoClose className="h-5 w-5" />
              </button>
            )}
          </div>
          {duration && (
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: duration / 1000, ease: "linear" }}
              className={`h-1 ${style.iconColor} rounded-b-lg opacity-75`}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AlertMsg;
