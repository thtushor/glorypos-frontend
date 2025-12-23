import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import AXIOS from "@/api/network/Axios";
import { SUB_SHOPS_URL } from "@/api/api";
import { useAuth } from "@/context/AuthContext";

interface SubShop {
    id: number;
    fullName: string;
    email: string;
    businessName: string;
    accountType: string;
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

/**
 * Custom hook to fetch and manage shop filter options
 * Combines current user with sub-shops and ensures uniqueness
 * @returns Object containing shops array, loading state, and error
 */
export const useShopFilterOptions = () => {
    const { user } = useAuth();

    // Fetch all shops
    const { data: shopData, isLoading, error } = useQuery<SubShopResponse>({
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

    // Combine current user with shops and ensure uniqueness
    const shops = useMemo(() => {
        if (!user) return shopData?.users || [];

        // Create array with current user and all shops
        const allShops = [
            user as unknown as SubShop,
            ...(shopData?.users || []),
        ];

        // Remove duplicates based on id
        const uniqueShops = allShops.filter(
            (shop, index, self) =>
                index === self.findIndex((s) => s?.id === shop?.id)
        );

        return uniqueShops;
    }, [user, shopData?.users]);

    return {
        shops,
        isLoading,
        error,
    };
};
