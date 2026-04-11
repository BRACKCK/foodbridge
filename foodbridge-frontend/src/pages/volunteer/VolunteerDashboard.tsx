import { useEffect, useState, useCallback, useMemo, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axiosInstance";
import ProfileCard from "../../components/ProfileCard";
import NotificationPanel from "../../components/NotificationPanel";
import VolunteerRouteMap from "../../components/VolunteerRouteMap";
import "./VolunteerDashboard.css";

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

interface VolunteerStats {
  totalDeliveries: number;
  totalMealsDelivered: number;
  totalCO2Saved: string;
  totalPoints: number;
  currentBadge: string;
  activeDeliveries: number;
  completedToday: number;
}

function VolunteerDashboard() {
  const navigate = useNavigate();

  const username = localStorage.getItem("username") || "User";
  const role = localStorage.getItem("role") || "";

  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showMap, setShowMap] = useState(true);

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

  const stats = useMemo<VolunteerStats>(() => {
    const deliveredDonations = donations.filter(d => d.status === "Delivered");
    const activeDonations = donations.filter(d => d.status === "Accepted" || d.status === "Collected");
    const today = new Date().toDateString();
    const completedToday = donations.filter(d => 
      d.status === "Delivered" && 
      new Date(d.created_at).toDateString() === today
    ).length;

    return {
      totalDeliveries: deliveredDonations.length,
      totalMealsDelivered: deliveredDonations.reduce((sum, d) => sum + d.meals_saved, 0),
      totalCO2Saved: deliveredDonations.reduce((sum, d) => sum + d.co2_saved, 0).toFixed(2),
      totalPoints: donations.reduce((sum, d) => sum + d.points, 0),
      currentBadge: donations.length > 0 ? donations[0].badge : "Starter",
      activeDeliveries: activeDonations.length,
      completedToday,
    };
  }, [donations]);

  const fetchDonations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<Donation[]>("donations/");
      setDonations(response.data);
    } catch (err) {
      console.error("Failed to load donations:", err);
      setError("Failed to load donations. Please try again.");
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
        d.food.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.owner.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by expiry date (urgent first)
    filtered.sort((a, b) => 
      new Date(a.expiry).getTime() - new Date(b.expiry).getTime()
    );

    setFilteredDonations(filtered);
  }, [donations, searchTerm, statusFilter]);

  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    if (!token || savedRole !== "volunteer") {
      navigate("/login");
      return;
    }

    fetchDonations();
  }, [navigate, fetchDonations]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const response = await axios.patch<Donation>(`donations/${id}/status/`, {
        status: newStatus,
      });

      setDonations((prevDonations) =>
        prevDonations.map((donation) =>
          donation.id === id ? response.data : donation
        )
      );

      const actionText = newStatus === "Collected" ? "picked up" : "delivered";
      setSuccessMessage(`Donation #${id} marked as ${actionText}!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(`Failed to mark donation as ${newStatus}:`, err);
      setError(`Failed to update donation status. Please try again.`);
      setTimeout(() => setError(null), 5000);
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
      "Accepted": "bg-primary",
      "Collected": "bg-info",
      "Delivered": "bg-success",
      "Pending": "bg-warning",
    };
    return statusMap[status] || "bg-secondary";
  };

  const getExpiryClass = (expiry: string): string => {
    const daysLeft = Math.ceil((new Date(expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return "expired";
    if (daysLeft <= 1) return "urgent";
    if (daysLeft <= 3) return "warning";
    return "";
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `${diffDays} days left`;
    return date.toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activeRouteDonations = donations.filter(
    (d) => d.status === "Accepted" || d.status === "Collected"
  );

  return (
    <div className="volunteer-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="dashboard-title">
                <i className="bi bi-bicycle me-2"></i>
                Volunteer Dashboard
              </h1>
              <p className="dashboard-subtitle">
                Pick up and deliver food donations to those in need
              </p>
            </div>
            <div className="col-md-4">
              <div className="dashboard-header-actions">
                <button 
                  className="btn btn-light me-2"
                  onClick={handleRefresh}
                  disabled={loading}
                  aria-label="Refresh dashboard"
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

        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-2">
            <div className="stat-card">
              <div className="stat-icon bg-primary bg-opacity-10 text-primary">
                <i className="bi bi-truck"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.activeDeliveries}</h3>
                <p className="stat-label">Active Deliveries</p>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-2">
            <div className="stat-card">
              <div className="stat-icon bg-success bg-opacity-10 text-success">
                <i className="bi bi-check-circle"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalDeliveries}</h3>
                <p className="stat-label">Total Deliveries</p>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-2">
            <div className="stat-card">
              <div className="stat-icon bg-info bg-opacity-10 text-info">
                <i className="bi bi-calendar-check"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.completedToday}</h3>
                <p className="stat-label">Completed Today</p>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-2">
            <div className="stat-card">
              <div className="stat-icon bg-warning bg-opacity-10 text-warning">
                <i className="bi bi-star-fill"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalPoints}</h3>
                <p className="stat-label">Total Points</p>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-2">
            <div className="stat-card">
              <div className="stat-icon bg-success bg-opacity-10 text-success">
                <i className="bi bi-egg-fried"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalMealsDelivered}</h3>
                <p className="stat-label">Meals Delivered</p>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-2">
            <div className="stat-card">
              <div className="stat-icon bg-info bg-opacity-10 text-info">
                <i className="bi bi-tree-fill"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalCO2Saved} kg</h3>
                <p className="stat-label">CO₂ Saved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Badge Display */}
        <div className="volunteer-badge-card mb-4">
          <div className="current-badge">
            <div className="badge-icon">
              <i className="bi bi-award-fill"></i>
            </div>
            <div className="badge-info">
              <span className="badge-label">Current Badge</span>
              <span className="badge-name">{stats.currentBadge}</span>
            </div>
          </div>
          <div className="badge-message">
            <i className="bi bi-info-circle me-2"></i>
            Complete more deliveries to earn points and unlock new badges!
          </div>
        </div>

        {/* Map Toggle */}
        {activeRouteDonations.length > 0 && (
          <div className="map-toggle-section mb-3">
            <button 
              className="btn btn-outline-primary"
              onClick={() => setShowMap(!showMap)}
            >
              <i className={`bi bi-${showMap ? 'eye-slash' : 'eye'} me-2`}></i>
              {showMap ? 'Hide Route Map' : 'Show Route Map'}
            </button>
          </div>
        )}

        {/* Route Map */}
        {showMap && activeRouteDonations.length > 0 && (
          <div className="map-card mb-4">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="bi bi-map me-2"></i>
                Active Delivery Routes
              </h4>
            </div>
            <div className="card-body p-0">
              <VolunteerRouteMap donations={activeRouteDonations} />
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
                  Available Donations
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
                      placeholder="Search food or donor..."
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
                    <option value="accepted">Ready for Pickup</option>
                    <option value="collected">In Transit</option>
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
                <p className="text-secondary">Loading donations...</p>
              </div>
            ) : filteredDonations.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-inbox empty-icon"></i>
                <h5 className="mt-3">No donations found</h5>
                <p className="text-secondary">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your filters" 
                    : "No deliveries available at the moment"}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table donations-table">
                  <thead>
                    <tr>
                      <th className="ps-4">Donor</th>
                      <th>Food Item</th>
                      <th>Quantity</th>
                      <th>Expiry</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Impact</th>
                      <th className="pe-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonations.map((donation) => (
                      <tr key={donation.id} className={getExpiryClass(donation.expiry)}>
                        <td className="ps-4" data-label="Donor">
                          <div className="donor-info">
                            <div className="donor-avatar">
                              {donation.owner.charAt(0).toUpperCase()}
                            </div>
                            <span className="donor-name">{donation.owner}</span>
                          </div>
                        </td>
                        <td data-label="Food Item">
                          <span className="fw-medium">{donation.food}</span>
                        </td>
                        <td data-label="Quantity">{donation.quantity}</td>
                        <td data-label="Expiry">
                          <span className={`expiry-badge ${getExpiryClass(donation.expiry)}`}>
                            <i className="bi bi-clock me-1"></i>
                            {formatDate(donation.expiry)}
                          </span>
                        </td>
                        <td data-label="Location">
                          <div className="location-info">
                            <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                            <span>
                              {donation.latitude.toFixed(4)}, {donation.longitude.toFixed(4)}
                            </span>
                          </div>
                        </td>
                        <td data-label="Status">
                          <span className={`badge ${getStatusBadgeClass(donation.status)}`}>
                            {donation.status === "Accepted" && "Ready"}
                            {donation.status === "Collected" && "In Transit"}
                            {donation.status === "Delivered" && "Delivered"}
                            {donation.status === "Pending" && "Pending"}
                          </span>
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
                            <span className="impact-badge" title="Points">
                              <i className="bi bi-star-fill text-warning"></i>
                              {donation.points}
                            </span>
                          </div>
                        </td>
                        <td className="pe-4" data-label="Action">
                          {donation.status === "Accepted" && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => updateStatus(donation.id, "Collected")}
                              aria-label="Mark as collected"
                            >
                              <i className="bi bi-box-seam me-1"></i>
                              Pick Up
                            </button>
                          )}

                          {donation.status === "Collected" && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => updateStatus(donation.id, "Delivered")}
                              aria-label="Mark as delivered"
                            >
                              <i className="bi bi-check-lg me-1"></i>
                              Deliver
                            </button>
                          )}

                          {donation.status === "Delivered" && (
                            <span className="completed-badge">
                              <i className="bi bi-check-circle-fill text-success me-1"></i>
                              Completed
                            </span>
                          )}

                          {donation.status === "Pending" && (
                            <span className="text-muted">
                              <i className="bi bi-clock me-1"></i>
                              Waiting
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VolunteerDashboard;