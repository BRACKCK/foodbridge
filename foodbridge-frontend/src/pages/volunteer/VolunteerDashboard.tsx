import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axiosInstance";
import ProfileCard from "../../components/ProfileCard";
import NotificationPanel from "../../components/NotificationPanel";
import VolunteerRouteMap from "../../components/VolunteerRouteMap";

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

function VolunteerDashboard() {
  const navigate = useNavigate();

  const username = localStorage.getItem("username") || "User";
  const role = localStorage.getItem("role") || "";

  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    if (!token || savedRole !== "volunteer") {
      navigate("/login");
      return;
    }

    fetchDonations();
  }, [navigate]);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get("donations/");
      setDonations(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load donations");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const response = await axios.patch(`donations/${id}/status/`, {
        status: newStatus,
      });

      setDonations((prevDonations) =>
        prevDonations.map((donation) =>
          donation.id === id ? response.data : donation
        )
      );
    } catch (err) {
      console.error(err);
      alert(`Failed to mark donation as ${newStatus}`);
    }
  };

  const activeRouteDonations = donations.filter(
    (d) => d.status === "Accepted" || d.status === "Collected"
  );

  return (
    <div className="container mt-5">
      <h2>Volunteer Dashboard</h2>

      <ProfileCard username={username} role={role} />
      <NotificationPanel />

      <p className="text-muted">Manage pickups and deliveries.</p>

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
              <h4 className="mb-3">Assigned Donations</h4>

              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Owner</th>
                    <th>Food</th>
                    <th>Quantity</th>
                    <th>Expiry</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {donations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center">
                        No donations available for delivery
                      </td>
                    </tr>
                  ) : (
                    donations.map((donation) => (
                      <tr key={donation.id}>
                        <td>{donation.owner}</td>
                        <td>{donation.food}</td>
                        <td>{donation.quantity}</td>
                        <td>{new Date(donation.expiry).toLocaleString()}</td>
                        <td>
                          <span
                            className={`badge ${
                              donation.status === "Delivered"
                                ? "bg-success"
                                : donation.status === "Collected"
                                ? "bg-info text-dark"
                                : "bg-warning text-dark"
                            }`}
                          >
                            {donation.status}
                          </span>
                        </td>
                        <td>
                          {donation.status === "Accepted" && (
                            <button
                              className="btn btn-sm btn-primary me-2"
                              onClick={() =>
                                updateStatus(donation.id, "Collected")
                              }
                            >
                              Mark Collected
                            </button>
                          )}

                          {donation.status === "Collected" && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() =>
                                updateStatus(donation.id, "Delivered")
                              }
                            >
                              Mark Delivered
                            </button>
                          )}

                          {donation.status === "Delivered" && (
                            <span className="text-muted">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <VolunteerRouteMap donations={activeRouteDonations} />
        </>
      )}
    </div>
  );
}

export default VolunteerDashboard;