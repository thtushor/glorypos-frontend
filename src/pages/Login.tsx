import { useState, FormEvent, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// import LogoSvg from "@/components/icons/LogoSvg";
import EnvelopeIcon from "@/components/icons/EnvelopeIcon";
import LockIcon from "@/components/icons/LockIcon";
import InputWithIcon from "../components/InputWithIcon";
import LoginContainer from "../components/LoginContainer";
import Spinner from "@/components/Spinner";
import AlertMsg from "@/components/shared/AlertMsg";
import Logo from "@/components/Logo";
// import PhygridTestButton from "@/components/PhygridTestButton";
// import EscPosTestButton from "@/components/EscPosTestButton";
// import WebUsbPrinterButton from "@/components/WebUsbPrinterButton";
// import LegacyEncoderButton from "@/components/LegacyEncoderButton";
// import BrowserPrintButton from "@/components/BrowserPrintButton";

interface Credentials {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState<Credentials>({
    email: "",
    password: "",
  });
  const { login, isLoading, successMessage, setSuccessMessage } = useAuth();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    login(credentials.email, credentials.password);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <LoginContainer>
      <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-xl">
        {/* Logo */}
        <div className="text-center">
          <Logo className="h-[90px] w-auto mx-auto transition-transform duration-200 hover:scale-110" />
        </div>

        {/* Title */}
        <h2 className="text-center text-2xl font-medium text-gray-700">
          Sign in to ERP
        </h2>

        {successMessage.message && (
          <AlertMsg
            message={successMessage.message}
            type={successMessage?.status ? "success" : "error"}
            onClose={() => setSuccessMessage({ message: "", status: false })}
          />
        )}
        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email*
            </label>
            <InputWithIcon
              icon={EnvelopeIcon}
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="Enter your email"
              value={credentials.email}
              onChange={handleChange}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password*
            </label>
            <InputWithIcon
              icon={LockIcon}
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Enter password"
              value={credentials.password}
              onChange={handleChange}
            />
          </div>

          {/* Forgot Password Link */}
          <div className="text-sm">
            <Link
              to="/forgot-password"
              className="font-medium text-brand-primary hover:text-brand-hover"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors duration-200"
          >
            {isLoading ? <Spinner size="16px" color="#fff" /> : "Login"}
          </button>

          {/* Register Link */}
          <div className="text-center">
            <Link
              to="/register"
              className="text-sm text-gray-600 hover:text-brand-primary"
            >
              Register now for new account
            </Link>
          </div>

        </form>
      </div>

      {/* Developer Printer Tools Widget */}
      {/* <div className="fixed top-0 left-0 right-0 z-50 p-2 flex justify-center pointer-events-none">
        <div className="bg-white/90 backdrop-blur shadow-md rounded-full px-4 py-2 flex gap-2 pointer-events-auto border border-gray-200">
          <span className="text-xs font-semibold text-gray-400 flex items-center mr-2 uppercase tracking-wider">Printer Dev Tools:</span>
          <WebUsbPrinterButton className="!py-1.5 !px-3 !text-[11px]" />
          <LegacyEncoderButton className="!py-1.5 !px-3 !text-[11px]" />
          <BrowserPrintButton className="!py-1.5 !px-3 !text-[11px]" />
          <PhygridTestButton className="!py-1.5 !px-3 !text-[11px]" />
          <EscPosTestButton className="!py-1.5 !px-3 !text-[11px]" />
        </div>
      </div> */}
    </LoginContainer>
  );
};

export default Login;
