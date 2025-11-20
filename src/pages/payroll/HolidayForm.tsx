// pages/payroll/HolidayForm.tsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import AXIOS from "@/api/network/Axios";
import { PAYROLL_HOLIDAY } from "@/api/api";
import Spinner from "@/components/Spinner";
import { FaCalendarAlt, FaRegCalendarPlus, FaInfoCircle } from "react-icons/fa";

interface HolidayFormProps {
  onSuccess: () => void;
}

const HolidayForm = ({ onSuccess }: HolidayFormProps) => {
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    description: "",
  });

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => AXIOS.post(PAYROLL_HOLIDAY, data),
    onSuccess: () => {
      toast.success("Holiday added successfully!");
      setFormData({ startDate: "", endDate: "", description: "" });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to add holiday");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDate || !formData.endDate) {
      toast.error("Please select both start and end date");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-3">
          <FaRegCalendarPlus className="text-brand-primary" />
          Add New Holiday
        </h2>
        <p className="text-gray-500 mt-2">
          Define holiday period for all employees
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaCalendarAlt className="inline mr-2 text-brand-primary" />
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaCalendarAlt className="inline mr-2 text-brand-primary" />
              End Date
            </label>
            <input
              type="date"
              value={formData.endDate}
              min={formData.startDate} // prevents selecting earlier date
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaInfoCircle className="inline mr-2 text-brand-primary" />
            Holiday Name / Description
          </label>
          <input
            type="text"
            placeholder="e.g. Eid-ul-Fitr, Christmas Day, Durga Puja"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
            required
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full md:w-auto px-8 py-3 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-primary/90 transition flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? (
              <>
                <Spinner size="small" />
                Adding Holiday...
              </>
            ) : (
              <>
                <FaRegCalendarPlus />
                Add Holiday
              </>
            )}
          </button>
        </div>
      </form>

      {/* Optional: Show selected range preview */}
      {formData.startDate && formData.endDate && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-sm text-blue-800">
            Holiday Period: <strong>{formData.startDate}</strong> to{" "}
            <strong>{formData.endDate}</strong>
            {formData.startDate === formData.endDate ? " (Single Day)" : ""}
          </p>
        </div>
      )}
    </div>
  );
};

export default HolidayForm;
