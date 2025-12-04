// src/pages/payroll/Payroll.tsx
import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import Modal from "@/components/Modal";
import CreateUserForm from "../users/CreateUserForm";
import HolidayForm from "./HolidayForm";
import {
  FaPlus,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaCalendarTimes,
  FaStar,
  FaHistory,
} from "react-icons/fa";
import { useQueryClient } from "@tanstack/react-query";
import ReleaseSalaryForm from "./ReleaseSalaryForm";
import AdvanceSalaryForm from "./AdvanceSalaryForm"; // Added this import

const Payroll = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReleaseSalaryModal, setShowReleaseSalaryModal] = useState(false);
  const [showAdvanceSalaryModal, setShowAdvanceSalaryModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const queryClient = useQueryClient();
  const location = useLocation();

  const navItems = [
    { name: "Payroll", path: "/payroll", icon: FaMoneyBillWave },
    {
      name: "Leave History",
      path: "/payroll/leave-history",
      icon: FaCalendarTimes,
    },
    {
      name: "Holiday History",
      path: "/payroll/holiday-history",
      icon: FaCalendarTimes,
    },
    {
      name: "Promotion History",
      path: "/payroll/promotion-history",
      icon: FaStar,
    },
    {
      name: "Salary History",
      path: "/payroll/salary-history",
      icon: FaHistory,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">
          Payroll Management
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowReleaseSalaryModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            <FaPlus className="w-4 h-4" />
            Release Salary
          </button>

          <button
            onClick={() => setShowAdvanceSalaryModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            <FaPlus className="w-4 h-4" />
            Advance Salary
          </button>

          {/* <button
            onClick={() => setShowReleaseSalaryModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            <FaPlus className="w-4 h-4" />
            Loan
          </button> */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-hover transition-colors flex items-center gap-2"
          >
            <FaPlus className="w-4 h-4" />
            Add Employee
          </button>

          <button
            onClick={() => setShowHolidayModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <FaCalendarAlt className="w-4 h-4" />
            Holidays
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Payroll Navigation">
            {navItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.path;

              return (
                <Link
                  key={tab.name}
                  to={tab.path}
                  className={`
                    group relative py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200
                    flex items-center gap-2
                    ${
                      isActive
                        ? "border-brand-primary text-brand-primary"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? "text-brand-primary"
                        : "text-gray-400 group-hover:text-gray-600"
                    }`}
                  />
                  <span>{tab.name}</span>

                  {isActive && (
                    <span className="absolute -bottom-[1px] left-0 right-0 h-0.5 bg-brand-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* CONTENT OUTLET */}
      <div className="mt-2">
        <Outlet />
      </div>

      {/* CREATE EMPLOYEE MODAL */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Employee"
      >
        <CreateUserForm
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ["childUsers"] });
            toast.success("Employee added successfully");
          }}
        />
      </Modal>

      {/* HOLIDAY MODAL */}
      <Modal
        isOpen={showHolidayModal}
        onClose={() => setShowHolidayModal(false)}
        title="Manage Holidays"
      >
        <HolidayForm
          onSuccess={() => {
            setShowHolidayModal(false);
            toast.success("Holidays updated");
          }}
        />
      </Modal>

      <Modal
        isOpen={showReleaseSalaryModal}
        onClose={() => setShowReleaseSalaryModal(false)}
        title="Release Salary"
        useInnerModal={true}
      >
        <ReleaseSalaryForm
          onSuccess={() => {
            setShowReleaseSalaryModal(false);
            toast.success("Salary released");
          }}
        />
      </Modal>

      <Modal
        isOpen={showAdvanceSalaryModal}
        onClose={() => setShowAdvanceSalaryModal(false)}
        title="Request Advance Salary"
        // useInnerModal={true}
      >
        <AdvanceSalaryForm
          onSuccess={() => {
            setShowAdvanceSalaryModal(false);
            toast.success("Advance salary requested");
          }}
        />
      </Modal>
    </div>
  );
};

export default Payroll;
