# URL Filters Implementation

## Overview
Implemented a reusable `useUrlFilters` hook that synchronizes filter state with URL search parameters. This allows filters to persist across page reloads and enables sharing filtered URLs.

## Files Created/Modified

### 1. New Hook: `src/hooks/useUrlFilters.ts`
A generic, reusable hook that:
- Syncs filter state with URL search parameters
- Supports custom serializers for complex types
- Auto-detects types (string, number, boolean)
- Keeps URLs clean by omitting default values
- Initializes filters from URL on mount
- Updates URL when filters change

**Key Features:**
- `filters`: Current filter state object
- `setFilter(key, value)`: Update a single filter
- `setFilters(updates)`: Update multiple filters at once
- `resetFilters()`: Reset all filters to defaults
- `resetFilter(key)`: Reset a specific filter
- `isInitialized`: Boolean indicating if URL params have been loaded

### 2. Updated: `src/pages/inventory/Products.tsx`
Refactored to use the new hook:
- Replaced individual `useState` calls with `useUrlFilters`
- All filters now sync with URL parameters
- Page reloads preserve filter state
- URLs can be shared with active filters

**Filters synced to URL:**
- `page` - Current page number
- `searchKey` - Search text
- `shopId` - Selected shop
- `categoryId` - Selected category
- `brandId` - Selected brand
- `unitId` - Selected unit
- `gender` - Selected gender filter
- `modelNo` - Model number search
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `sortBy` - Sort field
- `sortOrder` - Sort direction (ASC/DESC)

## Usage Example

```typescript
const { filters, setFilter, isInitialized } = useUrlFilters({
  defaultValues: {
    page: 1,
    searchKey: "",
    categoryId: "all" as number | "all",
    sortBy: "name",
    sortOrder: "ASC" as "ASC" | "DESC",
  },
  serializers: {
    categoryId: {
      serialize: (value) => String(value),
      deserialize: (value) => (value === "all" ? "all" : Number(value)),
    },
  },
});

// Update a filter
setFilter("searchKey", "laptop");

// Update multiple filters
setFilters({ page: 1, sortBy: "price" });

// Use in query
const { data } = useQuery({
  queryKey: ["products", filters],
  queryFn: () => fetchProducts(filters),
  enabled: isInitialized,
});
```

## Benefits

1. **Persistent State**: Filters survive page reloads
2. **Shareable URLs**: Users can share filtered views
3. **Browser Navigation**: Back/forward buttons work with filters
4. **Clean URLs**: Default values are omitted from URL
5. **Type-Safe**: Full TypeScript support
6. **Reusable**: Can be used in any page/component
7. **Flexible**: Custom serializers for complex types

## URL Examples

```
# Default state (clean URL)
/products

# With filters
/products?page=2&searchKey=laptop&categoryId=5&sortBy=price&sortOrder=DESC

# With price range
/products?minPrice=100&maxPrice=500&sortBy=price
```

## Future Usage

This hook can be easily applied to other pages:
- POS product filters
- Order history filters
- Customer list filters
- Report filters
- Any page with filterable data
