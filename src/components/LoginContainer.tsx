import { ReactNode } from "react";
import loginBg from "../assets/images/login-bg.png";
import FloatingContactButtons from "./FloatingContactButtons";
import { FaAndroid } from "react-icons/fa";
const apkFile = "/src/assets/android-apps/glory-pos.apk";

interface LoginContainerProps {
  children: ReactNode;
}

const LoginContainer: React.FC<LoginContainerProps> = ({ children }) => {
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

      {/* APK Download Badge - Attractive floating position */}
      <div className="fixed bottom-6 left-6 z-50 group">
        <a
          href={apkFile}
          download="glorypos.apk"
          className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 p-2 pr-5 rounded-full text-white hover:bg-white/20 transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95"
        >
          <div className="bg-[#3DDC84] p-2.5 rounded-full shadow-[0_0_15px_rgba(61,220,132,0.5)] group-hover:rotate-12 transition-transform">
            <FaAndroid className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold opacity-70 uppercase tracking-tighter leading-none">
              Get the App
            </span>
            <span className="text-xs font-black tracking-tight">
              Download APK
            </span>
          </div>
        </a>

        {/* Subtle tooltip style pulse for discovery */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#3DDC84] rounded-full animate-pulse border-2 border-white/20" />
      </div>
    </div>
  );
};

export default LoginContainer;
