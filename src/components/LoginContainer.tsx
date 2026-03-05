import { ReactNode } from "react";
import loginBg from "../assets/images/login-bg.png";
import FloatingContactButtons from "./FloatingContactButtons";
import { FaAndroid } from "react-icons/fa";
import { motion } from "framer-motion";
import { useWebViewPrint } from "../hooks/useWebViewPrint";
const apkFile = "/src/assets/android-apps/glory-pos.apk";

interface LoginContainerProps {
  children: ReactNode;
}

const LoginContainer: React.FC<LoginContainerProps> = ({ children }) => {
  const { isWebView } = useWebViewPrint();

  return (
    <div className="relative min-h-screen flex">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${loginBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Optional overlay for better readability */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        {children}
      </div>

      <FloatingContactButtons />

      {/* APK Download Button - Animated & Positioned above Contact Button */}
      {!isWebView && (
        <div className="fixed bottom-[130px] right-6 z-50">
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <a
              href={apkFile}
              download="glorypos.apk"
              className="group relative flex items-center justify-center p-4 rounded-full bg-gradient-to-r from-[#3DDC84] to-[#2ebf6d] shadow-[0_4px_15px_rgba(61,220,132,0.4)] hover:shadow-[0_8px_25px_rgba(61,220,132,0.6)] transition-all duration-300"
            >
              <motion.div
                animate={{
                  rotate: [0, -15, 15, -15, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "backInOut",
                }}
              >
                <FaAndroid className="w-6 h-6 text-white" />
              </motion.div>

              {/* Tooltip */}
              <div className="absolute right-full mr-3 px-3 py-1.5 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-wider">
                Download App
              </div>

              {/* Pulse effect to match contact button style */}
              <div className="absolute inset-0 rounded-full bg-[#3DDC84] animate-ping opacity-25 pointer-events-none" />
            </a>
          </motion.div>
        </div>
      )}

      <FloatingContactButtons />
    </div>
  );
};

export default LoginContainer;
