// components/ReleaseSalaryForm.tsx
import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { FiUser, FiCalendar, FiCheckCircle } from "react-icons/fi";
import {
  CHILD_USERS_URL,
  PAYROLL_RELEASE,
  PAYROLL_SALARY_DETAILS,
} from "@/api/api";
import AXIOS from "@/api/network/Axios";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";

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

interface SalaryDetails {
  userId: number;
  fullName: string;
  baseSalary: number;
  requiredDailyHours: number;

  // Days
  totalWorkingDays: number;
  totalWeekendDays: number;
  totalLeaveDays: number;
  totalHolidayDays: number;

  // Hours
  requiredTotalHours: number;
  workedHours: number;
  absentHours: number;
  overtimeHours: number;

  // Final
  netSalary: number;

  // Period
  startDate: string;
  endDate: string;
}

interface ReleaseSalaryFormProps {
  onSuccess?: () => void;
}

const ReleaseSalaryForm: React.FC<ReleaseSalaryFormProps> = ({ onSuccess }) => {
  const [userId, setUserId] = useState<string>("");
  // const [startDate, setStartDate] = useState<Date | undefined>();
  // const [endDate, setEndDate] = useState<Date | undefined>();
  const [month, setMonth] = useState("")
  const [salaryDetails, setSalaryDetails] = useState<SalaryDetails | null>(
    null
  );


  const {user} = useAuth();

  // Add these
  const previewRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when salaryDetails appears
  useEffect(() => {
    if (salaryDetails && previewRef.current) {
      previewRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [salaryDetails]);




  const {mutate: releaseMutation,isPending} = useMutation({
    mutationFn: (data:any)=>  AXIOS.post(PAYROLL_RELEASE, data),
    onSuccess: ()=>{
       setSalaryDetails(null);
        setUserId("");
        setMonth("");        
        onSuccess?.();
    }
  })

  const handlePay = async () => {
    if (!salaryDetails) return;

    

      releaseMutation({
        // userId: userId,
        month: month,
        shopId: user?.id
      })

   
  };


  return (
    <div className="w-full mx-auto p-2 rounded-2xl bg-white overflow-auto max-h-[500px]">
      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            Release Salary
          </h2>
          <p className="text-emerald-50 ">
            Calculate and pay salary for selected period
          </p>
        </div>

        <div className="p-4 space-y-4">
          {/* Input Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Start Date */}
            <div>
              <label htmlFor="salaryMonth" className="text-sm font-medium flex items-center text-gray-700 mb-1">
                <FiCalendar className="inline mr-1" />
                Select month
              </label>
              <input
                type="month"
                id="salaryMonth"
                value={month}
                onChange={(e) =>
                  setMonth(
                    e.target.value
                  )
                }
                className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>

          {/* Calculate Button */}
          <button
            onClick={handlePay}
            disabled={isPending}
            className={`w-full py-2 text-[14px] rounded-lg font-semibold text-white flex items-center justify-center gap-3 transition-all 
             bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg`}
          >
            {isPending ? <>Releasing Salary...</> : <>Release Salary</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReleaseSalaryForm;
