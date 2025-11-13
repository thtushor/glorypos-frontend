// New file: pages/payroll/HolidayForm.tsx - Form for adding holidays
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import AXIOS from "@/api/network/Axios";
import { PAYROLL_HOLIDAY, PAYROLL_HOLIDAYS } from "@/api/api";
import InputWithIcon from "@/components/InputWithIcon";
import Spinner from "@/components/Spinner";
import { FaCalendarAlt, FaInfoCircle } from "react-icons/fa";

interface HolidayFormProps {
  onSuccess: () => void;
}

const HolidayForm = ({ onSuccess }: HolidayFormProps) => {
  const [formData, setFormData] = useState({
    date: "",
    description: "",
  });

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => AXIOS.post(PAYROLL_HOLIDAY, data),
    onSuccess: () => {
      toast.success("Holiday added");
      onSuccess();
    },
    onError: (error: any) =>
      toast.error(error?.message || "Failed to add holiday"),
  });

  const { data: holidays } = useQuery({
    queryKey: ["holidays"],
    queryFn: () => AXIOS.get(PAYROLL_HOLIDAYS),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <InputWithIcon
          icon={<FaCalendarAlt />}
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
        <InputWithIcon
          icon={<FaInfoCircle />}
          type="text"
          placeholder="Description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          required
        />
        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-4 py-2 text-white bg-brand-primary rounded flex items-center gap-2"
        >
          {mutation.isPending ? <Spinner /> : "Add Holiday"}
        </button>
      </form>
      <div>
        <h3 className="text-lg font-medium mb-2">Existing Holidays</h3>
        <ul className="space-y-2">
          {holidays?.data?.map((h: any) => (
            <li key={h.id} className="flex justify-between">
              <span>{h.date}</span>
              <span>{h.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HolidayForm;
