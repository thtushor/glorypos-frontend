// Updated pages/users/CreateUserForm.tsx - Added baseSalary and requiredDailyHours fields
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaUserShield,
  FaMoneyBill,
  FaClock,
  FaPhone,
  FaCalendar,
} from "react-icons/fa";
import AXIOS from "@/api/network/Axios";
import { CREATE_CHILD_USER_URL } from "@/api/api";
import InputWithIcon from "@/components/InputWithIcon";
import Spinner from "@/components/Spinner";

interface Permission {
  canEdit: boolean;
  canDelete: boolean;
  canViewReports: boolean;
}

interface UserFormData {
  fullName: string;
  email: string;
  password: string;
  role: string;
  status: "active" | "inactive";
  permissions: Permission;
  baseSalary: number; // Added
  requiredDailyHours: number; // Added
  salaryFrequency: "daily" | "weekly" | "monthly";
  salaryStartDate: string | null; // Added
  phone: string;
}

interface CreateUserFormProps {
  user?: {
    id: number;
    fullName: string;
    email: string;
    role: string;
    status: "active" | "inactive";
    permissions: Permission;
    baseSalary?: number | null; // Added
    requiredDailyHours?: number | null; // Added
    salaryFrequency?: "daily" | "weekly" | "monthly";
    salaryStartDate?: string | null; // Added
    phone?: string;
  } | null;
  onSuccess: () => void;
}

const CreateUserForm = ({ user, onSuccess }: CreateUserFormProps) => {
  const [formData, setFormData] = useState<UserFormData>({
    fullName: "",
    email: "",
    password: "",
    role: "manager",
    status: "active",
    permissions: {
      canEdit: true,
      canDelete: true,
      canViewReports: true,
    },
    baseSalary: 0, // Added
    // TODO:: 8 WILL DYNAMIC IN BACKEND LATER
    requiredDailyHours: 8, // Added default
    salaryFrequency: "monthly",
    salaryStartDate: null, // Added
    phone: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        ...formData,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        permissions: user.permissions,
        baseSalary: user.baseSalary ?? 0, // Added
        requiredDailyHours: user.requiredDailyHours ?? 8, // Added
        salaryFrequency: user.salaryFrequency ?? "monthly",
        salaryStartDate: user.salaryStartDate ?? null, // Added
        phone: user.phone ?? "",
      });
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      if (user) {
        const response = await AXIOS.post(
          `${CREATE_CHILD_USER_URL}/${user.id}`,
          data
        );
        return response.data;
      } else {
        const response = await AXIOS.post(CREATE_CHILD_USER_URL, data);
        return response.data;
      }
    },
    onSuccess: () => {
      toast.success(
        user ? "Employee updated successfully" : "Employee created successfully"
      );
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to save Employee");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  // const handlePermissionChange = (key: keyof Permission) => {
  //   setFormData({
  //     ...formData,
  //     permissions: {
  //       ...formData.permissions,
  //       [key]: !formData.permissions[key],
  //     },
  //   });
  // };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <InputWithIcon
          type="text"
          icon={<FaUser />}
          name="fullName"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={(e) =>
            setFormData({ ...formData, fullName: e.target.value })
          }
          required
          label="Full Name"
        />

        <InputWithIcon
          type="email"
          name="email"
          icon={<FaEnvelope />}
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          label="Email Address"
        />

        <InputWithIcon
          type="text"
          name="phone"
          icon={<FaPhone />}
          placeholder="Phone Number"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          label="Phone Number"
        />

        <InputWithIcon
          type="password"
          name="password"
          icon={<FaLock />}
          placeholder="Password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required={user ? false : true}
          label="Create Password"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <div className="relative">
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="mt-1 border block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
            >
              <option value="manager">Manager</option>
              <option value="cashier">Cashier</option>
              <option value="staff">Staff</option>
            </select>
            <FaUserShield className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
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
            className="mt-1 border block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <InputWithIcon // Added
          type="number"
          icon={<FaMoneyBill />}
          name="baseSalary"
          placeholder="Base Salary"
          value={formData.baseSalary}
          onChange={(e) =>
            setFormData({ ...formData, baseSalary: Number(e.target.value) })
          }
          required={!formData?.baseSalary}
          label="Base Salary"
          readOnly={Number(user?.baseSalary || 0) > 0 ? true : false}
        />

        <InputWithIcon // Added
          type="number"
          icon={<FaClock />}
          name="requiredDailyHours"
          placeholder="Required Daily Hours"
          value={formData.requiredDailyHours}
          onChange={(e) =>
            setFormData({
              ...formData,
              requiredDailyHours: Number(e.target.value),
            })
          }
          required={!formData.requiredDailyHours}
          min={1}
          label="Required Daily Hours"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Salary Type
          </label>
          <select
            value={formData.salaryFrequency}
            onChange={(e) =>
              setFormData({
                ...formData,
                salaryFrequency: e.target.value as "daily" | "weekly" | "monthly",
              })
            }
            className="mt-1 border block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Salary Start Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={formData.salaryStartDate || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  salaryStartDate: e.target.value || null,
                })
              }
              className="mt-1 border block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
              placeholder="Select salary start date"
            />
            <FaCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Leave empty to prevent salary generation and advance salary requests
          </p>
        </div>

        {/* <div>
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
        </div> */}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-hover disabled:opacity-50 flex items-center gap-2"
        >
          {mutation.isPending ? (
            <Spinner size="16px" color="#ffffff" />
          ) : user ? (
            "Update Employee"
          ) : (
            "Create Employee"
          )}
        </button>
      </div>
    </form>
  );
};

export default CreateUserForm;
