import { useState } from "react";
import {
  FaSearch,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaBox,
  FaFileInvoiceDollar,
} from "react-icons/fa";

const Suppliers: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Sample supplier data
  const suppliers = [
    {
      id: 1,
      name: "Tech Solutions Inc.",
      email: "contact@techsolutions.com",
      phone: "+1 234 567 890",
      address: "123 Tech Street, Silicon Valley, CA",
      status: "active",
      totalOrders: 156,
      totalSpent: 45678.9,
      lastOrder: "2024-03-15",
      rating: 4.8,
      categories: ["Electronics", "Accessories"],
      products: 25,
      image:
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&h=200&fit=crop",
    },
    // Add more suppliers with similar data structure
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Suppliers</h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage your supplier relationships and orders
            </p>
          </div>
          <button className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-hover">
            Add New Supplier
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>
          <select className="px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary">
            <option value="all">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="accessories">Accessories</option>
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Suppliers</p>
              <p className="text-2xl font-semibold mt-1">48</p>
            </div>
            <div className="p-3 bg-brand-primary/10 rounded-full">
              <FaBox className="w-6 h-6 text-brand-primary" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Orders</p>
              <p className="text-2xl font-semibold mt-1">1,234</p>
            </div>
            <div className="p-3 bg-brand-primary/10 rounded-full">
              <FaFileInvoiceDollar className="w-6 h-6 text-brand-primary" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Suppliers</p>
              <p className="text-2xl font-semibold mt-1">42</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FaBox className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Suppliers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                {/* Supplier Image */}
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={supplier.image}
                    alt={supplier.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Supplier Info */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{supplier.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            supplier.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {supplier.status.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {supplier.products} Products
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm font-medium">
                        {supplier.rating}
                      </span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaEnvelope className="w-4 h-4 text-gray-400" />
                      <span>{supplier.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaPhone className="w-4 h-4 text-gray-400" />
                      <span>{supplier.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaMapMarkerAlt className="w-4 h-4 text-gray-400" />
                      <span>{supplier.address}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Orders</p>
                      <p className="font-semibold">{supplier.totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Spent</p>
                      <p className="font-semibold">
                        ${supplier.totalSpent.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Order</p>
                      <p className="font-semibold">
                        {new Date(supplier.lastOrder).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <div className="flex gap-2">
                  {supplier.categories.map((category, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs"
                    >
                      {category}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-sm text-brand-primary hover:bg-brand-primary/10 rounded-md transition-colors duration-200">
                    View Details
                  </button>
                  <button className="px-3 py-1 text-sm bg-brand-primary text-white rounded-md hover:bg-brand-hover transition-colors duration-200">
                    Place Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Suppliers;
