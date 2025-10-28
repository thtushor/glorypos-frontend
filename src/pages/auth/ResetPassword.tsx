import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import AXIOS from "@/api/network/Axios";
import { toast } from "react-toastify";
import { FaLock, FaSpinner } from "react-icons/fa";
import LogoSvg from "@/components/icons/LogoSvg";
import LoginContainer from "@/components/LoginContainer";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Verify token
  const {
    data: tokenValid,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["verify-reset-token", searchParams.get("token")],
    queryFn: async () => {
      const token = searchParams.get("token");
      if (!token) throw new Error("No token provided");
      const response = await AXIOS.get(`/verify-reset-token/${token}`);
      return response.data;
    },
    retry: false,
  });

  useEffect(() => {
    if (error) {
      toast.error("Invalid or expired reset token");
      setTimeout(() => navigate("/login"), 3000);
    }
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; newPassword: string }) => {
      const response = await AXIOS.post("/reset-password", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Password reset successfully!");
      setTimeout(() => navigate("/login"), 3000);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to reset password. Please try again."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = searchParams.get("token");
    if (!token) return;

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    resetPasswordMutation.mutate({
      token,
      newPassword: passwords.newPassword,
    });
  };

  if (isLoading) {
    return (
      <LoginContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="h-8 w-8 animate-spin text-brand-primary mx-auto" />
            <p className="mt-4 text-gray-600">Verifying reset token...</p>
          </div>
        </div>
      </LoginContainer>
    );
  }

  if (!tokenValid) {
    return (
      <LoginContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-gray-600">
              This password reset link is invalid or has expired.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="mt-4 text-brand-primary hover:text-brand-hover"
            >
              Back to Login
            </button>
          </div>
        </div>
      </LoginContainer>
    );
  }

  return (
    <LoginContainer>
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <LogoSvg className="h-[90px] mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
            <p className="mt-2 text-sm text-gray-600">
              Please enter your new password below.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    value={passwords.newPassword}
                    onChange={(e) =>
                      setPasswords({
                        ...passwords,
                        newPassword: e.target.value,
                      })
                    }
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={passwords.confirmPassword}
                    onChange={(e) =>
                      setPasswords({
                        ...passwords,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetPasswordMutation.isPending ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Reset Password"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </LoginContainer>
  );
};

export default ResetPassword;
