// New file: pages/payroll/AttendanceForm.tsx - Form for marking/updating attendance
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import AXIOS from "@/api/network/Axios";
import {
  PAYROLL_ATTENDANCE_MULTIPLE,
  PAYROLL_ATTENDANCE_SINGLE,
} from "@/api/api";
import InputWithIcon from "@/components/InputWithIcon";
import Spinner from "@/components/Spinner";
import { FaCalendarDay, FaClock, FaUser, FaUsers } from "react-icons/fa";

interface AttendanceFormProps {
  user: any | null; // Single user or multiple
  onSuccess: () => void;
}

const AttendanceForm = ({ user, onSuccess }: AttendanceFormProps) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    userIds: user ? [user.id] : [], // For multiple
    lateMinutes: 0,
    extraMinutes: 0,
    isHalfDay: false,
    isFullAbsent: false,
    notes: "",
  });

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (data.userIds.length > 1) {
        return AXIOS.post(PAYROLL_ATTENDANCE_MULTIPLE, {
          date: data.date,
          userIds: data.userIds,
        });
      } else {
        return AXIOS.post(
          `${PAYROLL_ATTENDANCE_SINGLE}/${data.userIds[0]}`,
          data
        );
      }
    },
    onSuccess: () => {
      toast.success("Attendance updated");
      queryClient.invalidateQueries({ queryKey: ["childUsers"] }); // Refresh list if needed
      onSuccess();
    },
    onError: (error: any) =>
      toast.error(error?.message || "Failed to update attendance"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.isFullAbsent && formData.isHalfDay) {
      toast.error("Cannot set both half day and full absent");
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-[14px]">
      {/* USER HEADER — HIGHLIGHTED */}
      {user && (
        <div className="bg-gradient-to-r from-brand-primary/10 to-brand-primary/5 border border-brand-primary/30 rounded-lg p-2 mb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary/20 rounded-full flex items-center justify-center">
              <FaUser className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.fullName}</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>
        </div>
      )}
      <InputWithIcon
        label="Date"
        icon={<FaCalendarDay />}
        type="date"
        name="date"
        value={formData.date}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        required
      />

      {!user && (
        <InputWithIcon
          label="Employee IDs (comma separated)"
          icon={<FaUsers />}
          type="text"
          name="userIds"
          placeholder="1, 3, 5"
          value={formData.userIds.join(", ")}
          onChange={(e) =>
            setFormData({
              ...formData,
              userIds: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map(Number),
            })
          }
        />
      )}

      <InputWithIcon
        label="Late Minutes"
        icon={<FaClock />}
        type="number"
        name="lateMinutes"
        placeholder="0"
        value={formData.lateMinutes}
        onChange={(e) =>
          setFormData({ ...formData, lateMinutes: Number(e.target.value) })
        }
        min={0}
      />

      <InputWithIcon
        label="Extra Minutes"
        icon={<FaClock />}
        type="number"
        name="extraMinutes"
        placeholder="0"
        value={formData.extraMinutes}
        onChange={(e) =>
          setFormData({ ...formData, extraMinutes: Number(e.target.value) })
        }
        min={0}
      />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            id="isHalfDay"
            type="checkbox"
            checked={formData.isHalfDay}
            onChange={(e) =>
              setFormData({ ...formData, isHalfDay: e.target.checked })
            }
            className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
          />
          <label
            htmlFor="isHalfDay"
            className="text-sm font-medium text-gray-700"
          >
            Half Day
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isFullAbsent"
            type="checkbox"
            checked={formData.isFullAbsent}
            onChange={(e) =>
              setFormData({ ...formData, isFullAbsent: e.target.checked })
            }
            className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
          />
          <label
            htmlFor="isFullAbsent"
            className="text-sm font-medium text-gray-700"
          >
            Full Absent
          </label>
        </div>
      </div>

      <InputWithIcon
        label="Notes (Optional)"
        type="textarea"
        name="notes"
        placeholder="Add any remarks..."
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        className="resize-none"
      />

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full px-4 py-2 font-bold text-white bg-brand-primary rounded-md flex items-center justify-center gap-2 hover:bg-brand-hover disabled:opacity-70 transition"
      >
        {mutation.isPending ? (
          <>
            <Spinner size="16px" color="white" /> Saving...
          </>
        ) : (
          "Save Attendance"
        )}
      </button>
    </form>
  );
};

export default AttendanceForm;
