import { useQuery } from "@tanstack/react-query";
import { FaSearch } from "react-icons/fa";
import AXIOS from "@/api/network/Axios";
import { SUB_SHOPS_URL } from "@/api/api";
import Spinner from "@/components/Spinner";

interface SubShop {
  id: number;
  fullName: string;
  email: string;
  businessName: string;
}

interface SubShopResponse {
  users: SubShop[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

interface InventoryFiltersProps {
  searchKey: string;
  shopId: string;
  onSearchKeyChange: (value: string) => void;
  onShopIdChange: (value: string) => void;
  searchPlaceholder?: string;
}

const InventoryFilters = ({
  searchKey,
  shopId,
  onSearchKeyChange,
  onShopIdChange,
  searchPlaceholder = "Search...",
}: InventoryFiltersProps) => {
  // Fetch all shops with pageSize 1000000
  const { data: shopData, isLoading: isLoadingShops } = useQuery<SubShopResponse>({
    queryKey: ["sub-shops-for-filter"],
    queryFn: async () => {
      const response = await AXIOS.get(SUB_SHOPS_URL, {
        params: {
          page: 1,
          pageSize: 1000000,
        },
      });
      return response.data;
    },
  });

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Search Input */}
      <div className="flex-1 relative">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchKey}
          onChange={(e) => onSearchKeyChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      {/* Shop Select */}
      <div className="w-full md:w-64 relative">
        <select
          value={shopId}
          onChange={(e) => onShopIdChange(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
          disabled={isLoadingShops}
        >
          <option value="">All Shops</option>
          {isLoadingShops ? (
            <option value="" disabled>
              Loading shops...
            </option>
          ) : (
            shopData?.users?.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.businessName || shop.fullName}
              </option>
            ))
          )}
        </select>
        {isLoadingShops && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Spinner color="#32cd32" size="16px" />
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryFilters;

