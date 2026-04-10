import { useEffect, useState, useCallback, useMemo, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axiosInstance";
import ProfileCard from "../../components/ProfileCard";
import NotificationPanel from "../../components/NotificationPanel";
import "./NGODashboard.css";

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

interface Stats {
  totalAccepted: number;
  totalMealsSaved: number;
  totalCO2Saved: number;
  averageMatchScore: number;
}

function NGODashboard() {
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
  const [sortBy, setSortBy] = useState<"expiry" | "match_score" | "created_at">("expiry");

  const stats = useMemo<Stats>(() => {
    const acceptedDonations = donations.filter((d) => d.status === "Accepted");

    return {
      totalAccepted: acceptedDonations.length,
      totalMealsSaved: donations.reduce((sum, d) => sum + (d.meals_saved || 0), 0),
      totalCO2Saved: donations.reduce((sum, d) => sum + (d.co2_saved || 0), 0),
      averageMatchScore:
        donations.length > 0
          ? Math.round(donations.reduce((sum, d) => sum + d.match_score, 0) / donations.length)
          : 0,
    };
  }, [donations]);

  const fetchDonations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<Donation[]>("donations/");
      setDonations(response.data);
    } catch (err) {
      console.error("Failed to fetch donations:", err);
      setError("Unable to load donations. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...donations];

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (d) => d.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (d) =>
          d.food.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.owner.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === "expiry") {
        return new Date(a.expiry).getTime() - new Date(b.expiry).getTime();
      }
      if (sortBy === "match_score") {
        return b.match_score - a.match_score;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setFilteredDonations(filtered);
  }, [donations, searchTerm, statusFilter, sortBy]);

  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    if (!token || savedRole !== "ngo") {
      navigate("/login");
      return;
    }

    fetchDonations();
  }, [navigate, fetchDonations]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleAcceptDonation = async (id: number) => {
    try {
      const response = await axios.patch<Donation>(`donations/${id}/status/`, {
        status: "Accepted",
      });

      setDonations((prevDonations) =>
        prevDonations.map((donation) =>
          donation.id === id ? response.data : donation
        )
      );

      setSuccessMessage(`Donation #${id} accepted successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to accept donation:", err);
      setError("Failed to accept donation. Please try again.");
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as "expiry" | "match_score" | "created_at");
  };

  const handleRefresh = () => {
    fetchDonations();
  };

  const getStatusBadgeClass = (status: string): string => {
    const statusMap: Record<string, string> = {
      Accepted: "bg-success",
      Delivered: "bg-primary",
      Collected: "bg-info",
      Pending: "bg-warning",
      Cancelled: "bg-danger",
    };
    return statusMap[status] || "bg-secondary";
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
    return date.toLocaleDateString();
  };

  const getExpiryTextClass = (expiry: string): string => {
    const daysLeft = Math.ceil(
      (new Date(expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft < 0) return "text-danger";
    if (daysLeft <= 2) return "text-warning";
    return "";
  };

  const getTableRowClass = (expiry: string): string => {
    const daysLeft = Math.ceil(
      (new Date(expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft < 0) return "table-danger";
    if (daysLeft <= 2) return "table-warning";
    return "";
  };

  return (
    <div className="ngo-dashboard">
      <div className="dashboard-header">
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="dashboard-title">
                <i className="bi bi-building me-2"></i>
                NGO Dashboard
              </h1>
              <p className="dashboard-subtitle">Manage donations and track your impact</p>
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
        <NotificationPanel />

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

        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="stat-icon bg-primary bg-opacity-10 text-primary">
                <i className="bi bi-box-seam fs-3"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalAccepted}</h3>
                <p className="stat-label">Accepted Donations</p>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="stat-icon bg-success bg-opacity-10 text-success">
                <i className="bi bi-egg-fried fs-3"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalMealsSaved}</h3>
                <p className="stat-label">Meals Saved</p>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="stat-icon bg-info bg-opacity-10 text-info">
                <i className="bi bi-tree fs-3"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalCO2Saved}kg</h3>
                <p className="stat-label">CO₂ Saved</p>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="stat-icon bg-warning bg-opacity-10 text-warning">
                <i className="bi bi-star fs-3"></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.averageMatchScore}%</h3>
                <p className="stat-label">Avg Match Score</p>
              </div>
            </div>
          </div>
        </div>

        <div className="donations-card">
          <div className="donations-card-header">
            <div className="row g-3 align-items-center">
              <div className="col-md-6">
                <h4 className="donations-title">
                  <i className="bi bi-list-ul me-2 text-primary"></i>
                  Available Donations
                  <span className="badge bg-primary ms-3 rounded-pill">
                    {filteredDonations.length}
                  </span>
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
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="collected">Collected</option>
                    <option value="delivered">Delivered</option>
                  </select>

                  <select
                    className="form-select sort-select"
                    value={sortBy}
                    onChange={handleSortChange}
                    aria-label="Sort by"
                    title="Sort donations by"
                  >
                    <option value="expiry">Sort by Expiry</option>
                    <option value="match_score">Sort by Match Score</option>
                    <option value="created_at">Sort by Newest</option>
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
                    : "Check back later for new donations"}
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
                      <th>Status</th>
                      <th>Match Score</th>
                      <th>Impact</th>
                      <th className="pe-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonations.map((donation) => (
                      <tr key={donation.id} className={getTableRowClass(donation.expiry)}>
                        <td className="ps-4" data-label="Donor">
                          <div className="donor-info">
                            <div className="donor-avatar">
                              {donation.owner.charAt(0).toUpperCase()}
                            </div>
                            <span className="donor-name">{donation.owner}</span>
                          </div>
                        </td>

                        <td data-label="Food Item">
                          <span className="food-name">{donation.food}</span>
                        </td>

                        <td data-label="Quantity">{donation.quantity}</td>

                        <td data-label="Expiry">
                          <span className={`expiry-badge ${getExpiryTextClass(donation.expiry)}`}>
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
                            <progress
                              className="match-progress-native"
                              value={donation.match_score}
                              max={100}
                              aria-label={`Match score ${donation.match_score} percent`}
                            />
                            <span className="match-score-value">{donation.match_score}%</span>
                          </div>
                        </td>

                        <td data-label="Impact">
                          <div className="impact-badges">
                            <span className="impact-badge" title="Meals Saved">
                              <i className="bi bi-egg-fried text-warning me-1"></i>
                              {donation.meals_saved}
                            </span>
                            <span className="impact-badge" title="CO₂ Saved">
                              <i className="bi bi-tree text-success me-1"></i>
                              {donation.co2_saved}kg
                            </span>
                          </div>
                        </td>

                        <td className="pe-4" data-label="Action">
                          {donation.status === "Pending" ? (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleAcceptDonation(donation.id)}
                              aria-label={`Accept donation from ${donation.owner}`}
                            >
                              <i className="bi bi-check-lg me-1"></i>
                              Accept
                            </button>
                          ) : donation.status === "Accepted" ? (
                            <button className="btn btn-outline-primary btn-sm" disabled>
                              <i className="bi bi-truck me-1"></i>
                              Awaiting Pickup
                            </button>
                          ) : (
                            <span className="text-muted">—</span>
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

export default NGODashboard;