import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AXIOS from "@/api/network/Axios";
import { format } from "date-fns";
import { FaBell, FaCheck, FaCheckDouble, FaTrash, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";

import { useNavigate } from "react-router-dom";
import { NOTIFICATIONS_URL, MARK_ALL_READ_URL } from "@/api/api";
import Pagination from "@/components/Pagination";
import Modal from "@/components/Modal";
import Invoice from "@/components/Invoice";

const NotificationsPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<"unread" | "read">("unread");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    // State for viewing invoice
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

    const { data: notificationsData, isLoading } = useQuery({
        queryKey: ["notifications", activeTab, page],
        queryFn: async () => {
            const params: any = {
                page,
                limit: pageSize,
                is_read: activeTab === "read",
            };
            const res = await AXIOS.get(NOTIFICATIONS_URL, { params });
            return res.data;
        },
    });

    const markAsReadMutation = useMutation({
        mutationFn: async (id: number) => {
            await AXIOS.patch(`${NOTIFICATIONS_URL}/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notification-count"] });
            toast.success("Marked as read");
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            await AXIOS.patch(MARK_ALL_READ_URL);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notification-count"] });
            toast.success("All notifications marked as read");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await AXIOS.delete(`${NOTIFICATIONS_URL}/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            toast.success("Notification deleted");
        },
    });

    const handleNotificationClick = (notification: any) => {
        if (!notification.is_read) {
            markAsReadMutation.mutate(notification.id);
        }

        // Open Invoice for order related notifications
        if (notification.reference_type === 'order' && notification.reference_id) {
            setSelectedOrderId(Number(notification.reference_id));
            return;
        }

        if (notification.link) {
            navigate(notification.link);
        }
    };

    const notifications = notificationsData?.notifications || notificationsData?.data?.notifications || [];
    const pagination = notificationsData?.pagination || notificationsData?.data?.pagination || {
        page: 1,
        pageSize: 10,
        totalPages: 1,
        totalItems: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    };

    return (
        <div className="p-0 sm:p-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:items-center mb-4 sm:mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800">Notifications</h1>
                        <p className="text-sm text-gray-600">View and manage all your notifications</p>
                    </div>
                    {activeTab === 'unread' && notifications.length > 0 && (
                        <button
                            onClick={() => markAllReadMutation.mutate()}
                            disabled={markAllReadMutation.isPending}
                            className="w-full sm:w-auto px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-hover transition-colors flex justify-center items-center gap-2 text-sm font-medium"
                        >
                            {markAllReadMutation.isPending ? <FaSpinner className="animate-spin" /> : <FaCheckDouble />}
                            Mark All as Read
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex border-b mb-4 sm:mb-6 overflow-x-auto scrollbar-hide">
                    <button
                        className={`px-3 sm:px-6 py-2 sm:py-3 font-medium text-xs sm:text-sm transition-colors relative whitespace-nowrap flex-1 sm:flex-none text-center ${activeTab === "unread"
                            ? "text-brand-primary border-b-2 border-brand-primary"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                        onClick={() => { setActiveTab("unread"); setPage(1); }}
                    >
                        Unread
                    </button>
                    <button
                        className={`px-3 sm:px-6 py-2 sm:py-3 font-medium text-xs sm:text-sm transition-colors relative whitespace-nowrap flex-1 sm:flex-none text-center ${activeTab === "read"
                            ? "text-brand-primary border-b-2 border-brand-primary"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                        onClick={() => { setActiveTab("read"); setPage(1); }}
                    >
                        Read History
                    </button>
                </div>

                {/* Filters Placeholder (hidden for now but structure ready) */}
                {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"> ... </div> */}

                {/* List */}
                <div className="min-h-[400px]">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <Spinner />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <FaBell className="text-4xl mb-3 text-gray-300" />
                            <p className="font-medium">No notifications found</p>
                            <p className="text-xs mt-1">You're all caught up!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notifications.map((notif: any) => (
                                <div
                                    key={notif.id}
                                    className={`p-2 sm:p-4 border rounded-lg hover:shadow-md transition-shadow flex flex-wrap sm:flex-nowrap gap-2 sm:gap-4 cursor-pointer group ${!notif.is_read ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-gray-100'}`}
                                    onClick={() => handleNotificationClick(notif)}
                                >
                                    <div className="mt-1 shrink-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${notif.type === 'STOCK_OUT' ? 'bg-red-100 text-red-600' :
                                            notif.type === 'STOCK_LOW' ? 'bg-yellow-100 text-yellow-600' :
                                                'bg-brand-primary/10 text-brand-primary'
                                            }`}>
                                            <FaBell />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className={`text-sm font-semibold truncate pr-2 ${!notif.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {notif.title}
                                            </h3>
                                            <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                                                {format(new Date(notif.createdAt), 'MMM dd, HH:mm')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2 break-words">{notif.message}</p>
                                    </div>
                                    <div className="w-full sm:w-auto flex flex-row sm:flex-col justify-end sm:justify-center gap-2 mt-2 sm:mt-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100 sm:border-none">
                                        {!notif.is_read && (
                                            <button
                                                title="Mark as read"
                                                onClick={(e) => { e.stopPropagation(); markAsReadMutation.mutate(notif.id); }}
                                                className="p-2 text-gray-400 hover:text-brand-primary rounded-full hover:bg-gray-100 transition-colors"
                                            >
                                                <FaCheck />
                                            </button>
                                        )}
                                        <button
                                            title="Delete"
                                            onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(notif.id); }}
                                            className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition-colors"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 0 && (
                    <div className="mt-6 border-t pt-4">
                        <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.totalPages}
                            totalItems={pagination.totalItems}
                            pageSize={pagination.pageSize}
                            hasNextPage={pagination.hasNextPage}
                            hasPreviousPage={pagination.hasPreviousPage}
                            onPageChange={(p) => setPage(p)}
                        />
                    </div>
                )}
            </div>

            {/* Invoice Modal */}
            <Modal
                isOpen={!!selectedOrderId}
                onClose={() => setSelectedOrderId(null)}
                title="View Invoice"
                className="lg:!max-w-[800px] !max-w-[95vw]"
            >
                {selectedOrderId && (
                    <Invoice
                        orderId={selectedOrderId}
                        onClose={() => setSelectedOrderId(null)}
                        onPrint={() => { }}
                    />
                )}
            </Modal>
        </div>
    );
};

// Helper for Spinner
const Spinner = () => (
    <FaSpinner className="animate-spin text-3xl text-brand-primary" />
);

export default NotificationsPage;
