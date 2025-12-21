import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import AXIOS from "@/api/network/Axios";
import Spinner from "@/components/Spinner";
import { toast } from "react-toastify";
import {
    FaUser,
    FaEnvelope,
    FaPhone,
    FaMapMarkerAlt,
    FaCamera,
    FaSpinner,
    FaMoneyBillWave,
    FaClock,
    FaChartLine,
    FaCalendarAlt,
    FaEdit,
    FaSave,
    FaTimes,
    FaBuilding,
    FaBriefcase,
    FaUserShield,
    FaCheckCircle,
    FaTimesCircle,
    FaMoneyBill,
    FaShoppingCart,
    FaFileAlt,
    FaPercent,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { uploadFile } from "@/utils/utils";
import FallbackAvatar from "@/components/shared/FallbackAvatar";
import { CHILD_USERS_URL_PROFILE, CREATE_CHILD_USER_URL } from "@/api/api";
import money from "@/utils/money";
import { format } from "date-fns";
import { useParams, Outlet, Link, useLocation } from "react-router-dom";

interface Permission {
    canEdit: boolean;
    canDelete: boolean;
    canViewReports: boolean;
}

interface Parent {
    id: number;
    fullName: string;
    email: string;
    phoneNumber: string;
    location: string;
    businessName: string;
    businessType: string;
    image: string | null;
}

interface Financials {
    totalSales: number;
    totalCommission: number;
    advanceSalary: {
        totalTaken: number;
        totalRepaid: number;
        outstanding: number;
    };
    leaveSummary: {
        totalDaysThisYear: number;
        requestsCount: number;
    };
    salaryDetails: {
        totalPaidLifetime: number;
    };
    currentBaseSalary: string;
    lastSalaryUpdate: string;
    salaryStatus: string;
}

interface CurrentMonthSalary {
    salaryMonth: string;
    baseSalary: number;
    totalWorkingDays: number;
    totalWeekendDays: number;
    totalHolidayDays: number;
    totalLeaveDays: number;
    grossSalary: number;
    netAttendanceSalary: number;
    totalSales: number;
    totalCommission: number;
    totalPayable: number;
    currentMonthRemainingDue: number;
    status: string;
}

interface StaffProfileData {
    id: number;
    fullName: string;
    email: string;
    phone: string | null;
    role: string;
    status: "active" | "inactive";
    permissions: Permission;
    parentUserId: number;
    baseSalary: string;
    requiredDailyHours: number;
    createdAt: string;
    updatedAt: string;
    parent: Parent;
    financials: Financials;
    currentMonthSalary: CurrentMonthSalary;
}

interface UpdateFormData {
    fullName: string;
    phone: string;
    role: string;
    status: "active" | "inactive";
    permissions: Permission;
    baseSalary: number;
    requiredDailyHours: number;
}

const StaffProfilePage = () => {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<UpdateFormData>>({});
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const params = useParams<{ staffId: string }>();
    const { user } = useAuth();
    const location = useLocation();
    const profileId = params.staffId || user?.child?.id

    const { data: profileResponse, isLoading } = useQuery({
        queryKey: ["staff-profile", profileId],
        queryFn: async () => {
            const url = CHILD_USERS_URL_PROFILE.replace(":id", String(profileId));
            const response = await AXIOS.get(url);
            const profileData = response.data;
            setFormData({
                fullName: profileData.fullName,
                phone: profileData.phone || "",
                role: profileData.role,
                status: profileData.status,
                permissions: profileData.permissions,
                baseSalary: parseFloat(profileData.baseSalary),
                requiredDailyHours: profileData.requiredDailyHours,
            });
            return response.data;
        },
        enabled: !!profileId,
    });

    const updateProfileMutation = useMutation({
        mutationFn: async (data: UpdateFormData) => {
            await AXIOS.post(`${CREATE_CHILD_USER_URL}/${profileId}`, data);
        },
        onSuccess: () => {
            toast.success("Profile updated successfully");
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ["staff-profile", profileId] });
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to update profile");
        },
    });

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                setPreviewImage(URL.createObjectURL(file));
                const imageUrl = await uploadFile(file);
                // Handle image upload if needed
                toast.success("Image uploaded successfully");
            } catch (error) {
                toast.error("Failed to upload image");
                console.log(error);
                setPreviewImage(null);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate(formData as UpdateFormData);
    };

    const handlePermissionChange = (key: keyof Permission) => {
        setFormData({
            ...formData,
            permissions: {
                ...formData.permissions!,
                [key]: !formData.permissions![key],
            },
        });
    };

    const navItems = [
        { name: "Profile", path: `/staff-profile/${profileId}/profile`, icon: FaUser },
        { name: "Salary History", path: `/staff-profile/${profileId}/salary-history`, icon: FaMoneyBillWave },
        { name: "Advance Salary History", path: `/staff-profile/${profileId}/advance-salary-history`, icon: FaMoneyBill },
        { name: "Promotion History", path: `/staff-profile/${profileId}/promotion-history`, icon: FaChartLine },
        { name: "Leave History", path: `/staff-profile/${profileId}/leave-history`, icon: FaCalendarAlt },
        { name: "Orders", path: `/staff-profile/${profileId}/orders`, icon: FaShoppingCart },
        { name: "Product Statement", path: `/staff-profile/${profileId}/product-statement`, icon: FaFileAlt },
        { name: "Staff Commissions", path: `/staff-profile/${profileId}/staff-commissions`, icon: FaPercent },
    ];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner color="#32cd32" size="40px" />
            </div>
        );
    }

    const profile = profileResponse as StaffProfileData;

    if (!profile) return null;

    const isProfileTab = location.pathname.endsWith('/profile');

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Card */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                    <div className="relative h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
                        <div className="absolute -bottom-20 left-8 z-10">
                            <div className="relative group">
                                <div className="w-40 h-40 rounded-full overflow-hidden border-8 border-white shadow-2xl bg-white">
                                    <FallbackAvatar
                                        src={previewImage || profile.parent?.image || "/default-avatar.png"}
                                        alt={profile.fullName}
                                        className="w-full h-full object-cover"
                                    />
                                    {isEditing && (
                                        <div
                                            onClick={handleImageClick}
                                            className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-300"
                                        >
                                            <FaCamera className="text-white text-3xl" />
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-24 pb-8 px-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                                    {profile.fullName}
                                </h1>
                                <div className="flex items-center gap-4 flex-wrap">
                                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg">
                                        <FaUserShield className="mr-2" />
                                        {profile.role}
                                    </span>
                                    <span
                                        className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg ${profile.status === "active"
                                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                            : "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                                            }`}
                                    >
                                        {profile.status === "active" ? (
                                            <FaCheckCircle className="mr-2" />
                                        ) : (
                                            <FaTimesCircle className="mr-2" />
                                        )}
                                        {profile.status}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                                    >
                                        <FaEdit /> Edit Profile
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setFormData({
                                                    fullName: profile.fullName,
                                                    phone: profile.phone || "",
                                                    role: profile.role,
                                                    status: profile.status,
                                                    permissions: profile.permissions,
                                                    baseSalary: parseFloat(profile.baseSalary),
                                                    requiredDailyHours: profile.requiredDailyHours,
                                                });
                                                setPreviewImage(null);
                                            }}
                                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold shadow-lg transition-all duration-300 flex items-center gap-2"
                                        >
                                            <FaTimes /> Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={updateProfileMutation.isPending}
                                            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {updateProfileMutation.isPending ? (
                                                <>
                                                    <FaSpinner className="animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <FaSave /> Save Changes
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-4">
                            <FaMoneyBillWave className="text-4xl opacity-80" />
                            <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                                Lifetime
                            </span>
                        </div>
                        <h3 className="text-sm font-medium opacity-90 mb-1">Total Earned</h3>
                        <p className="text-3xl font-bold">
                            {money.format(profile.financials.salaryDetails.totalPaidLifetime)}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-4">
                            <FaChartLine className="text-4xl opacity-80" />
                            <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                                Sales
                            </span>
                        </div>
                        <h3 className="text-sm font-medium opacity-90 mb-1">Total Commission</h3>
                        <p className="text-3xl font-bold">
                            {money.format(profile.financials.totalCommission)}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-4">
                            <FaCalendarAlt className="text-4xl opacity-80" />
                            <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                                This Year
                            </span>
                        </div>
                        <h3 className="text-sm font-medium opacity-90 mb-1">Leave Days</h3>
                        <p className="text-3xl font-bold">
                            {profile.financials.leaveSummary.totalDaysThisYear}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-4">
                            <FaMoneyBillWave className="text-4xl opacity-80" />
                            <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                                Advance
                            </span>
                        </div>
                        <h3 className="text-sm font-medium opacity-90 mb-1">Outstanding</h3>
                        <p className="text-3xl font-bold">
                            {money.format(profile.financials.advanceSalary.outstanding)}
                        </p>
                    </div>
                </div>

                {/* NAVIGATION TABS */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="border-b border-gray-200">
                        <nav
                            className="flex space-x-8 overflow-x-auto px-8 pb-1"
                            aria-label="Staff Profile Navigation"
                        >
                            {navItems.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = location.pathname === tab.path;

                                return (
                                    <Link
                                        key={tab.name}
                                        to={tab.path}
                                        className={`
                                            group relative py-4 px-1 whitespace-nowrap border-b-2 font-medium text-sm transition-all duration-200
                                            flex items-center gap-2
                                            ${isActive
                                                ? "border-blue-600 text-blue-600"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                            }
                                        `}
                                    >
                                        <Icon
                                            className={`w-4 h-4 transition-colors ${isActive
                                                ? "text-blue-600"
                                                : "text-gray-400 group-hover:text-gray-600"
                                                }`}
                                        />
                                        <span>{tab.name}</span>

                                        {isActive && (
                                            <span className="absolute -bottom-[1px] left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* TAB CONTENT */}
                    <div className="p-8">
                        {isProfileTab ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Personal Information */}
                                <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-8">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                            <FaUser className="text-white" />
                                        </div>
                                        Personal Information
                                    </h2>

                                    <form className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Full Name
                                                </label>
                                                <div className="relative">
                                                    <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        disabled={!isEditing}
                                                        value={formData?.fullName || ""}
                                                        onChange={(e) =>
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                fullName: e.target.value,
                                                            }))
                                                        }
                                                        className="pl-12 w-full py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Email
                                                </label>
                                                <div className="relative">
                                                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="email"
                                                        disabled
                                                        value={profile?.email}
                                                        className="pl-12 w-full py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-500"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Phone Number
                                                </label>
                                                <div className="relative">
                                                    <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="tel"
                                                        disabled={!isEditing}
                                                        value={formData?.phone || ""}
                                                        onChange={(e) =>
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                phone: e.target.value,
                                                            }))
                                                        }
                                                        className="pl-12 w-full py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Role
                                                </label>
                                                <div className="relative">
                                                    <FaUserShield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                                                    <select
                                                        disabled={!isEditing}
                                                        value={formData?.role || ""}
                                                        onChange={(e) =>
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                role: e.target.value,
                                                            }))
                                                        }
                                                        className="pl-12 w-full py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300 appearance-none"
                                                    >
                                                        <option value="manager">Manager</option>
                                                        <option value="cashier">Cashier</option>
                                                        <option value="staff">Staff</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Base Salary
                                                </label>
                                                <div className="relative">
                                                    <FaMoneyBillWave className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="number"
                                                        readOnly

                                                        disabled={true}
                                                        value={formData?.baseSalary || ""}
                                                        onChange={(e) =>
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                baseSalary: Number(e.target.value),
                                                            }))
                                                        }
                                                        className="pl-12 w-full py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Daily Hours Required
                                                </label>
                                                <div className="relative">
                                                    <FaClock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="number"
                                                        disabled={!isEditing}
                                                        value={formData?.requiredDailyHours || ""}
                                                        onChange={(e) =>
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                requiredDailyHours: Number(e.target.value),
                                                            }))
                                                        }
                                                        className="pl-12 w-full py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Permissions */}
                                        <div className="pt-6 border-t-2 border-gray-100">
                                            <h3 className="text-lg font-bold text-gray-900 mb-4">Permissions</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {Object.entries(formData.permissions || {}).map(([key, value]) => (
                                                    <label
                                                        key={key}
                                                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${value
                                                            ? "bg-green-50 border-green-500"
                                                            : "bg-gray-50 border-gray-200"
                                                            } ${!isEditing ? "opacity-60 cursor-not-allowed" : "hover:shadow-md"}`}
                                                    >
                                                        <span className="text-sm font-semibold text-gray-700">
                                                            {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                                                        </span>
                                                        <input
                                                            type="checkbox"
                                                            disabled={!isEditing}
                                                            checked={value}
                                                            onChange={() => handlePermissionChange(key as keyof Permission)}
                                                            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </form>
                                </div>

                                {/* Parent Business & Current Month Salary */}
                                <div className="space-y-6">
                                    {/* Parent Business */}
                                    <div className="bg-white rounded-2xl shadow-xl p-6">
                                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                                <FaBuilding className="text-white text-sm" />
                                            </div>
                                            Parent Business
                                        </h2>
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                                                <FaBuilding className="text-purple-600 mt-1" />
                                                <div>
                                                    <p className="text-sm text-gray-600">Business Name</p>
                                                    <p className="font-semibold text-gray-900">{profile.parent.businessName}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                                                <FaBriefcase className="text-purple-600 mt-1" />
                                                <div>
                                                    <p className="text-sm text-gray-600">Business Type</p>
                                                    <p className="font-semibold text-gray-900">{profile.parent.businessType}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                                                <FaMapMarkerAlt className="text-purple-600 mt-1" />
                                                <div>
                                                    <p className="text-sm text-gray-600">Location</p>
                                                    <p className="font-semibold text-gray-900">{profile.parent.location}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Current Month Salary */}
                                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
                                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                            <FaCalendarAlt />
                                            Current Month ({format(new Date(profile.currentMonthSalary.salaryMonth), "MMM yyyy")})
                                        </h2>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center pb-2 border-b border-white/20">
                                                <span className="text-sm opacity-90">Base Salary</span>
                                                <span className="font-bold">{money.format(profile.currentMonthSalary.baseSalary)}</span>
                                            </div>
                                            <div className="flex justify-between items-center pb-2 border-b border-white/20">
                                                <span className="text-sm opacity-90">Commission</span>
                                                <span className="font-bold">{money.format(profile.currentMonthSalary.totalCommission)}</span>
                                            </div>
                                            <div className="flex justify-between items-center pb-2 border-b border-white/20">
                                                <span className="text-sm opacity-90">Working Days</span>
                                                <span className="font-bold">{profile.currentMonthSalary.totalWorkingDays}</span>
                                            </div>
                                            <div className="flex justify-between items-center pb-2 border-b border-white/20">
                                                <span className="text-sm opacity-90">Leave Days</span>
                                                <span className="font-bold">{profile.currentMonthSalary.totalLeaveDays}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-2 bg-white/10 rounded-lg p-3 mt-3">
                                                <span className="font-semibold">Total Payable</span>
                                                <span className="text-2xl font-bold">{money.format(profile.currentMonthSalary.totalPayable)}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white/10 rounded-lg p-3">
                                                <span className="font-semibold">Remaining Due</span>
                                                <span className="text-xl font-bold">{money.format(profile.currentMonthSalary.currentMonthRemainingDue)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Outlet />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffProfilePage;
