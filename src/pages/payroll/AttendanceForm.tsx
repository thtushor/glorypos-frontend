// pages/payroll/AttendanceForm.tsx
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import AXIOS from "@/api/network/Axios";
import { PAYROLL_ATTENDANCE_SINGLE } from "@/api/api";
import InputWithIcon from "@/components/InputWithIcon";
import Spinner from "@/components/Spinner";
import { FaCalendarDay, FaClock, FaUser } from "react-icons/fa";
import { format } from "date-fns";

interface AttendanceFormProps {
  user: any | null;
  onSuccess: () => void;
}

const AttendanceForm = ({ user, onSuccess }: AttendanceFormProps) => {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const [formData, setFormData] = useState({
    date: today,
    lateMinutes: 0,
    extraMinutes: 0,
    isHalfDay: false,
    isFullAbsent: false,
    reason: "",
    notes: "",
  });

  const queryClient = useQueryClient();

  // === LOAD EXISTING ATTENDANCE ON OPEN ===
  useEffect(() => {
    if (user && user.attendanceType) {
      setFormData({
        date: today,
        isFullAbsent: user.attendanceType === "absent",
        isHalfDay: user.isHalfDay || false,
        reason: user.reason || "",
        notes: user.notes || "",
        lateMinutes: user.lateMinutes || 0,
        extraMinutes: user.extraMinutes || 0,
      });
    } else if (user) {
      // Reset if no attendance
      setFormData({
        date: today,
        lateMinutes: 0,
        extraMinutes: 0,
        isHalfDay: false,
        isFullAbsent: false,
        reason: "",
        notes: "",
      });
    }
  }, [user, today]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error("User is required");

      const payload: any = {
        date: data.date,
        type: data.isFullAbsent ? "absent" : "present",
        isHalfDay: data.isHalfDay && !data.isFullAbsent,
        reason: data.isFullAbsent ? data.reason : null,
        notes: data.notes || null,
        lateMinutes: data.isFullAbsent ? 0 : data.lateMinutes,
        extraMinutes: data.isFullAbsent ? 0 : data.extraMinutes,
      };

      return AXIOS.post(`${PAYROLL_ATTENDANCE_SINGLE}/${user.id}`, payload);
    },
    onSuccess: () => {
      toast.success("Attendance saved");
      queryClient.invalidateQueries({ queryKey: ["childUsers"] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to save");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.isFullAbsent && formData.isHalfDay) {
      toast.error("Cannot select both Full Absent and Half Day");
      return;
    }

    if (formData.isFullAbsent && !formData.reason.trim()) {
      toast.error("Reason is required for Full Absent");
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* USER HEADER */}
      {user && (
        <div className="bg-gradient-to-r from-brand-primary/10 to-brand-primary/5 border border-brand-primary/30 rounded-lg p-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary/20 rounded-full flex items-center justify-center">
              <FaUser className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user.fullName}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* DATE - LOCKED TO TODAY */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <FaCalendarDay className="w-4 h-4 text-brand-primary" />
          Date
        </label>
        <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700">
          {format(new Date(), "dd MMM, yyyy")} (Today)
        </div>
      </div>

      {/* ATTENDANCE TYPE */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            id="present"
            type="radio"
            name="attendanceType"
            checked={!formData.isFullAbsent}
            onChange={() => setFormData({ ...formData, isFullAbsent: false })}
            className="h-4 w-4 text-brand-primary focus:ring-brand-primary"
          />
          <label
            htmlFor="present"
            className="text-sm font-medium text-green-600"
          >
            Present
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="absent"
            type="radio"
            name="attendanceType"
            checked={formData.isFullAbsent}
            onChange={() => setFormData({ ...formData, isFullAbsent: true })}
            className="h-4 w-4 text-red-600 focus:ring-red-500"
          />
          <label htmlFor="absent" className="text-sm font-medium text-red-600">
            Absent
          </label>
        </div>
      </div>

      {/* HALF DAY (ONLY FOR PRESENT) */}
      {!formData.isFullAbsent && (
        <div className="flex items-center gap-2">
          <input
            id="isHalfDay"
            type="checkbox"
            checked={formData.isHalfDay}
            onChange={(e) =>
              setFormData({ ...formData, isHalfDay: e.target.checked })
            }
            className="h-4 w-4 text-brand-primary rounded focus:ring-brand-primary"
          />
          <label
            htmlFor="isHalfDay"
            className="text-sm font-medium text-gray-700"
          >
            Half Day
          </label>
        </div>
      )}

      {/* REASON (ONLY FOR ABSENT) */}
      {formData.isFullAbsent && (
        <InputWithIcon
          label="Reason"
          type="text"
          placeholder="e.g. Sick, Personal"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          required
        />
      )}

      {/* LATE / EXTRA (ONLY FOR PRESENT) */}
      {!formData.isFullAbsent && (
        <div className="grid grid-cols-2 gap-3">
          <InputWithIcon
            label="Late (mins)"
            icon={<FaClock />}
            type="number"
            min={0}
            placeholder="0"
            value={formData.lateMinutes}
            onChange={(e) =>
              setFormData({ ...formData, lateMinutes: Number(e.target.value) })
            }
          />
          <InputWithIcon
            label="Extra (mins)"
            icon={<FaClock />}
            type="number"
            min={0}
            placeholder="0"
            value={formData.extraMinutes}
            onChange={(e) =>
              setFormData({ ...formData, extraMinutes: Number(e.target.value) })
            }
          />
        </div>
      )}

      {/* NOTES */}
      <InputWithIcon
        label="Notes (Optional)"
        type="textarea"
        placeholder="Any remarks..."
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        className="resize-none h-20"
      />

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full px-4 py-2.5 font-bold text-white bg-brand-primary rounded-md flex items-center justify-center gap-2 hover:bg-brand-hover disabled:opacity-70 transition"
      >
        {mutation.isPending ? (
          <>
            <Spinner size="16px" color="white" /> Saving...
          </>
        ) : user?.attendanceType ? (
          "Update Attendance"
        ) : (
          "Mark Attendance"
        )}
      </button>
    </form>
  );
};

export default AttendanceForm;
