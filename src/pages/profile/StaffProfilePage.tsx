import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
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
import { PERMISSION_GROUPS, PERMISSION_TEMPLATES, PERMISSIONS } from "@/config/permissions";
import { usePermission } from "@/hooks/usePermission";

// Updated Permission type - now an array of permission keys
type UserPermissions = string[];

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
    permissions: UserPermissions;
    parentUserId: number;
    baseSalary: string;
    requiredDailyHours: number;
    salaryFrequency?: "daily" | "weekly" | "monthly";
    salaryStartDate?: string | null;
    createdAt: string;
    updatedAt: string;
    parent: Parent;
    financials: Financials;
    currentMonthSalary: CurrentMonthSalary;
    imageUrl?: string;
}

interface UpdateFormData {
    fullName: string;
    phone: string;
    role: string;
    status: "active" | "inactive";
    permissions: UserPermissions;
    baseSalary: number;
    requiredDailyHours: number;
    salaryFrequency?: "daily" | "weekly" | "monthly";
    salaryStartDate?: string | null;
    imageUrl?: string;
}

const StaffProfilePage = () => {
    const queryClient = useQueryClient();
    const { hasPermission } = usePermission();
    const canEditChildUsers = hasPermission(PERMISSIONS.USERS.EDIT_CHILD_USER);
    const canManagePermissions = hasPermission(PERMISSIONS.USERS.MANAGE_PERMISSIONS);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<UpdateFormData>>({});
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const params = useParams<{ staffId: string }>();
    const { user } = useAuth();
    const location = useLocation();
    const profileId = params.staffId || user?.child?.id

    // Helper function to normalize permissions from API
    const normalizePermissions = (permissions: any): UserPermissions => {
        // If already an array, return it
        if (Array.isArray(permissions)) {
            return permissions;
        }
        // If it's an object (old format), convert to empty array for now
        // You can map old permissions to new ones if needed
        if (typeof permissions === 'object' && permissions !== null) {
            return [];
        }
        // Default to empty array
        return [];
    };

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
                permissions: normalizePermissions(profileData.permissions),
                baseSalary: parseFloat(profileData.baseSalary),
                requiredDailyHours: profileData.requiredDailyHours,
                salaryFrequency: profileData.salaryFrequency || "monthly",
                salaryStartDate: profileData.salaryStartDate || null,
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
                // Show preview immediately
                setPreviewImage(URL.createObjectURL(file));

                // Upload the file
                const imageUrl = await uploadFile(file);

                if (imageUrl) {
                    // Update formData with the uploaded image URL
                    setFormData(prev => ({
                        ...prev,
                        imageUrl: imageUrl
                    }));
                    toast.success("Image uploaded successfully");
                } else {
                    throw new Error("Failed to get image URL");
                }
            } catch (error) {
                toast.error("Failed to upload image");
                console.log(error);
                setPreviewImage(null);
            }
        }
    };

    // Form ref for validation
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate(formData as UpdateFormData);
    };

    // Use ref to store latest handleSubmit to avoid stale closures
    const handleSubmitRef = useRef(handleSubmit);
    useEffect(() => {
        handleSubmitRef.current = handleSubmit;
    });

    // Global keyboard event listener for Enter key - works when editing
    useEffect(() => {
        if (!isEditing) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Only trigger if Enter is pressed and not in a textarea
            if (e.key === "Enter" && !e.shiftKey) {
                const target = e.target as HTMLElement;
                const isTextarea = target.tagName === "TEXTAREA";
                
                // If focused on textarea, allow normal Enter behavior for newlines
                if (isTextarea) return;
                
                // Prevent default to avoid form submission conflicts
                e.preventDefault();
                
                // Submit form if not currently processing
                if (!updateProfileMutation.isPending) {
                    // Get the form element and trigger validation
                    const form = formRef.current;
                    if (form) {
                        // Check if form is valid (triggers HTML5 validation)
                        if (form.checkValidity()) {
                            // Form is valid, submit it
                            handleSubmitRef.current(e as any);
                        } else {
                            // Form is invalid, trigger validation UI
                            form.reportValidity();
                        }
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isEditing, updateProfileMutation.isPending]);

    const handlePermissionToggle = (permissionKey: string) => {
        const currentPermissions = Array.isArray(formData.permissions) ? formData.permissions : [];
        const hasPermission = currentPermissions.includes(permissionKey);

        setFormData({
            ...formData,
            permissions: hasPermission
                ? currentPermissions.filter(p => p !== permissionKey)
                : [...currentPermissions, permissionKey],
        });
    };

    const applyPermissionTemplate = (templateName: keyof typeof PERMISSION_TEMPLATES) => {
        setFormData({
            ...formData,
            permissions: [...PERMISSION_TEMPLATES[templateName]],
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-3 px-2 sm:py-4 sm:px-3 md:py-6 md:px-4 lg:py-8">
            <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
                {/* Header Card */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
                    <div className="relative h-32 sm:h-40 md:h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
                        <div className="absolute -bottom-12 sm:-bottom-16 md:-bottom-20 left-3 sm:left-6 md:left-8 z-10">
                            <div className="relative group">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 sm:border-6 md:border-8 border-white shadow-2xl bg-white">
                                    <FallbackAvatar
                                        src={previewImage || profile?.imageUrl || "/default-avatar.png"}
                                        alt={profile.fullName}
                                        className="w-full h-full object-cover"
                                    />
                                    {isEditing && (
                                        <div
                                            onClick={handleImageClick}
                                            className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-300"
                                        >
                                            <FaCamera className="text-white text-xl sm:text-2xl md:text-3xl" />
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

                    <div className="pt-16 sm:pt-20 md:pt-24 pb-4 sm:pb-6 md:pb-8 px-3 sm:px-5 md:px-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                            <div>
                                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                                    {profile.fullName}
                                </h1>
                                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-wrap">
                                    <span className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg">
                                        <FaUserShield className="mr-1 sm:mr-2 text-xs sm:text-sm" />
                                        {profile.role}
                                    </span>
                                    <span
                                        className={`inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 rounded-full text-xs sm:text-sm font-semibold shadow-lg ${profile.status === "active"
                                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                            : "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                                            }`}
                                    >
                                        {profile.status === "active" ? (
                                            <FaCheckCircle className="mr-1 sm:mr-2 text-xs sm:text-sm" />
                                        ) : (
                                            <FaTimesCircle className="mr-1 sm:mr-2 text-xs sm:text-sm" />
                                        )}
                                        {profile.status}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2 sm:gap-3">
                                {canEditChildUsers && (
                                    !isEditing ? (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base"
                                        >
                                            <FaEdit className="text-xs sm:text-sm" /> <span className="hidden sm:inline">Edit Profile</span><span className="sm:hidden">Edit</span>
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
                                                        salaryFrequency: profile.salaryFrequency || "monthly",
                                                        salaryStartDate: profile.salaryStartDate || null,
                                                    });
                                                    setPreviewImage(null);
                                                }}
                                                className="px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 bg-gray-200 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-300 font-semibold shadow-lg transition-all duration-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base"
                                            >
                                                <FaTimes className="text-xs sm:text-sm" /> <span className="hidden sm:inline">Cancel</span>
                                            </button>
                                            <button
                                                onClick={handleSubmit}
                                                disabled={updateProfileMutation.isPending}
                                                className="px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-1 sm:gap-2 disabled:opacity-50 text-xs sm:text-sm md:text-base"
                                            >
                                                {updateProfileMutation.isPending ? (
                                                    <>
                                                        <FaSpinner className="animate-spin text-xs sm:text-sm" />
                                                        <span className="hidden sm:inline">Saving...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaSave className="text-xs sm:text-sm" /> <span className="hidden sm:inline">Save Changes</span><span className="sm:hidden">Save</span>
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
                            <FaMoneyBillWave className="text-xl sm:text-2xl md:text-3xl lg:text-4xl opacity-80" />
                            <span className="text-[10px] sm:text-xs md:text-sm font-semibold bg-white/20 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                                Lifetime
                            </span>
                        </div>
                        <h3 className="text-[10px] sm:text-xs md:text-sm font-medium opacity-90 mb-1">Total Earned</h3>
                        <p className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-bold">
                            {money.format(profile.financials.salaryDetails.totalPaidLifetime)}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
                            <FaChartLine className="text-xl sm:text-2xl md:text-3xl lg:text-4xl opacity-80" />
                            <span className="text-[10px] sm:text-xs md:text-sm font-semibold bg-white/20 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                                Sales
                            </span>
                        </div>
                        <h3 className="text-[10px] sm:text-xs md:text-sm font-medium opacity-90 mb-1">Total Commission</h3>
                        <p className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-bold">
                            {money.format(profile.financials.totalCommission)}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
                            <FaCalendarAlt className="text-xl sm:text-2xl md:text-3xl lg:text-4xl opacity-80" />
                            <span className="text-[10px] sm:text-xs md:text-sm font-semibold bg-white/20 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                                This Year
                            </span>
                        </div>
                        <h3 className="text-[10px] sm:text-xs md:text-sm font-medium opacity-90 mb-1">Leave Days</h3>
                        <p className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-bold">
                            {profile.financials.leaveSummary.totalDaysThisYear}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
                            <FaMoneyBillWave className="text-xl sm:text-2xl md:text-3xl lg:text-4xl opacity-80" />
                            <span className="text-[10px] sm:text-xs md:text-sm font-semibold bg-white/20 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                                Advance
                            </span>
                        </div>
                        <h3 className="text-[10px] sm:text-xs md:text-sm font-medium opacity-90 mb-1">Outstanding</h3>
                        <p className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-bold">
                            {money.format(profile.financials.advanceSalary.outstanding)}
                        </p>
                    </div>
                </div>

                {/* NAVIGATION TABS */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
                    <div className="border-b border-gray-200">
                        <nav
                            className="flex space-x-2 sm:space-x-4 md:space-x-6 lg:space-x-8 overflow-x-auto px-3 sm:px-5 md:px-8 pb-1 scrollbar-hide"
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
                                            group relative py-3 sm:py-4 px-1 whitespace-nowrap border-b-2 font-medium text-xs sm:text-sm transition-all duration-200
                                            flex items-center gap-1 sm:gap-2
                                            ${isActive
                                                ? "border-blue-600 text-blue-600"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                            }
                                        `}
                                    >
                                        <Icon
                                            className={`w-3 h-3 sm:w-4 sm:h-4 transition-colors ${isActive
                                                ? "text-blue-600"
                                                : "text-gray-400 group-hover:text-gray-600"
                                                }`}
                                        />
                                        <span className="hidden sm:inline">{tab.name}</span>

                                        {isActive && (
                                            <span className="absolute -bottom-[1px] left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* TAB CONTENT */}
                    <div className="p-3 sm:p-5 md:p-6 lg:p-8">
                        {isProfileTab ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                                {/* Personal Information */}
                                <div className="lg:col-span-2 bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-5 md:p-6 lg:p-8">
                                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-5 md:mb-6 flex items-center gap-2 sm:gap-3">
                                        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                            <FaUser className="text-white text-xs sm:text-sm" />
                                        </div>
                                        Personal Information
                                    </h2>

                                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                                            <div>
                                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                                                    Full Name
                                                </label>
                                                <div className="relative">
                                                    <FaUser className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
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
                                                        className="pl-9 sm:pl-10 md:pl-12 w-full py-2 sm:py-2.5 md:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                                                    Email
                                                </label>
                                                <div className="relative">
                                                    <FaEnvelope className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
                                                    <input
                                                        type="email"
                                                        disabled
                                                        value={profile?.email}
                                                        className="pl-9 sm:pl-10 md:pl-12 w-full py-2 sm:py-2.5 md:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-500"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                                                    Phone Number
                                                </label>
                                                <div className="relative">
                                                    <FaPhone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
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
                                                        className="pl-9 sm:pl-10 md:pl-12 w-full py-2 sm:py-2.5 md:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                                                    Role
                                                </label>
                                                <div className="relative">
                                                    <FaUserShield className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 text-xs sm:text-sm" />
                                                    <select
                                                        disabled={!isEditing}
                                                        value={formData?.role || ""}
                                                        onChange={(e) =>
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                role: e.target.value,
                                                            }))
                                                        }
                                                        className="pl-9 sm:pl-10 md:pl-12 w-full py-2 sm:py-2.5 md:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300 appearance-none"
                                                    >
                                                        <option value="manager">Manager</option>
                                                        <option value="cashier">Cashier</option>
                                                        <option value="staff">Staff</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                                                    Base Salary
                                                </label>
                                                <div className="relative">
                                                    <FaMoneyBillWave className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
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
                                                        className="pl-9 sm:pl-10 md:pl-12 w-full py-2 sm:py-2.5 md:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                                                    Daily Hours Required
                                                </label>
                                                <div className="relative">
                                                    <FaClock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
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
                                                        className="pl-9 sm:pl-10 md:pl-12 w-full py-2 sm:py-2.5 md:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                                                    Salary Type
                                                </label>
                                                <div className="relative">
                                                    <FaMoneyBillWave className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 text-xs sm:text-sm" />
                                                    <select
                                                        disabled={!isEditing}
                                                        value={formData?.salaryFrequency || "monthly"}
                                                        onChange={(e) =>
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                salaryFrequency: e.target.value as "daily" | "weekly" | "monthly",
                                                            }))
                                                        }
                                                        className="pl-9 sm:pl-10 md:pl-12 w-full py-2 sm:py-2.5 md:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300 appearance-none"
                                                    >
                                                        <option value="daily">Daily</option>
                                                        <option value="weekly">Weekly</option>
                                                        <option value="monthly">Monthly</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                                                    Salary Start Date
                                                </label>
                                                <div className="relative">
                                                    <FaCalendarAlt className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
                                                    <input
                                                        type="date"
                                                        disabled={!isEditing}
                                                        value={formData?.salaryStartDate || ""}
                                                        onChange={(e) =>
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                salaryStartDate: e.target.value || null,
                                                            }))
                                                        }
                                                        className="pl-9 sm:pl-10 md:pl-12 w-full py-2 sm:py-2.5 md:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300"
                                                    />
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Leave empty to prevent salary generation and advance salary requests
                                                </p>
                                            </div>
                                        </div>

                                        {/* Permissions Management */}
                                        {canManagePermissions && (
                                            <div className="pt-4 sm:pt-5 md:pt-6 border-t-2 border-gray-100">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
                                                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                                                        <FaUserShield className="text-blue-600 text-sm sm:text-base" />
                                                        Permissions Management
                                                    </h3>
                                                    {isEditing && (
                                                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => applyPermissionTemplate('ADMIN')}
                                                                className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                                                            >
                                                                Admin
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => applyPermissionTemplate('MANAGER')}
                                                                className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                                                            >
                                                                Manager
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => applyPermissionTemplate('CASHIER')}
                                                                className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                                                            >
                                                                Cashier
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, permissions: [] })}
                                                                className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                                                            >
                                                                Clear All
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Permission Groups */}
                                                <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
                                                    {PERMISSION_GROUPS.map((group) => {
                                                        const groupPermissions = group.permissions;
                                                        const currentPermissions = Array.isArray(formData.permissions) ? formData.permissions : [];
                                                        const selectedCount = groupPermissions.filter(p =>
                                                            currentPermissions.includes(p.key)
                                                        ).length;
                                                        const totalCount = groupPermissions.length;

                                                        return (
                                                            <div key={group.id} className="bg-gradient-to-br from-gray-50 to-white rounded-lg sm:rounded-xl border-2 border-gray-200 overflow-hidden">
                                                                {/* Group Header */}
                                                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4 border-b-2 border-gray-200">
                                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                                                                        <div>
                                                                            <h4 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">{group.name}</h4>
                                                                            <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">{group.description}</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 sm:gap-3">
                                                                            <span className="text-xs sm:text-sm font-semibold text-gray-700 bg-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border-2 border-gray-200">
                                                                                {selectedCount} / {totalCount}
                                                                            </span>
                                                                            {isEditing && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const allGroupKeys = groupPermissions.map(p => p.key);
                                                                                        const allSelected = allGroupKeys.every(key =>
                                                                                            currentPermissions.includes(key)
                                                                                        );

                                                                                        if (allSelected) {
                                                                                            // Deselect all in this group
                                                                                            setFormData({
                                                                                                ...formData,
                                                                                                permissions: currentPermissions.filter(
                                                                                                    p => allGroupKeys.indexOf(p as any) === -1
                                                                                                ),
                                                                                            });
                                                                                        } else {
                                                                                            // Select all in this group
                                                                                            const newPermissions = new Set([
                                                                                                ...currentPermissions,
                                                                                                ...allGroupKeys,
                                                                                            ]);
                                                                                            setFormData({
                                                                                                ...formData,
                                                                                                permissions: Array.from(newPermissions),
                                                                                            });
                                                                                        }
                                                                                    }}
                                                                                    className="px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                                                                                >
                                                                                    {selectedCount === totalCount ? 'Deselect' : 'Select All'}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Group Permissions */}
                                                                <div className="p-3 sm:p-4 md:p-5 lg:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                                                                    {groupPermissions.map((permission) => {
                                                                        const isChecked = currentPermissions.includes(permission.key);

                                                                        return (
                                                                            <label
                                                                                key={permission.key}
                                                                                className={`group relative flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 md:p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${isChecked
                                                                                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-500 shadow-sm'
                                                                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                                                                    } ${!isEditing ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md'}`}
                                                                            >
                                                                                <input
                                                                                    type="checkbox"
                                                                                    disabled={!isEditing}
                                                                                    checked={isChecked}
                                                                                    onChange={() => handlePermissionToggle(permission.key)}
                                                                                    className="mt-0.5 sm:mt-1 w-4 h-4 sm:w-5 sm:h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed flex-shrink-0"
                                                                                />
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                                                                        <span className="text-xs sm:text-sm font-bold text-gray-900">
                                                                                            {permission.label}
                                                                                        </span>
                                                                                        {isChecked && (
                                                                                            <FaCheckCircle className="text-green-600 text-[10px] sm:text-xs flex-shrink-0" />
                                                                                        )}
                                                                                    </div>
                                                                                    <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1 leading-tight">
                                                                                        {permission.description}
                                                                                    </p>
                                                                                </div>
                                                                            </label>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </form>
                                </div>

                                {/* Parent Business & Current Month Salary */}
                                <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
                                    {/* Parent Business */}
                                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-5 md:p-6">
                                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                                <FaBuilding className="text-white text-xs sm:text-sm" />
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
                                    {profile?.currentMonthSalary && Object.keys(profile.currentMonthSalary).length > 0 && <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-5 md:p-6 text-white">
                                        <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                                            <FaCalendarAlt className="text-sm sm:text-base" />
                                            <span className="text-sm sm:text-base md:text-lg">Current Month ({format(new Date(profile?.currentMonthSalary?.salaryMonth), "MMM yyyy")})</span>
                                        </h2>
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="flex justify-between items-center pb-2 border-b border-white/20">
                                                <span className="text-xs sm:text-sm opacity-90">Base Salary</span>
                                                <span className="font-bold text-sm sm:text-base">{money.format(profile?.currentMonthSalary?.baseSalary)}</span>
                                            </div>
                                            <div className="flex justify-between items-center pb-2 border-b border-white/20">
                                                <span className="text-xs sm:text-sm opacity-90">Commission</span>
                                                <span className="font-bold text-sm sm:text-base">{money.format(profile?.currentMonthSalary?.totalCommission)}</span>
                                            </div>
                                            <div className="flex justify-between items-center pb-2 border-b border-white/20">
                                                <span className="text-xs sm:text-sm opacity-90">Working Days</span>
                                                <span className="font-bold text-sm sm:text-base">{profile?.currentMonthSalary?.totalWorkingDays}</span>
                                            </div>
                                            <div className="flex justify-between items-center pb-2 border-b border-white/20">
                                                <span className="text-xs sm:text-sm opacity-90">Leave Days</span>
                                                <span className="font-bold text-sm sm:text-base">{profile?.currentMonthSalary?.totalLeaveDays}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-2 bg-white/10 rounded-lg p-2 sm:p-3 mt-2 sm:mt-3">
                                                <span className="font-semibold text-xs sm:text-sm md:text-base">Total Payable</span>
                                                <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">{money.format(profile?.currentMonthSalary?.totalPayable)}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white/10 rounded-lg p-2 sm:p-3">
                                                <span className="font-semibold text-xs sm:text-sm md:text-base">Remaining Due</span>
                                                <span className="text-sm sm:text-base md:text-lg lg:text-xl font-bold">{money.format(profile?.currentMonthSalary?.currentMonthRemainingDue)}</span>
                                            </div>
                                        </div>
                                    </div>}
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
