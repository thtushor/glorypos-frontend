// pages/payroll/LeaveForm.tsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import AXIOS from "@/api/network/Axios";
import { PAYROLL_LEAVE } from "@/api/api";
import InputWithIcon from "@/components/InputWithIcon";
import Spinner from "@/components/Spinner";
import { FaCalendarDay, FaNotesMedical } from "react-icons/fa";

interface LeaveFormProps {
  user: any | null;
  onSuccess: () => void;
}

const LeaveForm = ({ user, onSuccess }: LeaveFormProps) => {
  const [formData, setFormData] = useState({
    userId: user?.id || "",
    startDate: "",
    endDate: "",
    type: "sick",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => AXIOS.post(PAYROLL_LEAVE, data),
    onSuccess: () => {
      toast.success("Leave requested successfully");
      onSuccess();
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || "Failed to request leave"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId) return toast.error("User ID is missing");
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
      <InputWithIcon
        icon={<FaCalendarDay />}
        type="date"
        placeholder="Start Date"
        value={formData.startDate}
        onChange={(e) =>
          setFormData({ ...formData, startDate: e.target.value })
        }
        required
      />
      <InputWithIcon
        icon={<FaCalendarDay />}
        type="date"
        placeholder="End Date"
        value={formData.endDate}
        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
        required
      />
      <select
        value={formData.type}
        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        className="border rounded-md px-3 py-2 w-full"
        required
      >
        <option value="sick">Sick Leave</option>
        <option value="vacation">Vacation</option>
        <option value="personal">Personal</option>
      </select>
      <InputWithIcon
        icon={<FaNotesMedical />}
        type="textarea"
        placeholder="Notes (optional)"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
      />
      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full px-4 py-2 text-white bg-brand-primary rounded flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {mutation.isPending ? <Spinner /> : "Request Leave"}
      </button>
    </form>
  );
};

export default LeaveForm;
