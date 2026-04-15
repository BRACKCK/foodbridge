import { useEffect, useState, useCallback } from "react";
import axios from "../api/axiosInstance";

interface Notification {
  id: number;
  role: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const NotificationPanel = () => {
  const role = localStorage.getItem("role") || "";
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get<Notification[]>(
        `donations/notifications/?role=${role}`
      );
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [role]);

  const markAsRead = async (id: number) => {
    try {
      await axios.patch(`donations/notifications/${id}/read/`);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_read: true } : item
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const deleteNotification = async (id: number) => {
    setDeletingId(id);
    try {
      await axios.delete(`donations/notifications/${id}/delete/`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const deleteAllNotifications = async () => {
    if (!window.confirm("Delete all notifications? This cannot be undone.")) return;
    setClearingAll(true);
    try {
      await axios.delete(`donations/notifications/delete-all/?role=${role}`);
      setNotifications([]);
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    } finally {
      setClearingAll(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        {/* ── Header row ── */}
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <h5 className="mb-0">
              <i className="bi bi-bell-fill text-primary me-2" />
              Notifications
            </h5>
            {unreadCount > 0 && (
              <span className="badge bg-danger rounded-pill">{unreadCount}</span>
            )}
          </div>

          {notifications.length > 0 && (
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={deleteAllNotifications}
              disabled={clearingAll}
              title="Delete all notifications"
            >
              {clearingAll ? (
                <span className="spinner-border spinner-border-sm" />
              ) : (
                <>
                  <i className="bi bi-trash3 me-1" />
                  Clear All
                </>
              )}
            </button>
          )}
        </div>

        {/* ── Body ── */}
        {loading && notifications.length === 0 && (
          <p className="text-muted small">Loading notifications…</p>
        )}

        {!loading && notifications.length === 0 && (
          <div className="text-center py-3 text-muted">
            <i className="bi bi-bell-slash display-6 opacity-25" />
            <p className="mt-2 mb-0 small">No notifications yet.</p>
          </div>
        )}

        <ul className="list-group list-group-flush">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`list-group-item px-0 py-2 ${
                notification.is_read ? "" : "list-group-item-warning"
              }`}
            >
              <div className="d-flex align-items-start gap-2">
                {/* Icon */}
                <i
                  className={`bi bi-${
                    notification.is_read ? "check-circle text-success" : "circle-fill text-warning"
                  } mt-1 flex-shrink-0`}
                />

                {/* Content */}
                <div className="flex-grow-1 min-width-0">
                  <p className="mb-0 small">{notification.message}</p>
                  <small className="text-muted">
                    {new Date(notification.created_at).toLocaleString()}
                  </small>
                </div>

                {/* Actions */}
                <div className="d-flex gap-1 flex-shrink-0">
                  {!notification.is_read && (
                    <button
                      className="btn btn-sm btn-outline-primary py-0 px-2"
                      style={{ fontSize: "0.75rem" }}
                      onClick={() => markAsRead(notification.id)}
                      title="Mark as read"
                    >
                      <i className="bi bi-check2" />
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-outline-danger py-0 px-2"
                    style={{ fontSize: "0.75rem" }}
                    onClick={() => deleteNotification(notification.id)}
                    disabled={deletingId === notification.id}
                    title="Delete notification"
                  >
                    {deletingId === notification.id ? (
                      <span className="spinner-border spinner-border-sm" />
                    ) : (
                      <i className="bi bi-x-lg" />
                    )}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default NotificationPanel;