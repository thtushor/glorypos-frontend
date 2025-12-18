// components/ReleaseSalaryForm.tsx
import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { FiCalendar, FiUser, FiDollarSign, FiClock, FiTrendingUp, FiTrendingDown, FiArrowRight, FiEdit3 } from "react-icons/fi";
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
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Summary, Step 2: Edit Form

  // Editable fields
  const [editableBonus, setEditableBonus] = useState<number>(0);
  const [editableBonusDescription, setEditableBonusDescription] = useState<string>("");
  const [editableNetPayable, setEditableNetPayable] = useState<number>(0);
  const [editableAdvanceDeduction, setEditableAdvanceDeduction] = useState<number>(0);
  const [editableOvertime, setEditableOvertime] = useState<number>(0);
  const [editableFine, setEditableFine] = useState<number>(0);

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

  // Fetch payroll details mutation
  const {
    mutate: fetchPayrollDetails,
    data: payrollDetails,
    isPending: isFetchingDetails,
    reset: resetPayrollDetails
  } = useMutation({
    mutationFn: async (params: { userId: number; salaryMonth: string }) => {
      const response = await AXIOS.post(PAYROLL_DETAILS, params);
      return response.data as PayrollDetails;
    },
    onSuccess: (data) => {
      // Initialize editable fields with fetched data
      setEditableBonus(data.bonusAmount);
      setEditableBonusDescription(data.bonusDescription || "");
      setEditableNetPayable(data.netPayableSalary);
      setEditableAdvanceDeduction(data.outstandingAdvance);
      setEditableOvertime(data.overtimeAmount);
      setEditableFine(data.fineAmount);
    },
  });

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
    if (!selectedUserId || !month) {
      resetPayrollDetails();
      setStep(1);
      return;
    }

    fetchPayrollDetails({
      userId: parseInt(selectedUserId),
      salaryMonth: month,
    });
  }, [selectedUserId, month]);

  const { mutate: releaseMutation, isPending } = useMutation({
    mutationFn: (data: any) => AXIOS.post(PAYROLL_RELEASE, data),
    onSuccess: () => {
      resetPayrollDetails();
      setSelectedUserId("");
      setMonth("");
      setStep(1);
      onSuccess?.();
    },
  });

  const handleNext = () => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleRelease = () => {
    if (!payrollDetails) return;

    releaseMutation({
      userId: payrollDetails.userId,
      month: month,
      shopId: user?.id,
      bonusAmount: editableBonus,
      bonusDescription: editableBonusDescription,
      netPayableSalary: editableNetPayable,
      advanceDeduction: editableAdvanceDeduction,
      overtimeAmount: editableOvertime,
      fineAmount: editableFine,
    });
  };

  const isLoading = isFetchingDetails || isPending;

  return (
    <div className="w-full mx-auto p-2 rounded-2xl bg-white">
      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-white">
          <p className="text-emerald-50">
            {step === 1 ? "Calculate and review salary details" : "Adjust salary components before release"}
          </p>
        </div>

        <div className="p-4 space-y-4">
          {/* Step 1: Selection & Summary */}
          {step === 1 && (
            <>
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

              {/* Next Button */}
              <button
                onClick={handleNext}
                disabled={isLoading || !payrollDetails}
                className={`w-full py-3 text-base rounded-lg font-semibold text-white flex items-center justify-center gap-3 transition-all 
                 ${isLoading || !payrollDetails
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg'}`}
              >
                Next: Review & Adjust <FiArrowRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Step 2: Editable Form */}
          {step === 2 && payrollDetails && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 mb-4">
                <FiEdit3 className="w-5 h-5" />
                <h3 className="text-lg font-bold">Adjust Salary Components</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Read-only: Base Salary */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Base Salary (Read-only)
                  </label>
                  <input
                    type="text"
                    value={money.format(payrollDetails.baseSalary)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                {/* Read-only: Commission */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Commission (Read-only)
                  </label>
                  <input
                    type="text"
                    value={money.format(payrollDetails.totalCommission)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                {/* Editable: Bonus Amount */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Bonus Amount
                  </label>
                  <input
                    type="number"
                    value={editableBonus}
                    onChange={(e) => setEditableBonus(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Editable: Bonus Description */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Bonus Description
                  </label>
                  <input
                    type="text"
                    value={editableBonusDescription}
                    onChange={(e) => setEditableBonusDescription(e.target.value)}
                    placeholder="e.g., Performance bonus"
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Editable: Overtime */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Overtime Amount
                  </label>
                  <input
                    type="number"
                    value={editableOvertime}
                    onChange={(e) => setEditableOvertime(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Editable: Fine */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Fine Amount
                  </label>
                  <input
                    type="number"
                    value={editableFine}
                    onChange={(e) => setEditableFine(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  />
                </div>

                {/* Editable: Advance Deduction */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Advance Deduction
                  </label>
                  <input
                    type="number"
                    value={editableAdvanceDeduction}
                    onChange={(e) => setEditableAdvanceDeduction(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>

                {/* Editable: Net Payable */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Net Payable Salary
                  </label>
                  <input
                    type="number"
                    value={editableNetPayable}
                    onChange={(e) => setEditableNetPayable(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold"
                  />
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg p-4 border-2 border-emerald-200">
                <h4 className="font-bold text-gray-800 mb-3">Final Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Employee</p>
                    <p className="font-semibold">{payrollDetails.fullName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Month</p>
                    <p className="font-semibold">{month}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Base Salary</p>
                    <p className="font-semibold">{money.format(payrollDetails.baseSalary)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Commission</p>
                    <p className="font-semibold text-green-600">{money.format(payrollDetails.totalCommission)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Bonus</p>
                    <p className="font-semibold text-green-600">{money.format(editableBonus)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Advance Deduction</p>
                    <p className="font-semibold text-red-600">-{money.format(editableAdvanceDeduction)}</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t-2 border-emerald-300">
                    <p className="text-gray-600">Final Net Payable</p>
                    <p className="text-2xl font-bold text-blue-600">{money.format(editableNetPayable)}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  disabled={isPending}
                  className="flex-1 py-3 text-base rounded-lg font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleRelease}
                  disabled={isPending}
                  className="flex-1 py-3 text-base rounded-lg font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg transition-all disabled:opacity-50"
                >
                  {isPending ? "Releasing..." : "Release Salary"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReleaseSalaryForm;
