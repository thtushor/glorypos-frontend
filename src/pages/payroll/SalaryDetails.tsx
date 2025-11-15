// New file: pages/payroll/SalaryDetails.tsx - Display salary calculation
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AXIOS from "@/api/network/Axios";
import { PAYROLL_SALARY_DETAILS } from "@/api/api";
import Spinner from "@/components/Spinner";
import { FaCalendar } from "react-icons/fa";
import InputWithIcon from "@/components/InputWithIcon";

interface SalaryDetailsProps {
  user: any | null;
  onSuccess: () => void;
}

const SalaryDetails = ({ user }: SalaryDetailsProps) => {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data, isLoading } = useQuery({
    queryKey: ["salaryDetails", user?.id, month],
    queryFn: () => AXIOS.get(`${PAYROLL_SALARY_DETAILS}/${user.id}/${month}`),
    enabled: !!user?.id,
  });

  return (
    <div className="space-y-6">
      <InputWithIcon
        icon={<FaCalendar />}
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
      />
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="bg-gray-50 p-4 rounded">
          <pre>{JSON.stringify(data?.data, null, 2)}</pre>{" "}
          {/* For PDF, frontend can generate */}
        </div>
      )}
    </div>
  );
};

export default SalaryDetails;
