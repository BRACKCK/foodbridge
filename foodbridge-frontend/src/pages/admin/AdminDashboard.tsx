import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axiosInstance";
import ProfileCard from "../../components/ProfileCard";
import NotificationPanel from "../../components/NotificationPanel";

interface Donation {
  id: number;
  owner: string;
  food: string;
  quantity: string;
  expiry: string;
  status: string;
  match_score: number;
  points: number;
  badge: string;
  co2_saved: number;
  meals_saved: number;
  latitude: number;
  longitude: number;
  created_at: string;
}

interface Notification {
  id: number;
  role: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

function AdminDashboard() {
  const navigate = useNavigate();

  const username = localStorage.getItem("username") || "Admin";
  const role = localStorage.getItem("role") || "";

  const [donations, setDonations] = useState<Donation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");

    if (!token || savedRole !== "admin") {
      navigate("/login");
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [donationRes, notificationRes] = await Promise.all([
        axios.get("donations/"),
        axios.get("donations/notifications/"),
      ]);

      setDonations(donationRes.data);
      setNotifications(notificationRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load admin dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const response = await axios.patch(`donations/${id}/status/`, {
        status: newStatus,
      });

      setDonations((prev) =>
        prev.map((donation) =>
          donation.id === id ? response.data : donation
        )
      );
    } catch (err) {
      console.error(err);
      alert(`Failed to update donation to ${newStatus}`);
    }
  };

  const totalDonations = donations.length;
  const pending = donations.filter((d) => d.status === "Pending").length;
  const accepted = donations.filter((d) => d.status === "Accepted").length;
  const collected = donations.filter((d) => d.status === "Collected").length;
  const delivered = donations.filter((d) => d.status === "Delivered").length;
  const totalMeals = donations.reduce((sum, d) => sum + d.meals_saved, 0);
  const totalCo2 = donations
    .reduce((sum, d) => sum + d.co2_saved, 0)
    .toFixed(2);
  const totalPoints = donations.reduce((sum, d) => sum + d.points, 0);

  return (
    <div className="container mt-5">
      <h2>Admin Dashboard</h2>

      <ProfileCard username={username} role={role} />
      <NotificationPanel />

      <div className="row text-center mt-4 mb-4">
        <div className="col-md-2 mb-3">
          <div className="card p-3 shadow-sm">
            <h6>Total Donations</h6>
            <h3>{totalDonations}</h3>
          </div>
        </div>

        <div className="col-md-2 mb-3">
          <div className="card p-3 shadow-sm">
            <h6>Pending</h6>
            <h3>{pending}</h3>
          </div>
        </div>

        <div className="col-md-2 mb-3">
          <div className="card p-3 shadow-sm">
            <h6>Accepted</h6>
            <h3>{accepted}</h3>
          </div>
        </div>

        <div className="col-md-2 mb-3">
          <div className="card p-3 shadow-sm">
            <h6>Collected</h6>
            <h3>{collected}</h3>
          </div>
        </div>

        <div className="col-md-2 mb-3">
          <div className="card p-3 shadow-sm">
            <h6>Delivered</h6>
            <h3>{delivered}</h3>
          </div>
        </div>

        <div className="col-md-2 mb-3">
          <div className="card p-3 shadow-sm">
            <h6>Total Points</h6>
            <h3>{totalPoints}</h3>
          </div>
        </div>
      </div>

      <div className="row text-center mb-4">
        <div className="col-md-6 mb-3">
          <div className="card p-3 shadow-sm">
            <h6>Meals Saved</h6>
            <h3>{totalMeals}</h3>
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <div className="card p-3 shadow-sm">
            <h6>CO₂ Saved</h6>
            <h3>{totalCo2} kg</h3>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center mt-4">
          <div className="spinner-border text-primary"></div>
        </div>
      )}

      {error && <p className="text-danger mt-3">{error}</p>}

      {!loading && (
        <>
          <div className="card shadow-sm mt-4">
            <div className="card-body">
              <h4 className="mb-3">All Donations</h4>

              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Owner</th>
                    <th>Food</th>
                    <th>Quantity</th>
                    <th>Expiry</th>
                    <th>Status</th>
                    <th>Match Score</th>
                    <th>Points</th>
                    <th>Badge</th>
                    <th>Meals</th>
                    <th>CO₂</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {donations.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center">
                        No donations found
                      </td>
                    </tr>
                  ) : (
                    donations.map((donation) => (
                      <tr key={donation.id}>
                        <td>{donation.owner}</td>
                        <td>{donation.food}</td>
                        <td>{donation.quantity}</td>
                        <td>{new Date(donation.expiry).toLocaleString()}</td>
                        <td>{donation.status}</td>
                        <td>{donation.match_score}</td>
                        <td>{donation.points}</td>
                        <td>{donation.badge}</td>
                        <td>{donation.meals_saved}</td>
                        <td>{donation.co2_saved}</td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            aria-label="Update donation status"
                            value={donation.status}
                            onChange={(e) =>
                              updateStatus(donation.id, e.target.value)
                            }
                          >
                            <option value="Pending">Pending</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Collected">Collected</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card shadow-sm mt-4">
            <div className="card-body">
              <h4 className="mb-3">All Notifications</h4>

              <ul className="list-group">
                {notifications.length === 0 ? (
                  <li className="list-group-item">No notifications found</li>
                ) : (
                  notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className="list-group-item d-flex justify-content-between align-items-start"
                    >
                      <div>
                        <strong>{notification.role.toUpperCase()}</strong>:{" "}
                        {notification.message}
                        <br />
                        <small className="text-muted">
                          {new Date(notification.created_at).toLocaleString()}
                        </small>
                      </div>

                      <span
                        className={`badge ${
                          notification.is_read
                            ? "bg-success"
                            : "bg-warning text-dark"
                        }`}
                      >
                        {notification.is_read ? "Read" : "Unread"}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;