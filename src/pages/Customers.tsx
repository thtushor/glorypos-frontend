const Customers: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-2xl font-semibold mb-6">Customers</h1>
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex justify-between items-center">
          <input
            type="text"
            placeholder="Search customers..."
            className="px-4 py-2 border rounded-md w-64"
          />
          <button className="px-4 py-2 bg-brand-primary text-white rounded-md">
            Add Customer
          </button>
        </div>

        {/* Customers Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[1, 2, 3].map((item) => (
                <tr key={item}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    Customer {item}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    customer{item}@example.com
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    +1 234 567 890
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{item * 5}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-brand-primary">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Customers;
