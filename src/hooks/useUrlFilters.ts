import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

interface UseUrlFiltersOptions<T> {
    defaultValues: T;
    /**
     * Optional serializers for specific fields
     * Useful for complex types like objects or arrays
     */
    serializers?: {
        [K in keyof T]?: {
            serialize: (value: T[K]) => string;
            deserialize: (value: string) => T[K];
        };
    };
}

/**
 * Custom hook to sync filter state with URL search parameters
 * Allows filters to persist across page reloads and enables sharing filtered URLs
 * 
 * @example
 * const { filters, setFilter, setFilters, resetFilters } = useUrlFilters({
 *   defaultValues: {
 *     searchKey: "",
 *     page: 1,
 *     categoryId: "all",
 *   }
 * });
 */
export function useUrlFilters<T extends Record<string, any>>({
    defaultValues,
    serializers = {},
}: UseUrlFiltersOptions<T>) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [filters, setFiltersState] = useState<T>(defaultValues);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize filters from URL on mount
    useEffect(() => {
        const initialFilters = { ...defaultValues };
        // let hasUrlParams = false;

        // Read all URL params and populate initial filters
        for (const key in defaultValues) {
            const urlValue = searchParams.get(key);

            if (urlValue !== null) {
                // hasUrlParams = true;

                // Use custom deserializer if provided
                if (serializers[key]?.deserialize) {
                    initialFilters[key] = serializers[key]!.deserialize(urlValue);
                } else {
                    // Auto-detect type and deserialize
                    const defaultValue = defaultValues[key];

                    if (typeof defaultValue === "number") {
                        initialFilters[key] = Number(urlValue) as T[Extract<keyof T, string>];
                    } else if (typeof defaultValue === "boolean") {
                        initialFilters[key] = (urlValue === "true") as T[Extract<keyof T, string>];
                    } else {
                        initialFilters[key] = urlValue as T[Extract<keyof T, string>];
                    }
                }
            }
        }

        setFiltersState(initialFilters);
        setIsInitialized(true);
    }, []); // Only run once on mount

    // Sync filters to URL whenever they change (after initialization)
    useEffect(() => {
        if (!isInitialized) return;

        const newSearchParams = new URLSearchParams();

        for (const key in filters) {
            const value = filters[key];
            const defaultValue = defaultValues[key];

            // Skip if value is the same as default (keep URL clean)
            if (value === defaultValue) continue;

            // Skip empty strings, null, undefined
            if (value === "" || value === null || value === undefined) continue;

            // Use custom serializer if provided
            if (serializers[key]?.serialize) {
                newSearchParams.set(key, serializers[key]!.serialize(value));
            } else {
                // Auto-serialize based on type
                newSearchParams.set(key, String(value));
            }
        }

        setSearchParams(newSearchParams, { replace: true });
    }, [filters, isInitialized]);

    // Set a single filter
    const setFilter = useCallback(
        <K extends keyof T>(key: K, value: T[K]) => {
            setFiltersState((prev) => ({
                ...prev,
                [key]: value,
            }));
        },
        []
    );

    // Set multiple filters at once
    const setFilters = useCallback((updates: Partial<T>) => {
        setFiltersState((prev) => ({
            ...prev,
            ...updates,
        }));
    }, []);

    // Reset all filters to default values
    const resetFilters = useCallback(() => {
        setFiltersState(defaultValues);
    }, [defaultValues]);

    // Reset specific filters to their default values
    const resetFilter = useCallback(
        <K extends keyof T>(key: K) => {
            setFiltersState((prev) => ({
                ...prev,
                [key]: defaultValues[key],
            }));
        },
        [defaultValues]
    );

    return {
        filters,
        setFilter,
        setFilters,
        resetFilters,
        resetFilter,
        isInitialized,
    };
}
