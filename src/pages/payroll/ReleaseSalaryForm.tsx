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
  totalPreviousDues: number;
  previousDuesBreakdown: Array<{
    salaryMonth: string;
    netPayable: number;
    paid: number;
    due: number;
  }>;
  hasPreviousDues: boolean;
  currentMonthNetPayable: number;
  currentMonthPaidAmount: number;
  hasCurrentMonthPayments: boolean;
  currentMonthPaymentsCount: number;
  totalPayable: number;
  currentMonthRemainingDue: number;
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
    previousDues: {
      total: number;
      breakdown: Array<{
        salaryMonth: string;
        netPayable: number;
        paid: number;
        due: number;
      }>;
    };
    currentMonthPayments: {
      totalPaid: number;
      paymentsCount: number;
      hasPayments: boolean;
    };
    paymentSummary: {
      currentMonthNetPayable: number;
      previousDues: number;
      totalPayable: number;
      alreadyPaid: number;
      remainingDue: number;
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
  const [editableLeaveDeduction, setEditableLeaveDeduction] = useState<number>(0);
  const [editablePaidAmount, setEditablePaidAmount] = useState<number>(0);

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
      setEditableAdvanceDeduction(0); // Default to 0, user can adjust
      setEditableOvertime(data.overtimeAmount);
      setEditableFine(data.fineAmount);
      setEditableLeaveDeduction(data.unpaidLeaveDeductionAmount);
      setEditablePaidAmount(0); // Default to 0, user must enter amount
      // Net payable will be calculated in useEffect
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

  // Auto-calculate net payable salary when deductions/additions change
  useEffect(() => {
    if (!payrollDetails) return;

    const calculatedNetPayable =
      payrollDetails.baseSalary +
      payrollDetails.totalCommission +
      editableBonus +
      editableOvertime -
      editableLeaveDeduction -
      editableAdvanceDeduction -
      editableFine -
      (payrollDetails.loanDeduction || 0) -
      (payrollDetails.otherDeduction || 0);

    setEditableNetPayable(calculatedNetPayable);
  }, [payrollDetails, editableBonus, editableOvertime, editableLeaveDeduction, editableAdvanceDeduction, editableFine]);

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

    // Validate paid amount - can pay up to total payable (current + previous dues)
    const maxPayableAmount = payrollDetails.totalPayable;

    if (editablePaidAmount <= 0) {
      alert("Paid amount must be greater than 0");
      return;
    }

    if (editablePaidAmount > maxPayableAmount) {
      alert(`Paid amount cannot exceed total payable amount: ${money.format(maxPayableAmount)}`);
      return;
    }

    // Calculate total deductions
    const totalDeductions =
      editableLeaveDeduction +
      editableAdvanceDeduction +
      editableFine +
      (payrollDetails.loanDeduction || 0) +
      (payrollDetails.otherDeduction || 0);

    // Calculate gross salary (base + commission + bonus + overtime)
    const grossSalary =
      payrollDetails.baseSalary +
      payrollDetails.totalCommission +
      editableBonus +
      editableOvertime;

    // Calculate due amount
    const dueAmount = editableNetPayable - editablePaidAmount;

    // Format the payload according to the requested structure
    const payload = {
      userId: payrollDetails.userId,
      salaryMonth: month,
      baseSalary: payrollDetails.baseSalary,

      // Only include if values exist
      ...(editableAdvanceDeduction > 0 && { advanceAmount: editableAdvanceDeduction }),
      ...(editableBonus > 0 && { bonusAmount: editableBonus }),
      ...(editableBonusDescription && { bonusDescription: editableBonusDescription }),

      ...(payrollDetails.loanDeduction > 0 && { loanDeduction: payrollDetails.loanDeduction }),
      ...(editableFine > 0 && { fineAmount: editableFine }),
      ...(editableOvertime > 0 && { overtimeAmount: editableOvertime }),
      ...(payrollDetails.otherDeduction > 0 && { otherDeduction: payrollDetails.otherDeduction }),

      netPayableSalary: editableNetPayable,
      paidAmount: editablePaidAmount,

      shopId: user?.id,

      calculationSnapshot: {
        workingDays: payrollDetails.totalWorkingDays,
        presentDays: payrollDetails.totalWorkingDays - payrollDetails.totalUnpaidLeaveDays,
        paidLeaveDays: payrollDetails.totalPaidLeaveDays,
        unpaidLeaveDays: payrollDetails.totalUnpaidLeaveDays,
        perDaySalary: payrollDetails.baseSalary / payrollDetails.totalWorkingDays,
        unpaidLeaveDeduction: editableLeaveDeduction,

        advance: {
          totalTaken: payrollDetails.totalAdvanceTaken,
          totalRepaidBefore: payrollDetails.totalAdvanceRepaid,
          deductedThisMonth: editableAdvanceDeduction,
          remaining: payrollDetails.outstandingAdvance - editableAdvanceDeduction,
        },

        ...(payrollDetails.totalSales > 0 && {
          commission: {
            totalSales: payrollDetails.totalSales,
            commissionRate: payrollDetails.calculationSnapshot?.commissionData?.commissionRecords?.[0]?.commissionPercentage || "0%",
            commissionAmount: payrollDetails.totalCommission,
          }
        }),

        salaryBreakdown: {
          gross: grossSalary,
          totalDeductions: totalDeductions,
          netPayable: editableNetPayable,
          paid: editablePaidAmount,
          due: dueAmount,
        }
      }
    };

    // Log the formatted payload to console
    console.log("Formatted Salary Release Payload:", JSON.stringify(payload, null, 2));

    // Uncomment below to actually make the API call
    releaseMutation(payload);
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

                  {/* Payment Summary Overview */}
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 shadow-md border-2 border-purple-200">
                    <h4 className="font-bold text-gray-800 mb-4 text-lg flex items-center gap-2">
                      <FiDollarSign className="text-purple-600" />
                      Payment Summary Overview
                    </h4>

                    {/* Previous Dues Section */}
                    {payrollDetails.hasPreviousDues && payrollDetails.previousDuesBreakdown && payrollDetails.previousDuesBreakdown.length > 0 && (
                      <div className="mb-4 bg-white rounded-lg p-3 border border-orange-200">
                        <h5 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
                          <FiTrendingDown className="w-4 h-4" />
                          Previous Month(s) Outstanding Dues
                        </h5>
                        <div className="space-y-2">
                          {payrollDetails.previousDuesBreakdown.map((prevDue, index) => (
                            <div key={index} className="bg-orange-50 rounded-md p-2 border border-orange-100">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                <div>
                                  <p className="text-xs text-gray-500">Month</p>
                                  <p className="font-semibold text-gray-700">{prevDue.salaryMonth}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Net Payable</p>
                                  <p className="font-semibold text-blue-600">{money.format(prevDue.netPayable)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Paid</p>
                                  <p className="font-semibold text-green-600">{money.format(prevDue.paid)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Due</p>
                                  <p className="font-semibold text-red-600">{money.format(prevDue.due)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-orange-200">
                            <div className="flex justify-between items-center">
                              <p className="font-semibold text-gray-700">Total Previous Dues:</p>
                              <p className="text-xl font-bold text-red-600">{money.format(payrollDetails.totalPreviousDues)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Current Month Salary Section */}
                    <div className="mb-4 bg-white rounded-lg p-3 border border-blue-200">
                      <h5 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                        <FiCalendar className="w-4 h-4" />
                        Current Month Salary ({month})
                      </h5>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">Net Payable</p>
                            <p className="font-bold text-blue-600">{money.format(payrollDetails.currentMonthNetPayable)}</p>
                          </div>
                          {payrollDetails.hasCurrentMonthPayments && (
                            <>
                              <div>
                                <p className="text-xs text-gray-500">Already Paid</p>
                                <p className="font-bold text-green-600">{money.format(payrollDetails.currentMonthPaidAmount)}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-xs text-gray-500">Remaining Due (Current Month)</p>
                                <p className="font-bold text-orange-600">{money.format(payrollDetails.currentMonthRemainingDue)}</p>
                              </div>
                            </>
                          )}
                        </div>
                        {payrollDetails.hasCurrentMonthPayments && (
                          <div className="text-xs text-gray-600 bg-blue-50 rounded p-2">
                            <p>💡 {payrollDetails.currentMonthPaymentsCount} payment(s) already made for this month</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Total Payable Summary */}
                    <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 border-2 border-purple-300">
                      <h5 className="font-bold text-purple-800 mb-3 text-base">Overall Payment Summary</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <p className="text-gray-700">Current Month Net Payable:</p>
                          <p className="font-semibold text-blue-600">{money.format(payrollDetails.currentMonthNetPayable)}</p>
                        </div>
                        {payrollDetails.hasPreviousDues && (
                          <div className="flex justify-between items-center text-sm">
                            <p className="text-gray-700">Previous Dues:</p>
                            <p className="font-semibold text-red-600">+ {money.format(payrollDetails.totalPreviousDues)}</p>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-sm pt-2 border-t border-purple-300">
                          <p className="font-semibold text-gray-800">Total Payable:</p>
                          <p className="text-lg font-bold text-purple-700">{money.format(payrollDetails.totalPayable)}</p>
                        </div>
                        {payrollDetails.hasCurrentMonthPayments && (
                          <>
                            <div className="flex justify-between items-center text-sm">
                              <p className="text-gray-700">Already Paid (Current Month):</p>
                              <p className="font-semibold text-green-600">- {money.format(payrollDetails.currentMonthPaidAmount)}</p>
                            </div>
                            <div className="flex justify-between items-center text-sm pt-2 border-t border-purple-300">
                              <p className="font-bold text-gray-800">Final Remaining Due:</p>
                              <p className="text-xl font-bold text-orange-600">{money.format(payrollDetails.netPayableSalary)}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
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

              {/* Payment Overview Section */}
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-4 border-2 border-indigo-200 shadow-lg">
                <h4 className="font-bold text-indigo-900 mb-4 text-base flex items-center gap-2">
                  <FiDollarSign className="w-5 h-5" />
                  Payment Overview
                </h4>

                <div className="space-y-3">
                  {/* Previous Month Dues */}
                  {payrollDetails.hasPreviousDues && payrollDetails.previousDuesBreakdown && payrollDetails.previousDuesBreakdown.length > 0 && (
                    <div className="bg-white rounded-lg p-3 border-l-4 border-orange-400 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-orange-700 text-sm flex items-center gap-1">
                          <FiTrendingDown className="w-4 h-4" />
                          Previous Outstanding Dues
                        </h5>
                        <span className="text-lg font-bold text-orange-600">
                          {money.format(payrollDetails.totalPreviousDues)}
                        </span>
                      </div>

                      {/* Breakdown */}
                      <div className="space-y-1.5 mt-2">
                        {payrollDetails.previousDuesBreakdown.map((prevDue, index) => (
                          <div key={index} className="bg-orange-50 rounded-md p-2 text-xs">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-gray-700">{prevDue.salaryMonth}</span>
                              <span className="font-bold text-red-600">{money.format(prevDue.due)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>Net: {money.format(prevDue.netPayable)}</span>
                              <span>Paid: {money.format(prevDue.paid)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Current Month Salary */}
                  <div className="bg-white rounded-lg p-3 border-l-4 border-blue-400 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-blue-700 text-sm flex items-center gap-1">
                        <FiCalendar className="w-4 h-4" />
                        Current Month ({month})
                      </h5>
                      <span className="text-lg font-bold text-blue-600">
                        {money.format(payrollDetails.currentMonthNetPayable)}
                      </span>
                    </div>

                    {/* Show if there are existing payments */}
                    {payrollDetails.hasCurrentMonthPayments && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Already Paid:</span>
                          <span className="font-semibold text-green-600">
                            {money.format(payrollDetails.currentMonthPaidAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Remaining Due:</span>
                          <span className="font-semibold text-orange-600">
                            {money.format(payrollDetails.currentMonthRemainingDue)}
                          </span>
                        </div>
                        <div className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1 mt-1">
                          💡 {payrollDetails.currentMonthPaymentsCount} payment(s) made
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Total Payable Summary */}
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-3 text-white shadow-md">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm opacity-90">
                        <span>Current Month:</span>
                        <span className="font-semibold">{money.format(payrollDetails.currentMonthNetPayable)}</span>
                      </div>

                      {payrollDetails.hasPreviousDues && (
                        <div className="flex justify-between items-center text-sm opacity-90">
                          <span>Previous Dues:</span>
                          <span className="font-semibold">+ {money.format(payrollDetails.totalPreviousDues)}</span>
                        </div>
                      )}

                      <div className="border-t border-white/30 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-base">Total Payable:</span>
                          <span className="text-2xl font-bold">{money.format(payrollDetails.totalPayable)}</span>
                        </div>
                      </div>

                      {payrollDetails.hasCurrentMonthPayments && (
                        <>
                          <div className="flex justify-between items-center text-sm opacity-90">
                            <span>Already Paid:</span>
                            <span className="font-semibold">- {money.format(payrollDetails.currentMonthPaidAmount)}</span>
                          </div>
                          <div className="border-t border-white/30 pt-2">
                            <div className="flex justify-between items-center">
                              <span className="font-bold">Final Remaining:</span>
                              <span className="text-xl font-bold text-yellow-300">
                                {money.format(payrollDetails.netPayableSalary)}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
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

                {/* Editable: Leave Deduction */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Leave Deduction
                  </label>
                  <input
                    type="number"
                    value={editableLeaveDeduction}
                    onChange={(e) => setEditableLeaveDeduction(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  />
                </div>

                {/* Editable: Advance Deduction */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Advance Deduction
                    <span className="text-xs text-gray-500 ml-2">
                      (Outstanding: {money.format(payrollDetails.outstandingAdvance)})
                    </span>
                  </label>
                  <input
                    type="number"
                    value={editableAdvanceDeduction}
                    onChange={(e) => setEditableAdvanceDeduction(parseFloat(e.target.value) || 0)}
                    max={payrollDetails.outstandingAdvance}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>

                {/* Read-only: Net Payable (Auto-calculated) */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Net Payable Salary (Auto-calculated)
                  </label>
                  <input
                    type="text"
                    value={money.format(editableNetPayable)}
                    readOnly
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-blue-50 text-blue-700 font-bold text-lg cursor-not-allowed"
                  />
                </div>

                {/* Editable: Paid Amount */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Paid Amount
                    <span className="text-xs text-blue-600 ml-2">
                      (Max: {money.format(payrollDetails.totalPayable)})
                    </span>
                  </label>
                  <div className="space-y-2">
                    <input
                      type="number"
                      value={editablePaidAmount}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        const maxPayable = payrollDetails.totalPayable;
                        // Ensure value is between 0 and total payable
                        if (value > maxPayable) {
                          setEditablePaidAmount(maxPayable);
                        } else if (value < 0) {
                          setEditablePaidAmount(0);
                        } else {
                          setEditablePaidAmount(value);
                        }
                      }}
                      min={0}
                      max={payrollDetails.totalPayable}
                      step="0.01"
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none font-semibold"
                    />

                    {/* Quick Payment Buttons */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditablePaidAmount(editableNetPayable)}
                        className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                      >
                        Current Month Only ({money.format(editableNetPayable)})
                      </button>
                      {payrollDetails.hasPreviousDues && (
                        <button
                          type="button"
                          onClick={() => setEditablePaidAmount(payrollDetails.totalPayable)}
                          className="flex-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition"
                        >
                          Pay All ({money.format(payrollDetails.totalPayable)})
                        </button>
                      )}
                    </div>

                    {/* Payment Status Messages */}
                    {editablePaidAmount > 0 && editablePaidAmount < payrollDetails.totalPayable && (
                      <div className="text-xs space-y-1">
                        {editablePaidAmount <= editableNetPayable ? (
                          <p className="text-orange-600">
                            💰 Partial payment for current month. Remaining: {money.format(editableNetPayable - editablePaidAmount)}
                          </p>
                        ) : (
                          <>
                            <p className="text-green-600">
                              ✓ Current month fully paid ({money.format(editableNetPayable)})
                            </p>
                            <p className="text-blue-600">
                              💰 Previous dues payment: {money.format(editablePaidAmount - editableNetPayable)}
                            </p>
                            <p className="text-orange-600">
                              Remaining dues: {money.format(payrollDetails.totalPayable - editablePaidAmount)}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                    {editablePaidAmount === payrollDetails.totalPayable && editablePaidAmount > 0 && (
                      <p className="text-xs text-green-600 font-semibold">
                        ✓ Full payment (Current month + All previous dues)
                      </p>
                    )}
                    {editablePaidAmount === editableNetPayable && editablePaidAmount > 0 && !payrollDetails.hasPreviousDues && (
                      <p className="text-xs text-green-600 font-semibold">
                        ✓ Full payment for current month
                      </p>
                    )}
                  </div>
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
                    <p className="text-gray-600">Leave Deduction</p>
                    <p className="font-semibold text-red-600">-{money.format(editableLeaveDeduction)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Advance Deduction</p>
                    <p className="font-semibold text-red-600">-{money.format(editableAdvanceDeduction)}</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t-2 border-emerald-300">
                    <p className="text-gray-600">Final Net Payable</p>
                    <p className="text-2xl font-bold text-blue-600">{money.format(editableNetPayable)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Paid Amount</p>
                    <p className="text-xl font-bold text-green-600">{money.format(editablePaidAmount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Due Amount</p>
                    <p className="text-xl font-bold text-orange-600">{money.format(editableNetPayable - editablePaidAmount)}</p>
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
                  disabled={isPending || editablePaidAmount <= 0 || editablePaidAmount > payrollDetails.totalPayable}
                  className="flex-1 py-3 text-base rounded-lg font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
