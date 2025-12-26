import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import AXIOS from "../api/network/Axios";
import { LOGIN_URL, PROFILE_URL } from "../api/api";
// import { getCookiesAsObject } from "@/utils/cookies";

interface User {
  email: string;
  accountType?: "super admin" | "shop";
  id?: number;
  businessName?: string;
  image?: string;
  child: {
    email: string;
    id?: number;
    permissions: string[]
  } | null;
  parentShop: any | null;
  shopType?: "normal" | "restaurant";
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => void;
  logout: () => void;
  isLoading: boolean;
  isLoadingProfile: boolean;
  successMessage: {
    message: string;
    status: boolean;
  };
  setSuccessMessage: React.Dispatch<
    React.SetStateAction<{
      message: string;
      status: boolean;
    }>
  >;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [successMessage, setSuccessMessage] = useState<{
    message: string;
    status: boolean;
  }>({
    message: "",
    status: false,
  });

  const [isInitializing, setIsInitializing] = useState(true);
  const [justLoggedIn, setJustLoggedIn] = useState(false); // Track if user just logged in
  const navigate = useNavigate();

  const userEmail = user?.child ? user?.child?.email : user?.email;

  // Get profile query - only used to refresh data from localStorage
  const {
    data: profileData,
    isLoading,
    isSuccess,
    error,
  } = useQuery({
    queryKey: [
      PROFILE_URL,
      { email: userEmail },
    ],
    queryFn: async () => {
      const email = userEmail;
      const response = await AXIOS.get(PROFILE_URL, {
        params: {
          email: email,
        },
      });

      if (!response.status) {
        navigate("/login");
      }
      return response.data;
    },
    enabled: !!(userEmail) && !justLoggedIn, // Don't fetch if user just logged in
  });


  console.log({ error })

  useEffect(() => {
    if (error) {
      console.log("navigating login....");
      setUser(null);
      console.log("navigating login.... due to error");
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [error]);

  // Update user when profile data changes (only when loading from localStorage, not after login)
  useEffect(() => {
    if (isSuccess && !justLoggedIn) {
      if (profileData) {
        console.log("setUser data from profile query", { user: profileData });
        setUser(profileData);
        localStorage.setItem("user", JSON.stringify(profileData));
      }
    }

    setIsInitializing(false);
  }, [profileData, isSuccess, justLoggedIn]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await AXIOS.post(LOGIN_URL, credentials);
      return response;
    },
    onSuccess: (response: any) => {
      if (response.status) {
        const { user, token } = response.data;
        console.log({ user, token });
        console.log("setUser data from login", { user: user });

        // Set flag to prevent profile query from overriding this data
        setJustLoggedIn(true);

        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
        document.cookie = `access_token=${token}; path=/`;
        toast.success("Login successful!");
        setSuccessMessage({
          message: "Login successful!",
          status: true,
        });
        setTimeout(() => {
          console.log("navigating to dashboard....");
          navigate("/dashboard");
          // Reset flag after navigation
          setTimeout(() => setJustLoggedIn(false), 500);
        }, 2000);
      } else {
        toast.error(response.message || "Login failed");
        setSuccessMessage({
          message: response.message || "Login failed",
          status: false,
        });
      }
    },
    onError: (error: any) => {
      console.error("Login error:", error);
      toast.error(error?.message || "Login failed");
      setSuccessMessage({
        message: error?.message || "Login failed",
        status: false,
      });
    },
  });

  const login = (email: string, password: string) => {
    loginMutation.mutate({ email, password });
  };

  const logout = () => {
    setUser(null);
    console.log("setUser data from logout", { user: null });
    localStorage.removeItem("user");
    document.cookie =
      "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    navigate("/login");
  };

  // Check local storage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      console.log("Loading user from localStorage", { user: storedUser });
      setUser(JSON.parse(storedUser));
    }
    setIsInitializing(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        successMessage,
        setSuccessMessage,
        isLoadingProfile: isLoading,
        isLoading: loginMutation.isPending || isInitializing,
      }}
    >
      {!isInitializing && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
