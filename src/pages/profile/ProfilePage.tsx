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
  FaBuilding,
  FaBriefcase,
  FaCamera,
  FaSpinner,
  FaPercent,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { uploadFile } from "@/utils/utils";
import FallbackAvatar from "@/components/shared/FallbackAvatar";

interface ProfileData {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  location: string;
  businessName?: string;
  businessType?: string;
  image?: string;
  accountType: "admin" | "shop";
  stuffCommission?: number;
}

const ProfilePage = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { user } = useAuth();

  const { data: profileData, isLoading } = useQuery<ProfileData>({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await AXIOS.get(`/single-user/${user?.id}`);
      setFormData(response.data);
      return response.data;
    },
    enabled: !!user?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await AXIOS.post(`/profile/?userId=${user?.id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
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

        // Upload the file and get the URL
        const imageUrl = await uploadFile(file);

        // Update form data with the returned URL
        setFormData((prev) => ({ ...prev, image: imageUrl }));
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

    // Convert formData to FormData format, similar to OtherShops.tsx
    const submitData = new FormData();

    if (formData.fullName) submitData.append("fullName", formData.fullName);
    if (formData.phoneNumber)
      submitData.append("phoneNumber", formData.phoneNumber);
    if (formData.location) submitData.append("location", formData.location);
    if (formData.businessName)
      submitData.append("businessName", formData.businessName);
    if (formData.businessType)
      submitData.append("businessType", formData.businessType);
    if (formData.image) submitData.append("image", formData.image);

    // Handle stuffCommission similar to OtherShops.tsx
    if (
      formData.stuffCommission !== undefined &&
      formData.stuffCommission !== null
    ) {
      submitData.append("stuffCommission", formData.stuffCommission.toString());
    }

    updateProfileMutation.mutate(submitData);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner color="#32cd32" size="40px" />
      </div>
    );
  }

  const profile = profileData;

  console.log({ profile });

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 relative">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                {/* <img
                  src={previewImage || profile?.image || "/default-avatar.png"}
                  alt={profile?.fullName}
                  className="w-full h-full object-cover"
                /> */}
                <FallbackAvatar
                  src={previewImage || profile?.image || "/default-avatar.png"}
                  alt={profile?.fullName}
                  className="w-full h-full object-cover"
                />
                {isEditing && (
                  <div
                    onClick={handleImageClick}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FaCamera className="text-white text-2xl" />
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
            <h1 className="text-white text-xl sm:text-3xl font-bold mt-4">
              {profile.fullName}
            </h1>
            <p className="text-white/80 mt-2 capitalize">
              {profile.accountType}
            </p>
          </div>
        </div>

        {/* Profile Content */}
        <div className="px-8 py-6">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
                    className="pl-10 w-full py-[6px] rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    disabled
                    value={profile?.email}
                    className="pl-10 w-full py-[6px] rounded-md border border-gray-300 bg-gray-50 text-gray-500"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    disabled={!isEditing}
                    value={formData?.phoneNumber || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phoneNumber: e.target.value,
                      }))
                    }
                    className="pl-10 w-full py-[6px] rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData?.location || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    className="pl-10 w-full py-[6px] rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              {/* Business Fields (Only for shop role) */}
              {profile.accountType === "shop" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <div className="relative">
                      <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={formData?.businessName || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            businessName: e.target.value,
                          }))
                        }
                        className="pl-10 w-full py-[6px] rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Type
                    </label>
                    <div className="relative">
                      <FaBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={formData?.businessType || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            businessType: e.target.value,
                          }))
                        }
                        className="pl-10 w-full py-[6px] rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stuff Sell Commission (%)
                    </label>
                    <div className="relative">
                      <FaPercent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        disabled={!isEditing}
                        value={formData?.stuffCommission?.toString() || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            stuffCommission: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          }))
                        }
                        placeholder="Enter commission percentage"
                        className="pl-10 w-full py-[6px] rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center sm:justify-end gap-2 sm:gap-4 mt-8">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(profile);
                      setPreviewImage(null);
                    }}
                    className="sm:px-6 px-4 py-2 text-xs whitespace-nowrap border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="sm:px-6 px-4 py-2 text-xs whitespace-nowrap bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
