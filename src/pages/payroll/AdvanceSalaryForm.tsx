import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { PAYROLL_ADVANCE_SALERY, CHILD_USERS_URL } from "@/api/api";
import AXIOS from "@/api/network/Axios";
import { FaSpinner } from "react-icons/fa";
import { FiUser } from "react-icons/fi";

interface Parent {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  location: string;
  businessName: string;
  businessType: string;
  accountStatus: string;
  accountType: string;
}

interface ChildUser {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  status: "active" | "inactive";

  attendanceType?: "present" | "absent" | null;
  attendanceDate?: string | null;
  isHalfDay?: boolean;
  reason?: string | null;
  notes?: string | null;
  lateMinutes?: number;
  extraMinutes?: number;

  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canViewReports: boolean;
  };
  baseSalary: number | null;
  requiredDailyHours: number | null;
  createdAt: string;
  updatedAt: string;
  parentUserId: number;
  userId: number | null;
  parent: Parent;
}

interface ChildUsersResponse {
  status: boolean;
  message: string;
  users: ChildUser[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface AdvanceSalaryFormProps {
  onSuccess: () => void;
}

const AdvanceSalarySchema = z.object({
  userId: z.string().min(1, "User ID is required"), // userId will be string from select
  salaryMonth: z.string().min(1, "Salary month is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  reason: z.string().min(1, "Reason is required"),
});

type AdvanceSalaryFormData = z.infer<typeof AdvanceSalarySchema>;

const AdvanceSalaryForm = ({ onSuccess }: AdvanceSalaryFormProps) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AdvanceSalaryFormData>({
    resolver: zodResolver(AdvanceSalarySchema),
  });

  // Fetch all employees
  const { data: usersData, isLoading: loadingUsers } =
    useQuery<ChildUsersResponse>({
      queryKey: ["childUsers", "all"],
      queryFn: async () => {
        const res = await AXIOS.get(
          `${CHILD_USERS_URL}?page=1&pageSize=1000&withAttendance=true`
        );
        return res.data;
      },
    });

  const users = usersData?.users || [];

  const advanceSalaryMutation = useMutation({
    mutationFn: async (data: AdvanceSalaryFormData) => {
      // Convert userId to number before sending to API
      const payload = { ...data, userId: Number(data.userId) };
      const response = await AXIOS.post(PAYROLL_ADVANCE_SALERY, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advanceSalary"] });
      toast.success("Advance salary requested successfully!");
      onSuccess();
      reset();
    },
    onError: (error) => {
      console.error("Advance salary request failed:", error);
      toast.error(error?.message || "Failed to request advance salary.");
    },
  });

  // Form ref for validation
  const formRef = useRef<HTMLFormElement>(null);

  // Global keyboard event listener for Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if Enter is pressed and not in a textarea
      if (e.key === "Enter" && !e.shiftKey) {
        const target = e.target as HTMLElement;
        const isTextarea = target.tagName === "TEXTAREA";
        
        // If focused on textarea, allow normal Enter behavior for newlines
        if (isTextarea) return;
        
        // Prevent default to avoid form submission conflicts
        e.preventDefault();
        
        // Submit form if not currently processing
        if (!advanceSalaryMutation.isPending) {
          // Get the form element
          const form = formRef.current;
          if (form) {
            // Trigger react-hook-form submit which handles validation
            handleSubmit((data) => advanceSalaryMutation.mutate(data))();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [advanceSalaryMutation.isPending, handleSubmit]);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit((data) => advanceSalaryMutation.mutate(data))}
      className="space-y-4"
    >
      {/* Employee Select */}
      <div>
        <label className="text-sm font-medium flex items-center text-gray-700 mb-1">
          <FiUser className="inline mr-1" />
          Select Employee
        </label>
        <select
          id="userId"
          {...register("userId")}
          className="w-full  px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition"
          disabled={loadingUsers}
        >
          <option value="">
            {loadingUsers ? "Loading employees..." : "Choose an employee"}
          </option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.fullName} ({user.role})
            </option>
          ))}
        </select>
        {errors.userId && (
          <p className="text-red-500 text-xs mt-1">{errors.userId.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="salaryMonth"
          className="block text-sm font-medium text-gray-700"
        >
          Salary Month
        </label>
        <input
          type="month"
          id="salaryMonth"
          {...register("salaryMonth")}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-brand-primary focus:border-brand-primary"
        />
        {errors.salaryMonth && (
          <p className="text-red-500 text-xs mt-1">
            {errors.salaryMonth.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-gray-700"
        >
          Amount
        </label>
        <input
          type="number"
          id="amount"
          step="0.01"
          {...register("amount", { valueAsNumber: true })}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-brand-primary focus:border-brand-primary"
        />
        {errors.amount && (
          <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="reason"
          className="block text-sm font-medium text-gray-700"
        >
          Reason
        </label>
        <textarea
          id="reason"
          {...register("reason")}
          rows={3}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-brand-primary focus:border-brand-primary"
        ></textarea>
        {errors.reason && (
          <p className="text-red-500 text-xs mt-1">{errors.reason.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={advanceSalaryMutation.isPending}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {advanceSalaryMutation.isPending ? (
          <FaSpinner className="animate-spin mr-2" />
        ) : (
          "Request Advance Salary"
        )}
      </button>
    </form>
  );
};

export default AdvanceSalaryForm;
