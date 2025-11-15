// New file: pages/payroll/LeaveForm.tsx - Form for leave requests
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
    userId: user?.id,
    startDate: "",
    endDate: "",
    type: "sick",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => AXIOS.post(PAYROLL_LEAVE, data),
    onSuccess: () => {
      toast.success("Leave requested");
      onSuccess();
    },
    onError: (error: any) =>
      toast.error(error?.message || "Failed to request leave"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
      >
        <option value="sick">Sick</option>
        <option value="vacation">Vacation</option>
        <option value="personal">Personal</option>
      </select>
      <InputWithIcon
        icon={<FaNotesMedical />}
        type="text"
        placeholder="Notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
      />
      <button
        type="submit"
        disabled={mutation.isPending}
        className="px-4 py-2 text-white bg-brand-primary rounded flex items-center gap-2"
      >
        {mutation.isPending ? <Spinner /> : "Request Leave"}
      </button>
    </form>
  );
};

export default LeaveForm;
