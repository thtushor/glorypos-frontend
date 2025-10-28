const Reports: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-2xl font-semibold mb-6">Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Summary Cards */}
        <div className="bg-brand-primary/10 rounded-lg p-4">
          <h3 className="text-sm text-gray-600">Total Sales</h3>
          <p className="text-2xl font-semibold text-brand-primary">$12,345</p>
          <span className="text-sm text-green-600">↑ 12% vs last month</span>
        </div>

        <div className="bg-brand-primary/10 rounded-lg p-4">
          <h3 className="text-sm text-gray-600">Orders</h3>
          <p className="text-2xl font-semibold text-brand-primary">123</p>
          <span className="text-sm text-green-600">↑ 5% vs last month</span>
        </div>

        <div className="bg-brand-primary/10 rounded-lg p-4">
          <h3 className="text-sm text-gray-600">Customers</h3>
          <p className="text-2xl font-semibold text-brand-primary">456</p>
          <span className="text-sm text-green-600">↑ 8% vs last month</span>
        </div>

        <div className="bg-brand-primary/10 rounded-lg p-4">
          <h3 className="text-sm text-gray-600">Average Order Value</h3>
          <p className="text-2xl font-semibold text-brand-primary">$99</p>
          <span className="text-sm text-red-600">↓ 2% vs last month</span>
        </div>
      </div>
    </div>
  );
};

export default Reports;
