// New file: pages/payroll/ReleaseForm.tsx - Form for releasing salary
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import AXIOS from "@/api/network/Axios";
import { PAYROLL_RELEASE } from "@/api/api";
import InputWithIcon from "@/components/InputWithIcon";
import Spinner from "@/components/Spinner";
import { FaMoneyBillWave, FaCalendar, FaInfoCircle } from "react-icons/fa";

interface ReleaseFormProps {
  user: any | null;
  onSuccess: () => void;
}

const ReleaseForm = ({ user, onSuccess }: ReleaseFormProps) => {
  const [formData, setFormData] = useState({
    userId: user?.id,
    month: new Date().toISOString().slice(0, 7),
    releasedAmount: 0,
    details: {}, // JSON from salary details
  });

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => AXIOS.post(PAYROLL_RELEASE, data),
    onSuccess: () => {
      toast.success("Salary released");
      onSuccess();
    },
    onError: (error: any) =>
      toast.error(error?.message || "Failed to release salary"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <InputWithIcon
        icon={<FaCalendar />}
        type="month"
        value={formData.month}
        onChange={(e) => setFormData({ ...formData, month: e.target.value })}
        required
      />
      <InputWithIcon
        icon={<FaMoneyBillWave />}
        type="number"
        placeholder="Released Amount"
        value={formData.releasedAmount}
        onChange={(e) =>
          setFormData({ ...formData, releasedAmount: Number(e.target.value) })
        }
        required
      />
      <InputWithIcon
        icon={<FaInfoCircle />}
        type="text"
        placeholder="Details (JSON)"
        value={JSON.stringify(formData.details)}
        onChange={(e) =>
          setFormData({ ...formData, details: JSON.parse(e.target.value) })
        }
      />
      <button
        type="submit"
        disabled={mutation.isPending}
        className="px-4 py-2 text-white bg-brand-primary rounded flex items-center gap-2"
      >
        {mutation.isPending ? <Spinner /> : "Release Salary"}
      </button>
    </form>
  );
};

export default ReleaseForm;
