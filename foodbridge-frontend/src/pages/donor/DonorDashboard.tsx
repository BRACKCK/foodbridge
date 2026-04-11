import { useState, useEffect, useCallback, useMemo, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axiosInstance";
import ProfileCard from "../../components/ProfileCard";
import NotificationPanel from "../../components/NotificationPanel";
import DonorAnalytics from "../../components/DonorAnalytics";
import "./DonorDashboard.css";

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

interface DonationFormData {
  food: string;
  quantity: string;
  expiry: string;
  latitude: string;
  longitude: string;
}

interface ImpactStats {
  totalDonations: number;
  totalPoints: number;
  totalMeals: number;
  totalCO2: string;
  currentBadge: string;
  nextBadge: string;
  pointsToNextBadge: number;
}

function DonorDashboard() {
  const navigate = useNavigate();

  const username = localStorage.getItem("username") || "User";
  const role = localStorage.getItem("role") || "";

  const [formData, setFormData] = useState<DonationFormData>({
    food: "",
    quantity: "",
    expiry: "",
    latitude: "-1.2921",
    longitude: "36.8219",
  });

  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDonationForm, setShowDonationForm] = useState(false);

  // Remove root element width constraints
  useEffect(() => {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.style.width = '100%';
      rootElement.style.maxWidth = '100%';
      rootElement.style.margin = '0';
      rootElement.style.padding = '0';
    }
    
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.width = '100%';
    document.body.style.overflowX = 'hidden';
  }, []);

  // Calculate impact stats
  const stats = useMemo<ImpactStats>(() => {
    const totalPoints = donations.reduce((sum, d) => sum + d.points, 0);
    const totalMeals = donations.reduce((sum, d) => sum + d.meals_saved, 0);
    const totalCO2 = donations.reduce((sum, d) => sum + d.co2_saved, 0).toFixed(2);
    const currentBadge = donations.length > 0 ? donations[0].badge : "Starter";
    
    // Determine next badge based on points
    const badgeThresholds: Record<string, number> = {
      "Starter": 0,
      "Bronze": 100,
      "Silver": 250,
      "Gold": 500,
      "Platinum": 1000,
    };
    
    const badges = Object.entries(badgeThresholds);
    const nextBadgeEntry = badges.find(([, threshold]) => threshold > totalPoints);
    const nextBadge = nextBadgeEntry ? nextBadgeEntry[0] : "Platinum";
    const pointsToNextBadge = nextBadgeEntry ? nextBadgeEntry[1] - totalPoints : 0;

    return {
      totalDonations: donations.length,
      totalPoints,
      totalMeals,
      totalCO2,
      currentBadge,
      nextBadge,
      pointsToNextBadge,
    };
  }, [donations]);

  const fetchDonations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get<Donation[]>("donations/");
      setDonations(res.data);
    } catch (err) {
      console.error("Failed to load donations:", err);
      setError("Unable to load donations. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...donations];

    if (statusFilter !== "all") {
      filtered = filtered.filter(d => d.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.food.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by newest first
    filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setFilteredDonations(filtered);
  }, [donations, searchTerm, statusFilter]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");

    if (!token || savedRole !== "donor") {
      navigate("/login");
      return;
    }

    fetchDonations();
  }, [navigate, fetchDonations]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await axios.post<Donation>("donations/", {
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
      
      setShowDonationForm(false);
      setSuccessMessage("Donation posted successfully! Thank you for your contribution.");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error("Failed to save donation:", err);
      setError("Failed to post donation. Please check your inputs and try again.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleRefresh = () => {
    fetchDonations();
  };

  const getStatusBadgeClass = (status: string): string => {
    const statusMap: Record<string, string> = {
      "Accepted": "bg-success",
      "Delivered": "bg-primary",
      "Collected": "bg-info",
      "Pending": "bg-warning",
      "Cancelled": "bg-danger",
    };
    return statusMap[status] || "bg-secondary";
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getExpiryClass = (expiry: string): string => {
    const daysLeft = Math.ceil((new Date(expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return "expired";
    if (daysLeft <= 1) return "urgent";
    if (daysLeft <= 3) return "warning";
    return "";
  };

  return (
    <div className="donor-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="dashboard-title">
                <i className="bi bi-gift-fill me-2"></i>
                Donor Dashboard
              </h1>
              <p className="dashboard-subtitle">
                Share surplus food, earn rewards, and track your impact
              </p>
            </div>
            <div className="col-md-4">
              <div className="dashboard-header-actions">
                <button 
                  className="btn btn-light me-2"
                  onClick={handleRefresh}
                  disabled={loading}
                  aria-label="Refresh donations"
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Refresh
                </button>
                <ProfileCard username={username} role={role} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid py-4">
        {/* Notifications */}
        <NotificationPanel />
        
        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            {successMessage}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setSuccessMessage(null)}
              aria-label="Close success message"
            ></button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError(null)}
              aria-label="Close error message"
            ></button>
          </div>
        )}

        {/* Impact Stats Cards */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="stat-card">
              <div className="stat-icon bg-primary bg-opacity-10 text-primary">
                <i className="bi bi-box-seam"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalDonations}</h3>
                <p className="stat-label">Total Donations</p>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="stat-card">
              <div className="stat-icon bg-warning bg-opacity-10 text-warning">
                <i className="bi bi-star-fill"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalPoints}</h3>
                <p className="stat-label">Points Earned</p>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="stat-card">
              <div className="stat-icon bg-success bg-opacity-10 text-success">
                <i className="bi bi-egg-fried"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalMeals}</h3>
                <p className="stat-label">Meals Provided</p>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="stat-card">
              <div className="stat-icon bg-info bg-opacity-10 text-info">
                <i className="bi bi-tree-fill"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalCO2} kg</h3>
                <p className="stat-label">CO₂ Saved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Badge Progress Card */}
        <div className="badge-progress-card mb-4">
          <div className="row align-items-center">
            <div className="col-md-4">
              <div className="current-badge">
                <div className="badge-icon">
                  <i className="bi bi-award-fill"></i>
                </div>
                <div className="badge-info">
                  <span className="badge-label">Current Badge</span>
                  <span className="badge-name">{stats.currentBadge}</span>
                </div>
              </div>
            </div>
            <div className="col-md-8">
              <div className="badge-progress">
                <div className="progress-label">
                  <span>Progress to {stats.nextBadge}</span>
                  <span>{stats.pointsToNextBadge} points needed</span>
                </div>
                <div className="progress">
                  <div
                    className="progress-bar bg-warning"
                    style={{ width: `${Math.min((stats.totalPoints / (stats.totalPoints + stats.pointsToNextBadge || 1)) * 100, 100)}%` }}
                    role="progressbar"
                    aria-label={`Progress to next badge`}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions mb-4">
          <button 
            className="btn btn-success btn-lg"
            onClick={() => setShowDonationForm(!showDonationForm)}
          >
            <i className={`bi bi-${showDonationForm ? 'x-lg' : 'plus-lg'} me-2`}></i>
            {showDonationForm ? 'Cancel Donation' : 'Post New Donation'}
          </button>
        </div>

        {/* Donation Form */}
        {showDonationForm && (
          <div className="donation-form-card mb-4">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="bi bi-plus-circle me-2"></i>
                Post a Food Donation
              </h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">
                      <i className="bi bi-tag me-1"></i>
                      Food Item
                    </label>
                    <input
                      type="text"
                      name="food"
                      className="form-control"
                      placeholder="e.g., Fresh Vegetables, Bread, Rice"
                      value={formData.food}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      <i className="bi bi-box me-1"></i>
                      Quantity
                    </label>
                    <input
                      type="text"
                      name="quantity"
                      className="form-control"
                      placeholder="e.g., 5 kg, 20 portions, 10 loaves"
                      value={formData.quantity}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      <i className="bi bi-calendar me-1"></i>
                      Expiry Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      name="expiry"
                      placeholder="Select expiry date and time"
                      className="form-control"
                      value={formData.expiry}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      <i className="bi bi-geo-alt me-1"></i>
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="latitude"
                      className="form-control"
                      placeholder="e.g., -1.2921"
                      value={formData.latitude}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      <i className="bi bi-geo-alt me-1"></i>
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="longitude"
                      className="form-control"
                      placeholder="e.g., 36.8219"
                      value={formData.longitude}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Posting...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-2"></i>
                          Post Donation
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Donations Table Card */}
        <div className="donations-card">
          <div className="donations-card-header">
            <div className="row g-3 align-items-center">
              <div className="col-md-6">
                <h4 className="donations-title">
                  <i className="bi bi-list-ul me-2 text-primary"></i>
                  Your Donations
                  <span className="badge bg-primary ms-3 rounded-pill">{filteredDonations.length}</span>
                </h4>
              </div>
              <div className="col-md-6">
                <div className="donations-filters">
                  <div className="search-wrapper">
                    <i className="bi bi-search search-icon"></i>
                    <input
                      type="text"
                      className="form-control search-input"
                      placeholder="Search food items..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      aria-label="Search donations"
                    />
                  </div>
                  <select 
                    className="form-select filter-select"
                    value={statusFilter}
                    onChange={handleStatusFilterChange}
                    aria-label="Filter by status"
                    title="Filter donations by status"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="collected">Collected</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="donations-card-body">
            {loading ? (
              <div className="loading-state">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-secondary">Loading your donations...</p>
              </div>
            ) : filteredDonations.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-inbox empty-icon"></i>
                <h5 className="mt-3">No donations yet</h5>
                <p className="text-secondary">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your filters" 
                    : "Click 'Post New Donation' to get started"}
                </p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table donations-table">
                    <thead>
                      <tr>
                        <th className="ps-4">Food Item</th>
                        <th>Quantity</th>
                        <th>Expiry</th>
                        <th>Status</th>
                        <th>Match Score</th>
                        <th>Impact</th>
                        <th>Points</th>
                        <th>Badge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDonations.map((donation) => (
                        <tr key={donation.id} className={getExpiryClass(donation.expiry)}>
                          <td className="ps-4" data-label="Food Item">
                            <div className="food-info">
                              <div className="food-icon">
                                <i className="bi bi-basket"></i>
                              </div>
                              <span className="food-name">{donation.food}</span>
                            </div>
                          </td>
                          <td data-label="Quantity">
                            <span className="fw-medium">{donation.quantity}</span>
                          </td>
                          <td data-label="Expiry">
                            <span className={`expiry-badge ${getExpiryClass(donation.expiry)}`}>
                              <i className="bi bi-clock me-1"></i>
                              {formatDate(donation.expiry)}
                            </span>
                          </td>
                          <td data-label="Status">
                            <span className={`badge ${getStatusBadgeClass(donation.status)}`}>
                              {donation.status}
                            </span>
                          </td>
                          <td data-label="Match Score">
                            <div className="match-score">
                              <div className="progress match-progress">
                                <div
                                  className="progress-bar bg-success"
                                  style={{ width: `${donation.match_score}%` }}
                                  role="progressbar"
                                  aria-label={`Match score ${donation.match_score} percent`}
                                ></div>
                              </div>
                              <span className="match-score-value">{donation.match_score}%</span>
                            </div>
                          </td>
                          <td data-label="Impact">
                            <div className="impact-badges">
                              <span className="impact-badge" title="Meals Saved">
                                <i className="bi bi-egg-fried text-warning"></i>
                                {donation.meals_saved}
                              </span>
                              <span className="impact-badge" title="CO₂ Saved">
                                <i className="bi bi-tree text-success"></i>
                                {donation.co2_saved}kg
                              </span>
                            </div>
                          </td>
                          <td data-label="Points">
                            <span className="points-badge">
                              <i className="bi bi-star-fill text-warning me-1"></i>
                              {donation.points}
                            </span>
                          </td>
                          <td data-label="Badge">
                            <span className="badge bg-secondary">{donation.badge}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Analytics Component */}
                <div className="analytics-section p-3">
                  <DonorAnalytics donations={donations} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DonorDashboard;