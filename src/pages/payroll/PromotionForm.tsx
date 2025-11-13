// New file: pages/payroll/PromotionForm.tsx - Form for promotions
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import AXIOS from "@/api/network/Axios";
import { PAYROLL_PROMOTION } from "@/api/api";
import InputWithIcon from "@/components/InputWithIcon";
import Spinner from "@/components/Spinner";
import { FaMoneyBill, FaCalendar } from "react-icons/fa";

interface PromotionFormProps {
  user: any | null;
  onSuccess: () => void;
}

const PromotionForm = ({ user, onSuccess }: PromotionFormProps) => {
  const [formData, setFormData] = useState({
    userId: user?.id,
    newSalary: 0,
    startMonth: "",
  });

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => AXIOS.post(PAYROLL_PROMOTION, data),
    onSuccess: () => {
      toast.success("Promotion applied");
      onSuccess();
    },
    onError: (error: any) =>
      toast.error(error?.message || "Failed to apply promotion"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <InputWithIcon
        icon={<FaMoneyBill />}
        type="number"
        placeholder="New Salary"
        value={formData.newSalary}
        onChange={(e) =>
          setFormData({ ...formData, newSalary: Number(e.target.value) })
        }
        required
      />
      <InputWithIcon
        icon={<FaCalendar />}
        type="month"
        placeholder="Start Month"
        value={formData.startMonth}
        onChange={(e) =>
          setFormData({ ...formData, startMonth: e.target.value })
        }
        required
      />
      <button
        type="submit"
        disabled={mutation.isPending}
        className="px-4 py-2 text-white bg-brand-primary rounded flex items-center gap-2"
      >
        {mutation.isPending ? <Spinner /> : "Apply Promotion"}
      </button>
    </form>
  );
};

export default PromotionForm;
