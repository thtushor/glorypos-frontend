// New file: pages/payroll/HistoryModal.tsx - Display salary history
import { useQuery } from "@tanstack/react-query";
import AXIOS from "@/api/network/Axios";
import { PAYROLL_HISTORY } from "@/api/api";
import Spinner from "@/components/Spinner";

interface HistoryModalProps {
  user: any | null;
}

const HistoryModal = ({ user }: HistoryModalProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["payrollHistory", user?.id],
    queryFn: () => AXIOS.get(`${PAYROLL_HISTORY}/${user.id}`),
    enabled: !!user?.id,
  });

  return (
    <div>
      {isLoading ? (
        <Spinner />
      ) : (
        <ul className="space-y-2">
          {data?.data?.map((h: any) => (
            <li key={h.id} className="p-2 bg-gray-50 rounded">
              <p>Month: {h.month}</p>
              <p>Amount: ${h.releasedAmount}</p>
              <pre>{JSON.stringify(h.details, null, 2)}</pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HistoryModal;
