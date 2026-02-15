import { useState } from "react";
import { FaWhatsapp, FaTelegram, FaHeadset, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const FloatingContactButtons = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const phoneNumber = "+8801934732943";

  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/${phoneNumber.replace("+", "")}`, "_blank");
  };

  const handleTelegramClick = () => {
    window.open(`https://t.me/${phoneNumber.replace("+", "")}`, "_blank");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  };

  const buttonVariants = {
    hidden: {
      opacity: 0,
      x: 50,
      scale: 0.5,
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
    exit: {
      opacity: 0,
      x: 50,
      scale: 0.5,
      transition: {
        duration: 0.2,
      },
    },
    hover: {
      scale: 1.05,
      boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
    tap: {
      scale: 0.95,
    },
  };

  const contactButtons = [
    {
      icon: <FaWhatsapp className="w-5 h-5" />,
      label: "WhatsApp",
      onClick: handleWhatsAppClick,
      bgColor: "from-green-500 to-green-600",
      hoverColor: "from-green-600 to-green-700",
    },
    {
      icon: <FaTelegram className="w-5 h-5" />,
      label: "Telegram",
      onClick: handleTelegramClick,
      bgColor: "from-blue-400 to-blue-500",
      hoverColor: "from-blue-500 to-blue-600",
    },
  ];

  return (
    <div className="fixed bottom-[55px] right-6 z-50">
      <div className="relative">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute bottom-16 right-0 space-y-3"
            >
              {contactButtons.map((button, index) => (
                <motion.button
                  key={index}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={button.onClick}
                  className={`
                    flex items-center justify-center gap-2 
                    px-4 py-2.5
                    bg-gradient-to-r ${button.bgColor}
                    hover:bg-gradient-to-r ${button.hoverColor}
                    text-white rounded-full
                    transition-all duration-200
                    w-[160px]
                    shadow-[0_4px_12px_rgba(0,0,0,0.15)]
                    hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)]
                    group
                  `}
                >
                  <motion.div
                    initial={{ rotate: 0 }}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.4 }}
                  >
                    {button.icon}
                  </motion.div>
                  <motion.span
                    className="text-sm font-medium"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                  >
                    {button.label}
                  </motion.span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            p-4 rounded-full
            transition-all duration-300
            bg-gradient-to-r
            ${isExpanded
              ? "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              : "from-brand-primary to-brand-hover hover:from-brand-hover hover:to-brand-primary"
            }
            shadow-lg hover:shadow-xl
            relative
            z-10
          `}
        >
          <motion.div
            animate={{
              rotate: isExpanded ? 90 : 0,
              scale: isExpanded ? 1.1 : 1,
            }}
            transition={{
              duration: 0.3,
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
          >
            {isExpanded ? (
              <FaTimes className="w-6 h-6 text-white" />
            ) : (
              <FaHeadset className="w-6 h-6 text-white" />
            )}
          </motion.div>
        </motion.button>

        {/* Enhanced pulse effect */}
        {!isExpanded && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-brand-primary"
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{
                scale: 1.5,
                opacity: 0,
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut",
                repeatDelay: 0.5,
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-brand-primary"
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{
                scale: 1.5,
                opacity: 0,
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.75,
                repeatDelay: 0.5,
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default FloatingContactButtons;
