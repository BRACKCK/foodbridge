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

function NGODashboard() {
  const navigate = useNavigate();

  const username = localStorage.getItem("username") || "User";
  const role = localStorage.getItem("role") || "";

  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    if (!token || savedRole !== "ngo") {
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

  const handleAcceptDonation = async (id: number) => {
    try {
      const response = await axios.patch(`donations/${id}/status/`, {
        status: "Accepted",
      });

      setDonations((prevDonations) =>
        prevDonations.map((donation) =>
          donation.id === id ? response.data : donation
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to accept donation");
    }
  };

  return (
    <div className="container mt-5">
      <h2>NGO Dashboard</h2>

      <ProfileCard username={username} role={role} />
      <NotificationPanel />

      <p className="text-muted">View and accept available donations.</p>

      {loading && (
        <div className="text-center mt-4">
          <div className="spinner-border text-primary"></div>
        </div>
      )}

      {error && <p className="text-danger mt-3">{error}</p>}

      {!loading && (
        <div className="card shadow-sm mt-4">
          <div className="card-body">
            <h4 className="mb-3">Available Donations</h4>

            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Owner</th>
                  <th>Food</th>
                  <th>Quantity</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Match Score</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {donations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center">
                      No donations available
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
                            donation.status === "Accepted"
                              ? "bg-success"
                              : donation.status === "Delivered"
                              ? "bg-primary"
                              : donation.status === "Collected"
                              ? "bg-info text-dark"
                              : "bg-warning text-dark"
                          }`}
                        >
                          {donation.status}
                        </span>
                      </td>
                      <td>{donation.match_score}</td>
                      <td>
                        {donation.status === "Pending" ? (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleAcceptDonation(donation.id)}
                          >
                            Accept
                          </button>
                        ) : (
                          <span className="text-muted">No action</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default NGODashboard;