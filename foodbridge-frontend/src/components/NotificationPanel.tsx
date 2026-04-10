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

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`donations/notifications/?role=${role}`);
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

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchNotifications]); // Now fetchNotifications is properly included

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Notifications</h5>
          <span className="badge bg-danger">{unreadCount} unread</span>
        </div>

        {loading && <p className="text-muted">Loading notifications...</p>}

        {!loading && notifications.length === 0 && (
          <p className="text-muted">No notifications yet.</p>
        )}

        <ul className="list-group">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`list-group-item d-flex justify-content-between align-items-start ${
                notification.is_read ? "" : "list-group-item-warning"
              }`}
            >
              <div>
                <div>{notification.message}</div>
                <small className="text-muted">
                  {new Date(notification.created_at).toLocaleString()}
                </small>
              </div>

              {!notification.is_read && (
                <button
                  className="btn btn-sm btn-outline-primary ms-3"
                  onClick={() => markAsRead(notification.id)}
                >
                  Mark read
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default NotificationPanel;