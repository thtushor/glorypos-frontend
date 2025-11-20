// components/ReleaseSalaryForm.tsx
import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { FiUser, FiCalendar, FiCheckCircle } from "react-icons/fi";
import {
  CHILD_USERS_URL,
  PAYROLL_RELEASE,
  PAYROLL_SALARY_DETAILS,
} from "@/api/api";
import AXIOS from "@/api/network/Axios";
import { toast } from "react-toastify";

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
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [salaryDetails, setSalaryDetails] = useState<SalaryDetails | null>(
    null
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

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

  const handleCalculate = async () => {
    if (!userId || !startDate || !endDate) {
      toast.error("Please fill all fields");
      return;
    }

    setIsCalculating(true);
    try {
      const res = await AXIOS.post(PAYROLL_SALARY_DETAILS, {
        userId: Number(userId),
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      });

      console.log(res);
      if (res.status) {
        setSalaryDetails(res.data);
        toast.success("Salary calculated successfully!");
      } else {
        toast.error("Failed to calculate salary.");
      }
    } catch (err: any) {
      toast.error("Error calculating salary");
      console.log(err);
    } finally {
      setIsCalculating(false);
    }
  };

  const handlePay = async () => {
    if (!salaryDetails) return;

    if (!userId || !startDate || !endDate) {
      toast.error("User or date range missing");
      return;
    }
    try {
      setIsPaying(true);

      // Generate human-readable month name from date range
      const start = new Date(salaryDetails.startDate);
      const end = new Date(salaryDetails.endDate);

      const monthName = format(start, "MMMM yyyy"); // "December 2025"
      const periodLabel =
        start.getMonth() === end.getMonth() &&
        start.getFullYear() === end.getFullYear()
          ? monthName
          : `${format(start, "MMM yyyy")} – ${format(end, "MMM yyyy")}`;
      const res = await AXIOS.post(PAYROLL_RELEASE, {
        userId: userId,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        details: periodLabel,
        releasedAmount: salaryDetails.netSalary,
      });

      console.log(res);
      if (res.status) {
        setSalaryDetails(null);
        setUserId("");
        setStartDate(undefined);
        setEndDate(undefined);
        onSuccess?.();
      } else {
        toast.error("Failed to release salary.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error releasing salary");
      console.log(err);
    } finally {
      setIsPaying(false);
    }
  };

  const get = <T,>(value: T | undefined | null, fallback: T): T =>
    value != null ? value : fallback;

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
            {/* Employee Select */}
            <div className="col-span-full">
              <label className="text-sm font-medium flex items-center text-gray-700 mb-1">
                <FiUser className="inline mr-1" />
                Select Employee
              </label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full  px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
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
            </div>

            {/* Start Date */}
            <div>
              <label className="text-sm font-medium flex items-center text-gray-700 mb-1">
                <FiCalendar className="inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                onChange={(e) =>
                  setStartDate(
                    e.target.value ? new Date(e.target.value) : undefined
                  )
                }
                className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="text-sm font-medium flex items-center text-gray-700 mb-1">
                <FiCalendar className="inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                onChange={(e) =>
                  setEndDate(
                    e.target.value ? new Date(e.target.value) : undefined
                  )
                }
                className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>

          {/* Calculate Button */}
          <button
            onClick={handleCalculate}
            disabled={!userId || !startDate || !endDate || isCalculating}
            className={`w-full py-2 text-[14px] rounded-lg font-semibold text-white flex items-center justify-center gap-3 transition-all ${
              userId && startDate && endDate
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {isCalculating ? <>Calculating Salary...</> : <>Calculate Salary</>}
          </button>
        </div>
      </div>

      {/* Salary Preview Card */}
      {salaryDetails && (
        <div
          ref={previewRef}
          id="salary-preview"
          className="mt-2 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-xl border-2 border-emerald-200 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 text-white">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <FiCheckCircle />
              Salary Preview - {salaryDetails.fullName}
            </h3>
            <p className="text-emerald-100">
              {format(new Date(salaryDetails.startDate), "dd MMM yyyy")} →{" "}
              {format(new Date(salaryDetails.endDate), "dd MMM yyyy")}
            </p>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {salaryDetails && (
                <>
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-md py-2 px-4 shadow">
                    <p className="text-white text-[12px] font-medium">
                      Base Salary
                    </p>
                    <p className="text-[18px] font-bold text-white">
                      ฿{get(salaryDetails.baseSalary, 0).toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-white rounded-md py-2 px-4 shadow border  border-emerald-600">
                    <p className="text-gray-600 text-[12px]">
                      Total Working Days
                    </p>
                    <p className="text-[18px] font-bold text-emerald-700">
                      {get(salaryDetails.totalWorkingDays, 0)}
                    </p>
                  </div>

                  <div className="bg-white rounded-md py-2 px-4 shadow  border  border-emerald-600">
                    <p className="text-gray-600 text-[12px]">Weekend Days</p>
                    <p className="text-[18px] font-bold text-orange-600">
                      {get(salaryDetails.totalWeekendDays, 0)}
                    </p>
                  </div>

                  <div className="bg-white rounded-md py-2 px-4 shadow  border  border-emerald-600">
                    <p className="text-gray-600 text-[12px]">Leave + Holiday</p>
                    <p className="text-[18px] font-bold text-indigo-700">
                      {get(salaryDetails.totalLeaveDays, 0)}L +{" "}
                      {get(salaryDetails.totalHolidayDays, 0)}H
                    </p>
                  </div>

                  <div className="bg-white rounded-md py-2 px-4 shadow  border  border-emerald-600">
                    <p className="text-gray-600 text-[12px]">
                      Required Daily Hours
                    </p>
                    <p className="text-[18px] font-bold text-blue-700">
                      {get(salaryDetails.requiredDailyHours, 8)}h
                    </p>
                  </div>

                  <div className="bg-white rounded-md py-2 px-4 shadow  border  border-emerald-600">
                    <p className="text-gray-600 text-[12px]">
                      Required Total Hours
                    </p>
                    <p className="text-[18px] font-bold text-blue-800">
                      {get(salaryDetails.requiredTotalHours, 0)}
                    </p>
                  </div>

                  <div className="bg-white rounded-md py-2 px-4 shadow  border  border-emerald-600">
                    <p className="text-gray-600 text-[12px]">Worked Hours</p>
                    <p className="text-[18px] font-bold text-green-700">
                      {get(salaryDetails.workedHours, 0)}
                    </p>
                  </div>

                  <div className="bg-white rounded-md py-2 px-4 shadow  border  border-emerald-600">
                    <p className="text-gray-600 text-[12px]">Absent Hours</p>
                    <p className="text-[18px] font-bold text-red-600">
                      {get(salaryDetails.absentHours, 0)}
                    </p>
                  </div>

                  <div className="bg-white rounded-md py-2 px-4 shadow  border  border-emerald-600">
                    <p className="text-gray-600 text-[12px]">Overtime</p>
                    <p className="text-[18px] font-bold text-purple-700">
                      +{get(salaryDetails.overtimeHours, 0)}h
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Final Amount & Pay Button */}
            <div className="mt-8 bg-white relative rounded-2xl p-4 shadow-lg border-2 border-emerald-300">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="bg-gradient-to-r from-emerald-600 to-teal-600  text-white font-bold text-[14px] absolute top-[-10px] rounded-full px-2">
                    Net Payable Amount
                  </p>
                  <p className="text-3xl font-bold text-emerald-600">
                    ฿{salaryDetails.netSalary.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={handlePay}
                  disabled={isPaying}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-base rounded-lg shadow-xl flex items-center gap-3 transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isPaying ? <>Processing Payment...</> : <>Pay Salary Now</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReleaseSalaryForm;
