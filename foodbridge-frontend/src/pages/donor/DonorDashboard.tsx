import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axiosInstance";
import ProfileCard from "../../components/ProfileCard";
import NotificationPanel from "../../components/NotificationPanel";
import DonorAnalytics from "../../components/DonorAnalytics";

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

function DonorDashboard() {
  const navigate = useNavigate();

  const username = localStorage.getItem("username") || "User";
  const role = localStorage.getItem("role") || "";

  const [formData, setFormData] = useState({
    food: "",
    quantity: "",
    expiry: "",
    latitude: "-1.2921",
    longitude: "36.8219",
  });

  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");

    if (!token || savedRole !== "donor") {
      navigate("/login");
      return;
    }

    fetchDonations();
  }, [navigate]);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get("donations/");
      setDonations(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load donations");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post("donations/", {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      });

      setDonations([response.data, ...donations]);

      setFormData({
        food: "",
        quantity: "",
        expiry: "",
        latitude: "-1.2921",
        longitude: "36.8219",
      });
    } catch (err) {
      console.error(err);
      alert("Failed to save donation");
    }
  };

  const totalPoints = donations.reduce((sum, d) => sum + d.points, 0);
  const totalMeals = donations.reduce((sum, d) => sum + d.meals_saved, 0);
  const totalCo2 = donations
    .reduce((sum, d) => sum + d.co2_saved, 0)
    .toFixed(2);

  const currentBadge = donations.length > 0 ? donations[0].badge : "Starter";

  return (
    <div className="container mt-5">
      <h2>Donor Dashboard</h2>

      <ProfileCard username={username} role={role} />
      <NotificationPanel />

      <div className="row text-center mt-4 mb-4">
        <div className="col-md-3 mb-3">
          <div className="card p-3 shadow-sm">
            <h5>Total Donations</h5>
            <h3>{donations.length}</h3>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card p-3 shadow-sm">
            <h5>Total Points</h5>
            <h3>{totalPoints}</h3>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card p-3 shadow-sm">
            <h5>Meals Saved</h5>
            <h3>{totalMeals}</h3>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card p-3 shadow-sm">
            <h5>CO₂ Saved</h5>
            <h3>{totalCo2} kg</h3>
          </div>
        </div>
      </div>

      <div className="alert alert-info">
        <strong>Current Badge:</strong> {currentBadge}
      </div>

      <form onSubmit={handleSubmit} className="card p-4 shadow-sm mt-4">
        <label className="form-label">Food Item</label>
        <input
          type="text"
          name="food"
          className="form-control my-2"
          placeholder="Enter food item"
          value={formData.food}
          onChange={handleChange}
          required
        />

        <label className="form-label">Quantity</label>
        <input
          type="text"
          name="quantity"
          className="form-control my-2"
          placeholder="Enter quantity"
          value={formData.quantity}
          onChange={handleChange}
          required
        />

        <label className="form-label">Expiry Date</label>
        <input
          type="datetime-local"
          name="expiry"
          className="form-control my-2"
          placeholder="Select expiry date"
          value={formData.expiry}
          onChange={handleChange}
          required
        />

        <label className="form-label">Latitude</label>
        <input
          type="number"
          step="any"
          name="latitude"
          className="form-control my-2"
          placeholder="Enter latitude"
          value={formData.latitude}
          onChange={handleChange}
          required
        />

        <label className="form-label">Longitude</label>
        <input
          type="number"
          step="any"
          name="longitude"
          className="form-control my-2"
          placeholder="Enter longitude"
          value={formData.longitude}
          onChange={handleChange}
          required
        />

        <button className="btn btn-primary mt-2">Donate</button>
      </form>

      {loading && (
        <div className="text-center mt-4">
          <div className="spinner-border text-primary"></div>
        </div>
      )}

      {error && <p className="text-danger text-center mt-3">{error}</p>}

      {!loading && (
        <>
          <table className="table mt-4">
            <thead>
              <tr>
                <th>Food</th>
                <th>Quantity</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Match Score</th>
                <th>Points</th>
                <th>Badge</th>
                <th>Meals Saved</th>
                <th>CO₂ Saved</th>
              </tr>
            </thead>

            <tbody>
              {donations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center">
                    No donations yet
                  </td>
                </tr>
              ) : (
                donations.map((d) => (
                  <tr key={d.id}>
                    <td>{d.food}</td>
                    <td>{d.quantity}</td>
                    <td>{new Date(d.expiry).toLocaleString()}</td>
                    <td>{d.status}</td>
                    <td>{d.match_score}</td>
                    <td>{d.points}</td>
                    <td>{d.badge}</td>
                    <td>{d.meals_saved}</td>
                    <td>{d.co2_saved} kg</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <DonorAnalytics donations={donations} />
        </>
      )}
    </div>
  );
}

export default DonorDashboard;