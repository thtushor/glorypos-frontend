// components/ReleaseSalaryForm.tsx
import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { FiCalendar, FiUser, FiDollarSign, FiClock, FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import {
  PAYROLL_RELEASE,
  PAYROLL_DETAILS,
  CHILD_USERS_URL,
} from "@/api/api";
import AXIOS from "@/api/network/Axios";
import { useAuth } from "@/context/AuthContext";
import money from "@/utils/money";

interface ChildUser {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  status: "active" | "inactive";
  baseSalary: number | null;
}

interface PayrollDetails {
  userId: number;
  fullName: string;
  salaryMonth: string;
  baseSalary: number;
  totalWorkingDays: number;
  totalWeekendDays: number;
  totalHolidayDays: number;
  paidLeaveFullDays: number;
  paidLeaveHalfDays: number;
  totalPaidLeaveDays: number;
  unpaidLeaveFullDays: number;
  unpaidLeaveHalfDays: number;
  totalUnpaidLeaveDays: number;
  totalLeaveDays: number;
  grossSalary: number;
  netAttendanceSalary: number;
  unpaidLeaveDeductionAmount: number;
  bonusAmount: number;
  bonusDescription: string | null;
  overtimeAmount: number;
  outstandingAdvance: number;
  totalAdvanceRepaid: number;
  totalAdvanceTaken: number;
  currentMonthAdvance: number;
  loanDeduction: number;
  fineAmount: number;
  otherDeduction: number;
  netPayableSalary: number;
  totalSales: number;
  totalCommission: number;
  status: string;
  releaseDate: string | null;
  releasedBy: number | null;
  calculationSnapshot: {
    advanceData: {
      totalAdvanceTaken: number;
      totalAdvanceRepaid: number;
      outstandingAdvance: number;
      currentMonthAdvance: number;
      advanceRecords: Array<{
        id: number;
        amount: string;
        salaryMonth: string;
      }>;
    };
    attendanceData: {
      totalWorkingDays: number;
      totalWeekendDays: number;
      totalHolidayDays: number;
      paidLeaveFullDays: number;
      paidLeaveHalfDays: number;
      totalPaidLeaveDays: number;
      unpaidLeaveFullDays: number;
      unpaidLeaveHalfDays: number;
      totalUnpaidLeaveDays: number;
      totalLeaveDays: number;
      unpaidLeaveDeductionRatio: number;
    };
    commissionData: {
      totalSales: number;
      totalCommission: number;
      commissionRecords: Array<{
        baseAmount: string;
        commissionAmount: string;
        commissionPercentage: string;
      }>;
    };
    deductionRule: string;
  };
}

interface ReleaseSalaryFormProps {
  onSuccess?: () => void;
}

const ReleaseSalaryForm: React.FC<ReleaseSalaryFormProps> = ({ onSuccess }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [month, setMonth] = useState("");
  const [payrollDetails, setPayrollDetails] = useState<PayrollDetails | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const { user } = useAuth();
  const previewRef = useRef<HTMLDivElement>(null);

  // Fetch employees
  const { data: employeesData } = useQuery({
    queryKey: ["child-users"],
    queryFn: async () => {
      const response = await AXIOS.get(`${CHILD_USERS_URL}?page=1&pageSize=1000`);
      return response.data;
    },
  });

  const employees: ChildUser[] = employeesData?.users || [];

  // Auto-scroll when payrollDetails appears
  useEffect(() => {
    if (payrollDetails && previewRef.current) {
      previewRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [payrollDetails]);

  // Auto-fetch payroll details when employee and month are selected
  useEffect(() => {
    const fetchPayrollDetails = async () => {
      if (!selectedUserId || !month) {
        setPayrollDetails(null);
        return;
      }

      setIsFetchingDetails(true);
      try {
        const response = await AXIOS.post(PAYROLL_DETAILS, {
          userId: parseInt(selectedUserId),
          salaryMonth: month,
        });
        setPayrollDetails(response.data);
      } catch (error) {
        console.error("Error fetching payroll details:", error);
        setPayrollDetails(null);
      } finally {
        setIsFetchingDetails(false);
      }
    };

    fetchPayrollDetails();
  }, [selectedUserId, month]);

  const { mutate: releaseMutation, isPending } = useMutation({
    mutationFn: (data: any) => AXIOS.post(PAYROLL_RELEASE, data),
    onSuccess: () => {
      setPayrollDetails(null);
      setSelectedUserId("");
      setMonth("");
      onSuccess?.();
    },
  });

  const handlePay = async () => {
    if (!payrollDetails) return;

    releaseMutation({
      month: month,
      shopId: user?.id,
    });
  };

  const isLoading = isFetchingDetails || isPending;

  return (
    <div className="w-full mx-auto p-2 rounded-2xl bg-white">
      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-white">
          <p className="text-emerald-50">
            Calculate and pay salary for selected period
          </p>
        </div>

        <div className="p-4 space-y-4">
          {/* Input Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Employee Selection */}
            <div>
              <label htmlFor="employee" className="text-sm font-medium flex items-center text-gray-700 mb-1">
                <FiUser className="inline mr-1" />
                Select Employee
              </label>
              <select
                id="employee"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={isLoading}
                className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">-- Select Employee --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selection */}
            <div>
              <label htmlFor="salaryMonth" className="text-sm font-medium flex items-center text-gray-700 mb-1">
                <FiCalendar className="inline mr-1" />
                Select Month
              </label>
              <input
                type="month"
                id="salaryMonth"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                disabled={isLoading}
                className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Loading State */}
          {isFetchingDetails && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
              <span className="ml-3 text-gray-600">Fetching payroll details...</span>
            </div>
          )}

          {/* Payroll Details Preview */}
          {payrollDetails && !isFetchingDetails && (
            <div ref={previewRef} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 space-y-4 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FiDollarSign className="text-emerald-600" />
                Payroll Summary - {payrollDetails.fullName}
              </h3>

              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500">Base Salary</p>
                  <p className="text-lg font-bold text-gray-800">{money.format(payrollDetails.baseSalary)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500">Gross Salary</p>
                  <p className="text-lg font-bold text-emerald-600">{money.format(payrollDetails.grossSalary)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500">Net Payable</p>
                  <p className="text-lg font-bold text-blue-600">{money.format(payrollDetails.netPayableSalary)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className={`text-lg font-bold ${payrollDetails.status === 'PENDING' ? 'text-orange-600' : 'text-green-600'}`}>
                    {payrollDetails.status}
                  </p>
                </div>
              </div>

              {/* Attendance Details */}
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FiClock className="text-blue-600" />
                  Attendance Details
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Working Days</p>
                    <p className="font-semibold">{payrollDetails.totalWorkingDays}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Paid Leave</p>
                    <p className="font-semibold text-green-600">{payrollDetails.totalPaidLeaveDays}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Unpaid Leave</p>
                    <p className="font-semibold text-red-600">{payrollDetails.totalUnpaidLeaveDays}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Leave Deduction</p>
                    <p className="font-semibold text-red-600">{money.format(payrollDetails.unpaidLeaveDeductionAmount)}</p>
                  </div>
                </div>
              </div>

              {/* Commission & Sales */}
              {payrollDetails.totalSales > 0 && (
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FiTrendingUp className="text-green-600" />
                    Sales & Commission
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Total Sales</p>
                      <p className="font-semibold text-green-600">{money.format(payrollDetails.totalSales)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Commission Earned</p>
                      <p className="font-semibold text-green-600">{money.format(payrollDetails.totalCommission)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Advance Salary */}
              {payrollDetails.outstandingAdvance > 0 && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 text-base">
                    <FiTrendingDown className="text-red-600" />
                    Advance Salary
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Advance</p>
                      <p className="text-xl font-bold text-red-600">{money.format(payrollDetails.totalAdvanceTaken)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Outstanding Advance</p>
                      <p className="text-xl font-bold text-orange-600">{money.format(payrollDetails.outstandingAdvance)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Paid</p>
                      <p className="text-xl font-bold text-green-600">{money.format(payrollDetails.totalAdvanceRepaid)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Other Deductions */}
              {(payrollDetails.bonusAmount > 0 || payrollDetails.overtimeAmount > 0 || payrollDetails.fineAmount > 0) && (
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <h4 className="font-semibold text-gray-700 mb-2">Other Adjustments</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    {payrollDetails.bonusAmount > 0 && (
                      <div>
                        <p className="text-gray-500">Bonus</p>
                        <p className="font-semibold text-green-600">{money.format(payrollDetails.bonusAmount)}</p>
                      </div>
                    )}
                    {payrollDetails.overtimeAmount > 0 && (
                      <div>
                        <p className="text-gray-500">Overtime</p>
                        <p className="font-semibold text-green-600">{money.format(payrollDetails.overtimeAmount)}</p>
                      </div>
                    )}
                    {payrollDetails.fineAmount > 0 && (
                      <div>
                        <p className="text-gray-500">Fine</p>
                        <p className="font-semibold text-red-600">{money.format(payrollDetails.fineAmount)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Release Button */}
          <button
            onClick={handlePay}
            disabled={isLoading || !payrollDetails}
            className={`w-full py-2 text-[14px] rounded-lg font-semibold text-white flex items-center justify-center gap-3 transition-all 
             ${isLoading || !payrollDetails
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg'}`}
          >
            {isPending ? <>Releasing Salary...</> : <>Release Salary</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReleaseSalaryForm;
