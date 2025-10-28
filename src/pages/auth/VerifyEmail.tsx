import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import AXIOS from "@/api/network/Axios";
import { toast } from "react-toastify";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import LogoSvg from "@/components/icons/LogoSvg";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<
    "verifying" | "success" | "error"
  >("verifying");

  const verifyEmailMutation = useMutation({
    mutationFn: async (data: { token: string; email: string }) => {
      const response = await AXIOS.post("/verify-email", data);
      return response.data;
    },
    onSuccess: () => {
      setVerificationStatus("success");
      toast.success("Email verified successfully!");
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    },
    onError: (error: any) => {
      setVerificationStatus("error");
      toast.error(error?.message || "Email verification failed");
    },
  });

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (token && email) {
      verifyEmailMutation.mutate({ token, email });
    } else {
      setVerificationStatus("error");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <LogoSvg className="h-[90px] mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Email Verification
          </h2>
          {verificationStatus === "verifying" && (
            <div className="space-y-4">
              <div className="animate-pulse flex justify-center">
                <div className="h-12 w-12 bg-brand-primary/20 rounded-full"></div>
              </div>
              <p className="text-gray-600">Verifying your email...</p>
            </div>
          )}
          {verificationStatus === "success" && (
            <div className="space-y-4">
              <FaCheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <div className="space-y-2">
                <p className="text-gray-600">
                  Your email has been verified successfully!
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting to login page in a few seconds...
                </p>
              </div>
            </div>
          )}
          {verificationStatus === "error" && (
            <div className="space-y-4">
              <FaTimesCircle className="h-12 w-12 text-red-500 mx-auto" />
              <div className="space-y-2">
                <p className="text-gray-600">
                  Sorry, we couldn't verify your email.
                </p>
                <p className="text-sm text-gray-500">
                  The verification link might be invalid or expired.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                >
                  Go to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
