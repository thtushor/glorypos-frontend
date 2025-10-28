import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaUserShield,
} from "react-icons/fa";
import AXIOS from "@/api/network/Axios";
import { CHILD_USERS_URL, CREATE_CHILD_USER_URL } from "@/api/api";
import InputWithIcon from "@/components/InputWithIcon";
import Spinner from "@/components/Spinner";

interface Permission {
  canEdit: boolean;
  canDelete: boolean;
  canViewReports: boolean;
}

interface ChildUser {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  status: "active" | "inactive";
  permissions: Permission;
  createdAt: string;
  updatedAt: string;
  parentUserId: number;
  userId: number | null;
}

interface ChildUsersResponse {
  status: boolean;
  message: string;
  data: {
    users: ChildUser[];
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
}

interface UserFormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  status: "active" | "inactive";
  permissions: Permission;
}

const CreateUser = () => {
  const { data: childUsers, isLoading } = useQuery<ChildUsersResponse>({
    queryKey: ["childUsers"],
    queryFn: async () => {
      const response = await AXIOS.get(CHILD_USERS_URL);
      return response.data;
    },
  });

  const [formData, setFormData] = useState<UserFormData>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "manager",
    status: "active",
    permissions: {
      canEdit: true,
      canDelete: true,
      canViewReports: true,
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await AXIOS.post(CREATE_CHILD_USER_URL, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("User created successfully!");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create user");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      role: "manager",
      status: "active",
      permissions: {
        canEdit: true,
        canDelete: true,
        canViewReports: true,
      },
    });
  };

  const handlePermissionChange = (permission: keyof Permission) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission],
      },
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Create User</h2>
        <div className="text-sm text-gray-600">
          Total Users: {childUsers?.data.pagination.totalCount || 0}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <Spinner color="#32cd32" size="40px" />
        </div>
      ) : (
        <>
          <div className="mb-8 overflow-x-auto">
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
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {childUsers?.data.users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.fullName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">
                      {user.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium
                        ${
                          user.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
            <InputWithIcon
              icon={<FaUser />}
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              required
            />

            <InputWithIcon
              icon={<FaEnvelope />}
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />

            <InputWithIcon
              icon={<FaPhone />}
              type="tel"
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />

            <InputWithIcon
              icon={<FaLock />}
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaUserShield className="inline-block mr-2" />
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                >
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                  <option value="cashier">Cashier</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as "active" | "inactive",
                    })
                  }
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  {Object.entries(formData.permissions).map(([key, value]) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() =>
                          handlePermissionChange(key as keyof Permission)
                        }
                        className="rounded text-brand-primary focus:ring-brand-primary"
                      />
                      <span className="text-sm text-gray-700">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createUserMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-hover disabled:opacity-50 flex items-center gap-2"
              >
                {createUserMutation.isPending ? (
                  <Spinner size="16px" color="#ffffff" />
                ) : (
                  "Create User"
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default CreateUser;
